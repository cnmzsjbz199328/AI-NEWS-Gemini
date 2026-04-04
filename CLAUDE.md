# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

AI-NEWS is a Next.js 14 (App Router) application that fetches real news from ABC/BBC RSS feeds, generates a three-character debate script (moderator, tom, mark) via Google Gemini, synthesizes each turn with Google Cloud TTS, and plays the result back in sync with character animations. Pipeline state is shared across serverless invocations via a storage adapter layer (Upstash Redis in production, in-process Map in dev).

---

## Commands

```bash
npm run dev                                                        # start dev server
npx tsc --noEmit                                                   # type-check (must be 0 errors)
npx tsx --env-file .env --env-file .env.local scripts/test-services.ts  # integration test
```

**Gate rule:** `tsc --noEmit` AND `test-services.ts` must both pass before delivering any change that touches `src/lib/` or `src/services/`.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│  Browser (Client)                                       │
│  src/components/   — React UI, no business logic        │
│  src/hooks/        — React hooks, call services only    │
│  src/utils/        — AudioManager → AudioPlayer →       │
│                       AudioQueueManager (singleton)     │
└────────────────────┬────────────────────────────────────┘
                     │ fetch() only — never direct import
┌────────────────────▼────────────────────────────────────┐
│  src/services/     — Client-safe thin fetch wrappers    │
│  tts-service.ts · news.ts · ai-client.ts                │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP
┌────────────────────▼────────────────────────────────────┐
│  src/app/api/      — Next.js API routes (server only)   │
│  pipeline/start · pipeline/status                       │
│  pipeline/task/[id]/mark-played                         │
│  speech/generate · news · voice · voices                │
└────────────────────┬────────────────────────────────────┘
                     │ direct import (server only)
┌────────────────────▼────────────────────────────────────┐
│  src/lib/          — Server-side domain logic           │
│                                                         │
│  PipelineOrchestrator                                   │
│    └─► TaskManager           (business logic)           │
│          └─► TaskStorageService  (storage access only)  │
│                └─► kv/kv-keys.ts · kv/kv-schemas.ts     │
│                └─► kv/redis-client.ts  (adapter)        │
│                                                         │
│  TextGenerationService → ai-worker-pool → ai-providers  │
│  AudioGenerationService → src/services/tts-service.ts   │
└─────────────────────────────────────────────────────────┘
```

### Import Boundaries

| Layer | May import | Must NOT import |
|---|---|---|
| `src/components/` | `hooks/`, `types/`, `utils/` | `src/lib/`, `src/services/` |
| `src/hooks/` | `services/`, `types/`, `utils/` | `src/lib/` |
| `src/services/` | `src/types/` only | `src/lib/`, any Node/server SDK |
| `src/app/api/` | `src/lib/`, `src/types/` | `components/`, `hooks/` |
| `src/lib/` | `src/lib/`, `src/types/` | `components/`, `hooks/`, `services/` |

---

## Pipeline State Machine

A task moves through these statuses in order:

```
PENDING_TEXT → GENERATING_TEXT → GENERATING_AUDIO → READY_TO_PLAY → DONE
                                                          ↓ (mark-played API)
                                                        FAILED (any stage on error)
```

`TaskManager.addAudioSegment()` increments a counter; when `completedCount >= expectedAudioCount` (= 1 intro + 2×rounds + 1 outro), the task transitions to `READY_TO_PLAY` automatically.

The frontend (`usePipelineStatus`) polls `/api/pipeline/status` every ~3s. When `usePlaybackController` detects a `READY_TO_PLAY` task it has not processed:
1. Calls `mark-played` (→ DONE) immediately to prevent replay
2. Fetches all audio blobs from the playlist data URLs
3. Calls `audioManager.setQueueAndPlay(items)`

---

## Storage Adapter

`src/lib/kv/redis-client.ts` exports `getStorageClient()` which returns a `StorageAdapter`. The adapter is a `ResilientAdapter` wrapping Upstash Redis: on any network error (`fetch failed`, `ECONNREFUSED`) it transparently falls back to an in-process `MemoryAdapter`.

The singleton is stored on `globalThis.__storageClient` so all Next.js API routes share the same in-memory state during local dev (avoids each route getting its own empty Map).

**`TaskStorageService` is the only file that calls `getStorageClient()`** — all KV operations go through it.

---

## Audio Playback Chain

```
usePlaybackController
  └─ createAudioQueue()   fetch() each data URL → Blob
  └─ AudioManager.setQueueAndPlay(items)
       └─ tryPlayNext()  — guarded by isPlaying() || _isLoading mutex
            └─ AudioPlayer.playBlob()
                 └─ audio.onplay  → onSpeakerChange('start')  [animation sync]
                 └─ audio.onended → onComplete() → tryPlayNext()
```

`_isLoading` is set true on `playItem()` entry and false on `onComplete()` entry. This closes the ~100ms window where `isPlaying()` is false between items, preventing double-queue-load.

`onSpeakerChange('start')` fires from `audio.onplay` (not before `audio.play()` resolves) so avatar animation is in sync with actual audio output.

---

## Invariants — Never Break

1. **`src/lib/` is server-only.** No component or hook may import from it.
2. **All KV access via `TaskStorageService` only.** No file outside it calls `getStorageClient()` or `redis.*`.
3. **All AI generation via `ai-providers.ts` → `ai-worker-pool.ts`.** Do not instantiate `GoogleGenAI` or other AI SDKs elsewhere.
4. **All TTS calls via `src/services/tts-service.ts`** using `TTS_API_KEY`. It is the sole caller of the Google TTS REST endpoint.
5. **Audio singleton via `getAudioManager()` only.** Nothing else instantiates `AudioManager`, `AudioPlayer`, or `AudioQueueManager`.
6. **Speaker animation state lives in `page.tsx` only.** Hooks fire callbacks; they never own this state.
7. **KV key strings defined only in `src/lib/kv/kv-keys.ts`.** Use `KV_KEYS.*`; never hardcode `ainews:v2:*` strings.
8. **No `console.log` in `src/`.** `scripts/` is the only exception. `console.error` is allowed everywhere.
9. **No backup files, no commented-out code blocks.** Delete, don't comment.
10. **TypeScript strict mode.** Do not use `any` without an inline comment explaining why.

---

## Environment Variables

```bash
# .env (non-secret defaults, committed) / .env.local (secrets, gitignored)
GEMINI_API_KEY=      # Google Gemini — text generation
TTS_API_KEY=         # Google Cloud TTS — API key method (not service account)
KV_REST_API_URL=     # Upstash Redis REST URL  (absent → MemoryAdapter in dev)
KV_REST_API_TOKEN=   # Upstash Redis REST token
```

---

## Common Tasks

### Add a new API route
1. `src/app/api/<name>/route.ts` — import from `src/lib/` and `src/types/` only.
2. Add a thin `fetch` wrapper in `src/services/<name>.ts`.
3. Call from hooks via the service wrapper. No shortcutting the boundary.

### Add a new AI provider
1. Implement `AIProvider` interface in `src/lib/ai-providers.ts`.
2. Register in `getAIProviderForWorker()` mapped to a new `AIWorkerType`.
3. Add its API key to `.env.local` and Vercel env vars.

### Change TTS voices
Edit `SPEAKER_VOICE_CONFIG` in `src/services/tts-service.ts`, then run `test-services.ts`.

### Add a new KV key
1. Add key function to `src/lib/kv/kv-keys.ts`.
2. Add type to `src/lib/kv/kv-schemas.ts`.
3. Add read/write methods to `TaskStorageService` only — nowhere else.

### Change debate prompts
Edit `src/lib/prompt-manager.ts`. Prompts are isolated there.
