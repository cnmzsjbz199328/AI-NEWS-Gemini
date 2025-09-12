/**
 * 获取可用音色列表API端点
 * GET /api/voices
 */

import { NextResponse } from 'next/server'
import { AvailableVoice } from '@/types'

// 预定义的可用音色列表
// 基于CosyVoice API文档中的音色选项
const AVAILABLE_VOICES: AvailableVoice[] = [
  // 中文音色
  {
    id: 'cosy-zh-female-1',
    name: '中文女声 1',
    language: 'zh-CN',
    gender: 'female',
    description: '温和专业的中文女声，适合主持人'
  },
  {
    id: 'cosy-zh-male-1',
    name: '中文男声 1',
    language: 'zh-CN',
    gender: 'male',
    description: '沉稳权威的中文男声'
  },
  
  // 英文音色
  {
    id: 'cosy-en-female-1',
    name: 'English Female 1',
    language: 'en-US',
    gender: 'female',
    description: 'Professional English female voice'
  },
  {
    id: 'cosy-en-male-1',
    name: 'English Male 1',
    language: 'en-US',
    gender: 'male',
    description: 'Energetic English male voice, suitable for Tom'
  },
  {
    id: 'cosy-en-male-2',
    name: 'English Male 2',
    language: 'en-US',
    gender: 'male',
    description: 'Calm and mature English male voice, suitable for Mark'
  },
  
  // 日语音色
  {
    id: 'cosy-ja-male-1',
    name: 'Japanese Male 1',
    language: 'ja-JP',
    gender: 'male',
    description: 'Professional Japanese male voice'
  },
  
  // 粤语音色
  {
    id: 'cosy-yue-female-1',
    name: '粤语女声 1',
    language: 'yue-CN',
    gender: 'female',
    description: '标准粤语女声'
  },
  
  // 韩语音色
  {
    id: 'cosy-ko-female-1',
    name: 'Korean Female 1',
    language: 'ko-KR',
    gender: 'female',
    description: 'Standard Korean female voice'
  }
]

// 根据角色推荐的默认音色
const ROLE_RECOMMENDATIONS = {
  moderator: ['cosy-zh-female-1', 'cosy-en-female-1', 'cosy-zh-male-1'],
  tom: ['cosy-en-male-1', 'cosy-zh-male-1'],
  mark: ['cosy-en-male-2', 'cosy-zh-male-1']
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const language = url.searchParams.get('language')
    const gender = url.searchParams.get('gender')
    const role = url.searchParams.get('role')

    let filteredVoices = [...AVAILABLE_VOICES]

    // 按语言过滤
    if (language) {
      filteredVoices = filteredVoices.filter(voice => 
        voice.language.toLowerCase().includes(language.toLowerCase())
      )
    }

    // 按性别过滤
    if (gender && (gender === 'male' || gender === 'female')) {
      filteredVoices = filteredVoices.filter(voice => voice.gender === gender)
    }

    // 按角色推荐排序
    if (role && role in ROLE_RECOMMENDATIONS) {
      const recommendedIds = ROLE_RECOMMENDATIONS[role as keyof typeof ROLE_RECOMMENDATIONS]
      filteredVoices.sort((a, b) => {
        const aIndex = recommendedIds.indexOf(a.id)
        const bIndex = recommendedIds.indexOf(b.id)
        
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
      filters: {
        language: language || null,
        gender: gender || null,
        role: role || null
      },
      roleRecommendations: role ? ROLE_RECOMMENDATIONS[role as keyof typeof ROLE_RECOMMENDATIONS] : null
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