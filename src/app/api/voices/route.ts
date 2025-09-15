/**
 * 获取可用音色列表API端点
 * GET /api/voices
 */

import { NextRequest, NextResponse } from 'next/server'
import { cosyVoiceTTSService } from '@/lib/cosyvoice-tts-service'

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language')
    
    // 获取支持的语言列表
    const supportedLanguages = cosyVoiceTTSService.getSupportedLanguages()
    
    // 如果指定了语言，返回该语言的音色
    if (language) {
      const languageInfo = supportedLanguages.find(lang => lang.code === language)
      if (!languageInfo) {
        return NextResponse.json(
          { error: `Unsupported language: ${language}` },
          { status: 400 }
        )
      }
      
      return NextResponse.json({
        language: languageInfo,
        voices: [] // 暂时返回空数组，后续可以扩展具体音色列表
      })
    }
    
    // 返回所有支持的语言和音色
    return NextResponse.json({
      supportedLanguages,
      defaultVoiceConfig: {
        moderator: {
          voiceId: 'cosy-zh-female-1',
          style: 'professional',
          speed: 1.0,
          pitch: 0.0
        },
        tom: {
          voiceId: 'cosy-en-male-1',
          style: 'energetic',
          speed: 1.1,
          pitch: 2.0
        },
        mark: {
          voiceId: 'cosy-en-male-2',
          style: 'calm',
          speed: 0.9,
          pitch: -1.0
        }
      }
    })

  } catch (error) {
    console.error('Voices API error:', error)
    return NextResponse.json(
      { error: 'Internal server error while fetching voices' },
      { status: 500 }
    )
  }
}

// POST方法用于验证音色配置
export async function POST(request: NextRequest) {
  try {
    const voiceConfig = await request.json()
    
    // 基础验证
    const requiredRoles = ['moderator', 'tom', 'mark']
    const missingRoles = requiredRoles.filter(role => !voiceConfig[role])
    
    if (missingRoles.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing voice configuration for roles',
          missingRoles 
        },
        { status: 400 }
      )
    }
    
    // 验证每个角色的配置
    for (const role of requiredRoles) {
      const config = voiceConfig[role]
      if (!config.voiceId) {
        return NextResponse.json(
          { error: `Missing voiceId for role: ${role}` },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json({
      valid: true,
      message: 'Voice configuration is valid'
    })

  } catch (error) {
    console.error('Voice config validation error:', error)
    return NextResponse.json(
      { error: 'Invalid voice configuration format' },
      { status: 400 }
    )
  }
}

// 处理不支持的HTTP方法
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch voices or POST to validate config.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch voices or POST to validate config.' },
    { status: 405 }
  )
}