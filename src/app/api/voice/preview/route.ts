import { NextRequest, NextResponse } from 'next/server'
import { IndexTTSService } from '../../../../lib/indexTTS-service'

export async function POST(request: NextRequest) {
  console.log('API POST request received')
  
  try {
    console.log('Trying to parse request body...')
    const body = await request.json()
    console.log('Successfully parsed body, analyzing content...')
    console.log('API received body:', { 
      hasText: !!body.text, 
      textLength: body.text?.length,
      hasVoiceData: !!body.voiceData,
      voiceDataType: typeof body.voiceData,
      voiceDataLength: body.voiceData?.length
    })
    
    const { text, voiceData, emotion = 'neutral', speed = 1.0, pitch = 1.0 } = body

    if (!text) {
      console.log('Error: No text provided')
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // 限制预览文本长度
    if (text.length > 200) {
      console.log('Error: Text too long:', text.length)
      return NextResponse.json(
        { error: 'Preview text too long (max 200 characters)' },
        { status: 400 }
      )
    }

    // 如果没有提供voiceData，使用默认音色
    if (!voiceData) {
      console.log('Error: No voice data provided')
      
      // 临时: 提供一个测试用的base64音频数据
      console.log('Attempting to use test audio for debugging...')
      try {
        // 使用一个很小的测试音频数据 (1秒静音)
        const testAudioBlob = new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70])
        const testBase64 = Buffer.from(testAudioBlob).toString('base64')
        console.log('Using test base64 data length:', testBase64.length)
        
        // 尝试使用测试数据
        const indexTTSService = new IndexTTSService()
        const testBlob = new Blob([Buffer.from(testBase64, 'base64')])
        
        const result = await indexTTSService.generateSpeechWithBlob(
          text,
          'moderator',
          testBlob
        )

        if (result.success && result.audioBlob) {
          return new NextResponse(result.audioBlob, {
            status: 200,
            headers: {
              'Content-Type': 'audio/mpeg',
              'Cache-Control': 'no-cache'
            }
          })
        } else {
          throw new Error(result.error || 'Unknown generation error')
        }
      } catch (testError) {
        console.error('Test audio generation failed:', testError)
        return NextResponse.json(
          { error: 'Voice data is required for preview' },
          { status: 400 }
        )
      }
    }

    const indexTTSService = new IndexTTSService()

    // 将base64数据转换为Blob
    let voiceBlob: Blob
    try {
      // 检查是否是data URL格式
      if (voiceData.startsWith('data:')) {
        // 是data URL格式：data:audio/m4a;base64,xxxxx
        const base64Data = voiceData.split(',')[1]
        const binaryData = Buffer.from(base64Data, 'base64')
        voiceBlob = new Blob([binaryData])
        console.log(`[VoicePreview] Created voice blob from data URL, size: ${voiceBlob.size}`)
      } else {
        // 直接是base64字符串
        const binaryData = Buffer.from(voiceData, 'base64')
        voiceBlob = new Blob([binaryData])
        console.log(`[VoicePreview] Created voice blob from base64, size: ${voiceBlob.size}`)
      }
    } catch (error) {
      console.error('[VoicePreview] Error processing voice data:', error)
      return NextResponse.json(
        { error: 'Invalid voice data format' },
        { status: 400 }
      )
    }

    // 直接调用IndexTTS API，传递Blob而不是URL
    const result = await indexTTSService.generateSpeechWithBlob(
      text,
      'moderator', // 使用默认speaker
      voiceBlob
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
        'X-Text-Length': text.length.toString()
      }
    })

  } catch (error) {
    console.error('Voice preview generation error:', error)
    console.error('Error type:', typeof error)
    console.error('Error instanceof Error:', error instanceof Error)
    
    // 检查是否是JSON解析错误
    if (error instanceof SyntaxError) {
      console.error('JSON parse error - invalid request body')
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }
    
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