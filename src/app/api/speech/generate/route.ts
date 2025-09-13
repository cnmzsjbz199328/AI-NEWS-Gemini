import { NextRequest, NextResponse } from 'next/server'
import { Speaker } from '@/types'
import { ttsServiceManager } from '@/lib/tts-service-manager'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, speaker, preferredService } = body

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

    console.log(`[TTS API] Generating speech for ${speaker}: "${text.substring(0, 50)}..."`)
    console.log(`[TTS API] Preferred service: ${preferredService || 'auto'}`)

    try {
      // 使用三层 TTS 服务管理器
      const result = await ttsServiceManager.generateSpeech(
        text,
        speaker as Speaker,
        preferredService
      )

      if (!result.success) {
        console.error(`[TTS API] Generation failed for ${speaker}:`, result.error)
        return NextResponse.json(
          { error: result.error || 'TTS service temporarily unavailable' },
          { status: 503 }
        )
      }

      console.log(`[TTS API] Speech generated successfully for ${speaker} using ${result.serviceUsed}`)

      // 如果使用 Web Speech API，返回特殊响应
      if (result.serviceUsed === 'webSpeech') {
        return NextResponse.json({
          success: true,
          serviceUsed: 'webSpeech',
          message: 'Speech played directly via Web Speech API'
        })
      }

      // 返回音频数据
      if (result.audioBlob) {
        const audioBuffer = await result.audioBlob.arrayBuffer()
        
        return new Response(audioBuffer, {
          headers: {
            'Content-Type': 'audio/wav',
            'Content-Length': audioBuffer.byteLength.toString(),
            'Cache-Control': 'public, max-age=3600', // 1小时缓存
            'X-TTS-Service': result.serviceUsed, // 标识使用的服务
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
            'X-TTS-Service': result.serviceUsed,
            'X-Generation-Duration': result.duration?.toString() || '0'
          },
        })
      } else {
        throw new Error('No audio data available')
      }

    } catch (error) {
      console.error(`[TTS API] Error for ${speaker}:`, error)
      return NextResponse.json(
        { error: 'TTS service temporarily unavailable' },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error('[TTS API] Speech generation error:', error)
    
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    )
  }
}

// 新增：获取 TTS 服务状态的 GET 端点
export async function GET() {
  try {
    const status = ttsServiceManager.getServiceStatus()
    const bestService = ttsServiceManager.getBestAvailableService()
    
    return NextResponse.json({
      services: status,
      bestAvailable: bestService,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[TTS API] Error getting service status:', error)
    return NextResponse.json(
      { error: 'Failed to get service status' },
      { status: 500 }
    )
  }
}