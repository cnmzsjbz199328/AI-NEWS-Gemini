import { NextRequest, NextResponse } from 'next/server'
import { Speaker } from '@/types'
import { createTTSService } from '@/services/tts-service'

const VALID_SPEAKERS: Speaker[] = ['moderator', 'tom', 'mark']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, speaker } = body

    if (!text || !speaker) {
      return NextResponse.json({ error: 'text and speaker are required' }, { status: 400 })
    }

    if (!VALID_SPEAKERS.includes(speaker)) {
      return NextResponse.json({ error: 'Invalid speaker. Must be moderator, tom, or mark' }, { status: 400 })
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
        'Cache-Control': 'public, max-age=3600',
        'X-TTS-Service': 'Google-Cloud-TTS',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[TTS API] Speech generation error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  const ttsService = createTTSService()
  return NextResponse.json({
    service: 'Google-Cloud-TTS',
    configured: !!ttsService,
    timestamp: new Date().toISOString(),
  })
}
