/**
 * 测试CosyVoice API的端点
 */

import { NextRequest, NextResponse } from 'next/server'
import { cosyVoiceTTSService } from '@/lib/cosyvoice-tts-service'
import { SupportedLanguage } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, voiceId, language } = body

    if (!text || !voiceId || !language) {
      return NextResponse.json(
        { error: 'text, voiceId, and language are required' },
        { status: 400 }
      )
    }

    console.log(`🧪 Testing CosyVoice with text: "${text}", voice: ${voiceId}, language: ${language}`)

    // 直接测试TTS生成
    const result = await cosyVoiceTTSService.generateSpeech(
      'moderator', // 使用moderator作为测试角色
      text,
      language as SupportedLanguage
    )

    console.log(`📋 CosyVoice test result:`, {
      success: result.success,
      hasAudioUrl: !!result.audioUrl,
      duration: result.duration,
      error: result.error
    })

    return NextResponse.json({
      success: true,
      result
    })

  } catch (error) {
    console.error('❌ CosyVoice test error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}