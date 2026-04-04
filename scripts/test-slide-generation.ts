/**
 * Slide generation pipeline test
 *
 * Tests:
 *   1. Cerebras endpoint connectivity
 *   2. validateSlidePlaylist — unit tests, no network
 *   3. Full end-to-end generation via real Cerebras call
 *
 * Run:
 *   npx tsx --env-file .env --env-file .env.local scripts/test-slide-generation.ts
 */

import { SlideGenerationService } from '../src/lib/services/SlideGenerationService'
import { DebateScript } from '../src/types'

const GREEN  = '\x1b[32m'
const RED    = '\x1b[31m'
const YELLOW = '\x1b[33m'
const RESET  = '\x1b[0m'

function ok(msg: string)   { console.log(`${GREEN}✅ ${msg}${RESET}`) }
function fail(msg: string) { console.log(`${RED}❌ ${msg}${RESET}`) }
function info(msg: string) { console.log(`${YELLOW}ℹ  ${msg}${RESET}`) }
function sep(title: string) {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 50 - title.length))}`)
}

// ─────────────────────────────────────────────────────────────
// Test 1: Cerebras endpoint connectivity
// ─────────────────────────────────────────────────────────────
async function testCerebrasConnectivity(): Promise<boolean> {
  sep('Test 1: Cerebras Endpoint Connectivity')
  const endpoint = 'https://unified-ai-backend.tj15982183241.workers.dev/v1/models/small/cerebras'
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Reply with the single word: OK' }] }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as { choices?: { message?: { content?: string } }[] }
    const content = data.choices?.[0]?.message?.content ?? ''
    ok(`Cerebras reachable — response: "${content.substring(0, 60)}"`)
    return true
  } catch (e) {
    fail(`Cerebras connectivity failed: ${e}`)
    return false
  }
}

// ─────────────────────────────────────────────────────────────
// Test 2: validateSlidePlaylist — pure unit tests (no network)
// ─────────────────────────────────────────────────────────────
function testValidation() {
  sep('Test 2: validateSlidePlaylist (unit)')

  const mockScript: DebateScript = {
    moderator_intro: 'Welcome to AITV.',
    conversation: [
      { speaker: 'tom',  text: 'Tom argues X.' },
      { speaker: 'mark', text: 'Mark counters Y.' },
    ],
    moderator_outro: "That's all for today.",
  }

  // ── Case: valid full playlist
  const validRaw = {
    moderator_intro: { tag: 'MODERATOR · INTRO', title: 'Test Title', points: ['Point A', 'Point B'], stat: null },
    conversation: [
      { speaker: 'tom',  slide: { tag: 'TOM · ANALYSIS',    title: 'Tom Slide',  points: ['P1', 'P2'], stat: 'Stat X' } },
      { speaker: 'mark', slide: { tag: 'MARK · COUNTER',    title: 'Mark Slide', points: ['P3'],        stat: null    } },
    ],
    moderator_outro: { tag: 'MODERATOR · SIGN-OFF', title: 'Outro', points: ['Done'], stat: null },
  }
  const r1 = SlideGenerationService.validateSlidePlaylist(validRaw, mockScript)
  if (r1 && r1.conversation.length === 2 && r1.moderator_intro.title === 'Test Title') {
    ok('Valid playlist passes validation')
  } else {
    fail(`Valid playlist failed — got: ${JSON.stringify(r1)}`)
  }

  // ── Case: partial conversation → fallback fills missing item
  const partialRaw = { ...validRaw, conversation: [validRaw.conversation[0]] }
  const r2 = SlideGenerationService.validateSlidePlaylist(partialRaw, mockScript)
  if (r2 && r2.conversation.length === 2 && r2.conversation[1].speaker === 'mark') {
    ok(`Partial conversation repaired — fallback tag: "${r2.conversation[1].slide.tag}"`)
  } else {
    fail('Partial conversation repair failed')
  }

  // ── Case: null input
  const r3 = SlideGenerationService.validateSlidePlaylist(null, mockScript)
  if (r3 === null) ok('null input returns null correctly')
  else fail('null input did not return null')

  // ── Case: missing required fields (empty tag/title/points)
  const badRaw = {
    moderator_intro: { tag: '', title: '', points: [] },
    conversation: [],
    moderator_outro: null,
  }
  const r4 = SlideGenerationService.validateSlidePlaylist(badRaw, mockScript)
  if (r4 === null) ok('Missing required fields returns null correctly')
  else fail('Missing fields did not return null')

  // ── Case: stat is optional
  const withStatRaw = {
    ...validRaw,
    moderator_intro: { tag: 'TAG', title: 'Title', points: ['P'], stat: 'Some stat' },
  }
  const r5 = SlideGenerationService.validateSlidePlaylist(withStatRaw, mockScript)
  if (r5?.moderator_intro.stat === 'Some stat') ok('stat field preserved correctly')
  else fail(`stat field not preserved — got: ${r5?.moderator_intro.stat}`)
}

// ─────────────────────────────────────────────────────────────
// Test 3: Full generation via real Cerebras call
// ─────────────────────────────────────────────────────────────
async function testFullGeneration() {
  sep('Test 3: Full Slide Generation (real API call)')

  const mockScript: DebateScript = {
    moderator_intro: "Today on AITV we discuss Australia's critical fuel shortage.",
    conversation: [
      { speaker: 'tom',  text: 'Australia imports over 90% of its liquid fuel — a structural vulnerability we cannot ignore.' },
      { speaker: 'mark', text: 'Renewable energy transition is the only sustainable long-term answer to this crisis.' },
    ],
    moderator_outro: "Thank you for watching. That wraps up today's discussion on AITV.",
  }

  info(`Calling Cerebras for ${2 + mockScript.conversation.length}-turn script...`)
  const result = await SlideGenerationService.generateSlides(mockScript)

  if (!result) {
    fail('generateSlides returned null')
    return
  }

  ok(`Received SlidePlaylist — ${result.conversation.length} conversation slide(s)`)
  info(`  intro.title  = "${result.moderator_intro.title}"`)
  info(`  intro.points = ${result.moderator_intro.points.length} items`)
  info(`  conv[0].tag  = "${result.conversation[0].slide.tag}"`)
  info(`  conv[0].stat = "${result.conversation[0].slide.stat ?? 'null'}"`)
  info(`  outro.title  = "${result.moderator_outro.title}"`)

  const assertions: [boolean, string][] = [
    [result.conversation.length === 2, 'conversation.length matches script'],
    [result.conversation[0].speaker === 'tom', 'speaker preserved for turn 0 (tom)'],
    [result.conversation[1].speaker === 'mark', 'speaker preserved for turn 1 (mark)'],
    [result.moderator_intro.points.length >= 1, 'intro has ≥1 point'],
    [result.moderator_outro.points.length >= 1, 'outro has ≥1 point'],
    [typeof result.moderator_intro.tag === 'string' && result.moderator_intro.tag.length > 0, 'intro tag non-empty'],
    [typeof result.moderator_intro.title === 'string' && result.moderator_intro.title.length > 0, 'intro title non-empty'],
  ]

  let passed = 0
  for (const [cond, label] of assertions) {
    if (cond) { ok(label); passed++ } else { fail(label) }
  }

  info(`\n${passed}/${assertions.length} structural assertions passed`)
}

// ─────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Slide Generation Tests ===')

  const connected = await testCerebrasConnectivity()
  testValidation()

  if (connected) {
    await testFullGeneration()
  } else {
    info('Skipping Test 3 — Cerebras unreachable')
  }

  console.log('\n=== Done ===')
}

main().catch(e => {
  console.error('Test runner crashed:', e)
  process.exit(1)
})
