/**
 * 获取可用音色列表API端点
 * GET /api/voices
 */

import { NextResponse } from 'next/server'
import { AvailableVoice, SupportedLanguage } from '@/types'
import { cosyVoiceTTSService, LANGUAGE_CONFIGS } from '@/lib/cosyvoice-tts-service'

// 动态生成可用音色列表
function generateAvailableVoices(): AvailableVoice[] {
  const voices: AvailableVoice[] = []
  
  Object.values(LANGUAGE_CONFIGS).forEach(langConfig => {
    const voicesForLang = cosyVoiceTTSService.getAvailableVoicesForLanguage(langConfig.code)
    
    voicesForLang.forEach(voice => {
      voices.push({
        id: voice.voiceId,
        name: voice.name,
        language: voice.language,
        gender: voice.voiceId.includes('女') || voice.voiceId.includes('Female') ? 'female' : 'male',
        description: `${langConfig.nativeName} voice for ${voice.speaker}`
      })
    })
  })
  
  return voices
}

// 根据角色和语言推荐的默认音色
function getRoleRecommendations(language?: string, role?: string) {
  if (!language || !role || !cosyVoiceTTSService.isLanguageSupported(language)) return null
  
  const voicesForLang = cosyVoiceTTSService.getAvailableVoicesForLanguage(language as SupportedLanguage)
  return voicesForLang
    .filter(v => v.speaker === role)
    .map(v => v.voiceId)
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const language = url.searchParams.get('language')
    const gender = url.searchParams.get('gender')
    const role = url.searchParams.get('role')

    let filteredVoices = generateAvailableVoices()

    // 按语言过滤
    if (language) {
      filteredVoices = filteredVoices.filter(voice => 
        voice.language.toLowerCase() === language.toLowerCase()
      )
    }

    // 按性别过滤
    if (gender && (gender === 'male' || gender === 'female')) {
      filteredVoices = filteredVoices.filter(voice => voice.gender === gender)
    }

    // 按角色推荐排序
    const roleRecommendations = getRoleRecommendations(language || undefined, role || undefined)
    if (roleRecommendations && roleRecommendations.length > 0) {
      filteredVoices.sort((a, b) => {
        const aIndex = roleRecommendations.indexOf(a.id as any)
        const bIndex = roleRecommendations.indexOf(b.id as any)
        
        // 推荐的音色排在前面
        if (aIndex !== -1 && bIndex === -1) return -1
        if (aIndex === -1 && bIndex !== -1) return 1
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
        
        return 0
      })
    }

    const response = {
      success: true,
      voices: filteredVoices,
      total: filteredVoices.length,
      supportedLanguages: cosyVoiceTTSService.getSupportedLanguages(),
      filters: {
        language: language || null,
        gender: gender || null,
        role: role || null
      },
      roleRecommendations: roleRecommendations || null
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Voices API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error while fetching voices',
        voices: [],
        total: 0
      },
      { status: 500 }
    )
  }
}

// 处理不支持的HTTP方法
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch voices.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch voices.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch voices.' },
    { status: 405 }
  )
}