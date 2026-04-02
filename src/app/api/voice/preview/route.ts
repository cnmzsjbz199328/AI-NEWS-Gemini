/**
 * POST /api/voice/preview - Generate a short audio preview using Google Cloud TTS
 */

import { NextRequest, NextResponse } from 'next/server'
import { Speaker } from '@/types'
import { createTTSService } from '@/services/tts-service'

const VALID_SPEAKERS: Speaker[] = ['moderator', 'tom', 'mark']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, speaker = 'moderator' } = body

    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    if (text.length > 200) {
      return NextResponse.json({ error: 'Preview text too long (max 200 characters)' }, { status: 400 })
    }

    if (!VALID_SPEAKERS.includes(speaker)) {
      return NextResponse.json({ error: 'Invalid speaker' }, { status: 400 })
    }

    const ttsService = createTTSService()
    if (!ttsService) {
      return NextResponse.json({ error: 'TTS_API_KEY not configured' }, { status: 503 })
    }

    const audioBytes = await ttsService.synthesizeSpeech(speaker as Speaker, text)

    return new Response(audioBytes, {
      headers: {
        'Content-Type': 'audio/mp3',
        'Content-Length': audioBytes.byteLength.toString(),
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Voice Preview] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Google-Cloud-TTS',
    usage: 'POST with { text, speaker? }',
    speakers: ['moderator', 'tom', 'mark'],
    maxTextLength: 200,
  })
}
