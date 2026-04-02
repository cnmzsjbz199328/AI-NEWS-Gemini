# CLAUDE.md — AI-NEWS Project Specification

## Overview

AI-NEWS is a Next.js 14 (App Router) application that fetches real news from ABC/BBC RSS feeds, generates a debate script between three AI characters (moderator, tom, mark) using Google Gemini, synthesizes speech via Google Cloud TTS, and plays it back in sync with character animations. Pipeline state persists across serverless invocations via Upstash Redis (Vercel KV). Deployment target is Vercel.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│  Browser (Client)                                       │
│  src/components/   — React UI, no business logic        │
│  src/hooks/        — React hooks, call services only    │
│  src/stores/       — Zustand state                      │
│  src/utils/        — AudioManager → AudioPlayer →       │
│                       AudioQueueManager                 │
└────────────────────┬────────────────────────────────────┘
                     │ fetch() only — never direct imports
┌────────────────────▼────────────────────────────────────┐
│  src/services/     — Client-safe thin wrappers          │
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
│  src/lib/          — Server-side services (SERVER ONLY) │
│                                                         │
│  PipelineOrchestrator                                   │
│    └─► TaskManager           (business logic)           │
│          └─► TaskStorageService  (KV access only)       │
│                └─► kv/kv-keys.ts · kv/kv-schemas.ts     │
│                                                         │
│  TextGenerationService                                  │
│    └─► ai-worker-pool.ts                                │
│          └─► ai-providers.ts  (Gemini / Mistral / Reka) │
│                                                         │
│  AudioGenerationService  ──► src/services/tts-service   │
└─────────────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  External                                               │
│  Upstash Redis · Google Gemini · Google TTS · RSS       │
└─────────────────────────────────────────────────────────┘
```

---

## Import Boundaries (never cross these)

| Layer | May import from | Must NOT import from |
|---|---|---|
| `src/components/` | `hooks/`, `stores/`, `types/`, `utils/` | `src/lib/`, `src/services/` |
| `src/hooks/` | `services/`, `stores/`, `types/`, `utils/` | `src/lib/` |
| `src/services/` | `src/types/` only | `src/lib/`, any Node/SDK package |
| `src/app/api/` | `src/lib/`, `src/types/` | `components/`, `hooks/` |
| `src/lib/` | `src/lib/`, `src/types/` | `components/`, `hooks/`, `services/` |

---

## Invariants — Never Break

1. **`src/lib/` is server-only.** No component or hook may import from it.

2. **All KV access via `TaskStorageService` only.** No file outside it may call `redis.*` directly.

3. **All AI generation via `ai-providers.ts` → `ai-worker-pool.ts`.** Do not instantiate `GoogleGenAI`, `Mistral`, or `OpenAI` elsewhere.

4. **All TTS calls via `src/services/tts-service.ts`** using `TTS_API_KEY`. It is the sole caller of the Google TTS REST endpoint.

5. **Audio playback chain: `AudioManager` → `AudioPlayer` → `AudioQueueManager`.** Get the singleton via `getAudioManager()`. Nothing else instantiates these classes.

6. **Speaker state (speaking/idle/thinking) lives in `page.tsx` only**, passed down as props. Hooks fire callbacks; they never own this state.

7. **KV key strings are defined only in `src/lib/kv/kv-keys.ts`.** Use `KV_KEYS.*` everywhere; never hardcode `ainews:v2:*` strings.

8. **No `console.log` in `src/`.** `scripts/` is the only exception.

9. **No backup files, no commented-out code blocks.** Delete, don't comment.

10. **TypeScript strict mode is on.** Do not use `any` without a documented reason.

---

## Environment Variables

```bash
# .env (committed with non-secret defaults) / .env.local (secrets, gitignored)
GEMINI_API_KEY=          # Google Gemini text generation
TTS_API_KEY=             # Google Cloud TTS, API key method
KV_REST_API_URL=         # Upstash Redis REST URL
KV_REST_API_TOKEN=       # Upstash Redis REST token
```

Local dev falls back to an **in-memory store** when `KV_REST_API_URL` / `KV_REST_API_TOKEN` are absent — no Redis required to run locally.

---

## How to Run & Test

```bash
# Start dev server
npm run dev

# Verify all three external services before any delivery
npx tsx --env-file .env --env-file .env.local scripts/test-services.ts

# Type-check
npx tsc --noEmit
```

**All three checks in `test-services.ts` must pass before submitting any change** that touches `src/lib/` or `src/services/`.

---

## Common Tasks

### Add a new API route
1. Create `src/app/api/<name>/route.ts` — import from `src/lib/` and `src/types/` only.
2. Add a thin client wrapper in `src/services/<name>.ts` calling it via `fetch`.
3. Hook → service → API route → lib. No shortcuts.

### Add a new AI provider
1. Implement `AIProvider` interface in `src/lib/ai-providers.ts`.
2. Export a `create<Name>Provider()` factory.
3. Register in `getAIProviderForWorker()` mapped to an `AIWorkerType`.
4. Add API key to `.env.local` and Vercel env vars.

### Change a TTS voice
Edit `SPEAKER_VOICE_CONFIG` in `src/services/tts-service.ts`, then run `test-services.ts`.

### Add a new KV key
1. Add key function to `src/lib/kv/kv-keys.ts`.
2. Add type to `src/lib/kv/kv-schemas.ts`.
3. Add read/write methods to `TaskStorageService` only.

### Change debate prompts
Edit `src/lib/prompt-manager.ts`. Prompts are isolated here.

---

## What NOT to Do

- Import `src/lib/` into components, hooks, or services.
- Call `Redis.fromEnv()` / `new Redis()` outside `TaskStorageService.ts`.
- Call the Google TTS REST API from any file other than `tts-service.ts`.
- Instantiate `AudioPlayer` or `AudioQueueManager` outside `audio-manager.ts`.
- Store speaker animation state in Zustand — it belongs in `page.tsx`.
- Hardcode KV key strings — use `KV_KEYS.*`.
- Create new files when editing an existing one achieves the same goal.
- Ship code that fails `tsc --noEmit` or fails `test-services.ts`.
