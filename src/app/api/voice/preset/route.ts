import { NextRequest, NextResponse } from 'next/server'

// 预设音色数据
const PRESET_VOICES = {
  'tom_default': 'https://pub-b436254f85684e9e95bebad4567b11ff.r2.dev/voice/Tom.m4a'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const voiceId = searchParams.get('id')

    if (!voiceId || !PRESET_VOICES[voiceId as keyof typeof PRESET_VOICES]) {
      return NextResponse.json(
        { error: 'Invalid or missing voice ID' },
        { status: 400 }
      )
    }

    const audioUrl = PRESET_VOICES[voiceId as keyof typeof PRESET_VOICES]
    console.log(`[PresetVoice] Downloading ${voiceId} from ${audioUrl}`)

    // 从R2存储下载音频文件
    const response = await fetch(audioUrl, {
      method: 'GET',
      headers: {
        'Accept': 'audio/*',
      }
    })

    if (!response.ok) {
      console.error(`[PresetVoice] Failed to download: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Failed to download preset voice: ${response.statusText}` },
        { status: response.status }
      )
    }

    const audioBuffer = await response.arrayBuffer()
    
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/m4a',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // 缓存1小时
        'Content-Disposition': `attachment; filename="${voiceId}.m4a"`
      }
    })

  } catch (error) {
    console.error('[PresetVoice] Download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}