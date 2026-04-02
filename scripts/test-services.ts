/**
 * Service connectivity test script
 * Tests: 1) News fetching, 2) Script (text) generation, 3) Google TTS
 *
 * Run: npx tsx --env-file .env.local scripts/test-services.ts
 */

import * as fs from 'fs'
import * as path from 'path'

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'

function ok(msg: string) { console.log(`${GREEN}✅ ${msg}${RESET}`) }
function fail(msg: string) { console.log(`${RED}❌ ${msg}${RESET}`) }
function info(msg: string) { console.log(`${YELLOW}ℹ  ${msg}${RESET}`) }

// ─────────────────────────────────────────────────────────
// 1. News fetching (RSS via rss2json)
// ─────────────────────────────────────────────────────────
async function testNewsFetching() {
  console.log('\n── Test 1: News Fetching ──────────────────────────────')
  const rssUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' +
    encodeURIComponent('https://www.abc.net.au/news/feed/51120/rss.xml')

  try {
    const res = await fetch(rssUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data: any = await res.json()
    if (data.status !== 'ok' || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('Invalid or empty RSS response')
    }
    ok(`ABC News RSS OK — ${data.items.length} items, first: "${data.items[0].title?.slice(0, 60)}..."`)
    return data.items[0].title as string
  } catch (e) {
    fail(`News fetching failed: ${e}`)
    return 'AI regulation in Australia'  // fallback topic for subsequent tests
  }
}

// ─────────────────────────────────────────────────────────
// 2. Script / text generation (Gemini)
// ─────────────────────────────────────────────────────────
async function testScriptGeneration(topic: string) {
  console.log('\n── Test 2: Script Generation (Gemini) ─────────────────')
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) { fail('GEMINI_API_KEY not set'); return false }

  const prompt = `You are a news debate moderator. Given the topic below, write a one-sentence introduction (max 100 chars).
Topic: ${topic}
Reply with ONLY the sentence, no quotes.`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 150 },
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`HTTP ${res.status}: ${err.slice(0, 200)}`)
    }

    const data: any = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!text) throw new Error('Empty response from Gemini')

    ok(`Gemini OK — generated: "${text.slice(0, 100)}"`)
    return true
  } catch (e) {
    fail(`Script generation failed: ${e}`)
    return false
  }
}

// ─────────────────────────────────────────────────────────
// 3. Google Cloud TTS (API key method)
// ─────────────────────────────────────────────────────────
async function testTTS() {
  console.log('\n── Test 3: Google Cloud TTS ───────────────────────────')
  const apiKey = process.env.TTS_API_KEY
  if (!apiKey) { fail('TTS_API_KEY not set'); return }

  const speakers = [
    { id: 'moderator', voice: 'en-US-Neural2-D' },
    { id: 'tom',       voice: 'en-US-Neural2-J' },
    { id: 'mark',      voice: 'en-US-Neural2-A' },
  ]

  const testText = 'Hello, this is a connectivity test.'

  for (const { id, voice } of speakers) {
    try {
      const res = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text: testText },
            voice: { languageCode: 'en-US', name: voice, ssmlGender: 'MALE' },
            audioConfig: { audioEncoding: 'MP3' },
          }),
        }
      )

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`HTTP ${res.status}: ${err.slice(0, 300)}`)
      }

      const data: any = await res.json()
      if (!data.audioContent) throw new Error('No audioContent in response')

      const audioBytes = Buffer.from(data.audioContent, 'base64')
      const outPath = path.join('scripts', `test-tts-${id}.mp3`)
      fs.writeFileSync(outPath, audioBytes)
      ok(`${id} (${voice}) — ${audioBytes.length} bytes → saved to ${outPath}`)
    } catch (e) {
      fail(`TTS failed for ${id}: ${e}`)
    }
  }
}

// ─────────────────────────────────────────────────────────
// Run all tests
// ─────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  AI-NEWS Service Connectivity Test')
  console.log('═══════════════════════════════════════════════════════')

  const topic = await testNewsFetching()
  await testScriptGeneration(topic)
  await testTTS()

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  Done. Check ❌ lines above for any failures.')
  console.log('═══════════════════════════════════════════════════════\n')
}

main().catch(console.error)
