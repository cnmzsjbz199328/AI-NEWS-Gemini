import { NextRequest, NextResponse } from 'next/server'
import { IndexTTSService } from '../../../../lib/indexTTS-service'

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId, emotion = 'neutral', speed = 1.0, pitch = 1.0 } = await request.json()

    if (!text || !voiceId) {
      return NextResponse.json(
        { error: 'Text and voiceId are required' },
        { status: 400 }
      )
    }

    // 限制预览文本长度
    if (text.length > 200) {
      return NextResponse.json(
        { error: 'Preview text too long (max 200 characters)' },
        { status: 400 }
      )
    }

    const indexTTSService = new IndexTTSService()

    // 生成预览音频 - 使用moderator作为默认speaker，voiceId作为自定义音色URL
    const result = await indexTTSService.generateSpeech(
      text,
      'moderator', // 使用默认speaker
      voiceId // 将voiceId作为自定义音色URL传递
    )

    if (!result.success || !result.audioBlob) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate preview audio' },
        { status: 500 }
      )
    }

    const audioBlob = result.audioBlob

    if (!audioBlob) {
      return NextResponse.json(
        { error: 'Failed to generate preview audio' },
        { status: 500 }
      )
    }

    // 将Blob转换为ArrayBuffer
    const arrayBuffer = await audioBlob.arrayBuffer()

    // 返回音频数据
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Voice-Id': voiceId,
        'X-Text-Length': text.length.toString()
      }
    })

  } catch (error) {
    console.error('Voice preview generation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Voice preview API endpoint',
      usage: 'POST with { text, voiceId, emotion?, speed?, pitch? }',
      limits: {
        maxTextLength: 200,
        supportedEmotions: ['neutral', 'happy', 'sad', 'angry', 'surprised'],
        speedRange: [0.5, 2.0],
        pitchRange: [0.5, 2.0]
      }
    },
    { status: 200 }
  )
}