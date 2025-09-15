import { NextRequest, NextResponse } from 'next/server'
import { Speaker } from '@/types'
import { getIndexTTSIntegratedService } from '@/lib/indexTTS-integrated-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, speaker, emotion, emotionWeight, temperature } = body

    if (!text || !speaker) {
      return NextResponse.json(
        { error: 'Text and speaker are required' },
        { status: 400 }
      )
    }

    // 验证speaker类型
    if (!['moderator', 'tom', 'mark'].includes(speaker)) {
      return NextResponse.json(
        { error: 'Invalid speaker. Must be moderator, tom, or mark' },
        { status: 400 }
      )
    }

    console.log(`[TTS API] 🎯 Generating speech for ${speaker}: "${text.substring(0, 50)}..."`)
    console.log(`[TTS API] 🎵 Using IndexTTS-2 Private Space with role-based voices`)

    try {
      // 使用新的集成服务
      const integratedService = getIndexTTSIntegratedService()
      const result = await integratedService.generateSpeechForRole(
        text,
        speaker as Speaker,
        {
          emotion,
          emotionWeight,
          temperature
        }
      )

      if (!result.success) {
        console.error(`[TTS API] ❌ Generation failed for ${speaker}:`, result.error)
        return NextResponse.json(
          { error: result.error || 'IndexTTS service temporarily unavailable' },
          { status: 503 }
        )
      }

      console.log(`[TTS API] ✅ Speech generated successfully for ${speaker} using voice: ${result.voiceConfig?.name}`)

      // 返回音频数据
      if (result.audioBlob) {
        const audioBuffer = await result.audioBlob.arrayBuffer()
        
        return new Response(audioBuffer, {
          headers: {
            'Content-Type': 'audio/wav',
            'Content-Length': audioBuffer.byteLength.toString(),
            'Cache-Control': 'public, max-age=3600', // 1小时缓存
            'X-TTS-Service': 'IndexTTS-2-Private', // 标识使用的服务
            'X-Voice-Used': result.voiceConfig?.name || 'Unknown',
            'X-Generation-Duration': result.duration?.toString() || '0'
          },
        })
      } else if (result.audioUrl) {
        // 如果只有 URL，重定向到音频文件
        const audioResponse = await fetch(result.audioUrl)
        if (!audioResponse.ok) {
          throw new Error(`Failed to fetch audio: ${audioResponse.status}`)
        }

        const audioBuffer = await audioResponse.arrayBuffer()
        
        return new Response(audioBuffer, {
          headers: {
            'Content-Type': 'audio/wav',
            'Content-Length': audioBuffer.byteLength.toString(),
            'Cache-Control': 'public, max-age=3600',
            'X-TTS-Service': 'IndexTTS-2-Private',
            'X-Voice-Used': result.voiceConfig?.name || 'Unknown',
            'X-Generation-Duration': result.duration?.toString() || '0'
          },
        })
      } else {
        throw new Error('No audio data available')
      }

    } catch (error) {
      console.error(`[TTS API] ❌ Error for ${speaker}:`, error)
      return NextResponse.json(
        { error: 'IndexTTS service temporarily unavailable' },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error('[TTS API] ❌ Speech generation error:', error)
    
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    )
  }
}

// 获取 IndexTTS 服务状态的 GET 端点
export async function GET() {
  try {
    const integratedService = getIndexTTSIntegratedService()
    const status = await integratedService.testService()
    const voiceMapping = integratedService.getCurrentVoiceMapping()
    
    return NextResponse.json({
      service: 'IndexTTS-2-Private',
      connection: status.connection,
      voices: status.voices,
      roleMapping: voiceMapping,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[TTS API] ❌ Error getting service status:', error)
    return NextResponse.json(
      { error: 'Failed to get service status' },
      { status: 500 }
    )
  }
}