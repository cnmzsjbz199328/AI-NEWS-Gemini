/**
 * 启动流水线API端点
 * POST /api/pipeline/start
 */

import { NextRequest, NextResponse } from 'next/server'
import { pipelineOrchestrator } from '@/lib/pipeline-orchestrator'
import { PipelineStartParams, VoiceConfig, SupportedLanguage } from '@/types'
import { cosyVoiceTTSService } from '@/lib/cosyvoice-tts-service'

interface StartPipelineRequest {
  newsTopics: string[]
  debateRounds?: number
  voiceConfig?: Partial<VoiceConfig>
  language?: SupportedLanguage
}

export async function POST(request: NextRequest) {
  try {
    const body: StartPipelineRequest = await request.json()
    
    // 请求参数验证
    if (!body.newsTopics || !Array.isArray(body.newsTopics) || body.newsTopics.length === 0) {
      return NextResponse.json(
        { error: 'newsTopics is required and must be a non-empty array' },
        { status: 400 }
      )
    }

    if (body.newsTopics.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 news topics allowed' },
        { status: 400 }
      )
    }

    // 验证每个新闻主题
    for (const topic of body.newsTopics) {
      if (typeof topic !== 'string' || topic.trim().length === 0) {
        return NextResponse.json(
          { error: 'Each news topic must be a non-empty string' },
          { status: 400 }
        )
      }
      if (topic.length > 200) {
        return NextResponse.json(
          { error: 'Each news topic must be less than 200 characters' },
          { status: 400 }
        )
      }
    }

    // 验证辩论轮次
    const debateRounds = body.debateRounds || 3
    if (debateRounds < 1 || debateRounds > 10) {
      return NextResponse.json(
        { error: 'debateRounds must be between 1 and 10' },
        { status: 400 }
      )
    }

    // 验证语言参数
    const language = body.language || 'zh-CN'
    if (!cosyVoiceTTSService.isLanguageSupported(language)) {
      const supportedLanguages = cosyVoiceTTSService.getSupportedLanguages().map(l => l.code).join(', ')
      return NextResponse.json(
        { error: `Unsupported language: ${language}. Supported languages are: ${supportedLanguages}` },
        { status: 400 }
      )
    }

    // 验证音色配置（基础验证，详细验证在后续迭代中完善）
    if (body.voiceConfig) {
      const validVoiceKeys = ['moderator', 'tom', 'mark']
      for (const key of Object.keys(body.voiceConfig)) {
        if (!validVoiceKeys.includes(key)) {
          return NextResponse.json(
            { error: `Invalid voice config key: ${key}. Valid keys are: ${validVoiceKeys.join(', ')}` },
            { status: 400 }
          )
        }
      }
    }

    // 检查流水线是否已经激活
    const currentState = pipelineOrchestrator.getState()
    if (currentState.isActive) {
      return NextResponse.json(
        { error: 'Pipeline is already active. Stop the current pipeline before starting a new one.' },
        { status: 409 }
      )
    }

    // 启动流水线
    await pipelineOrchestrator.startPipeline(
      body.newsTopics,
      debateRounds,
      body.voiceConfig,
      language as SupportedLanguage
    )

    // 返回成功响应
    const newState = pipelineOrchestrator.getState()
    return NextResponse.json({
      success: true,
      message: 'Pipeline started successfully',
      pipelineState: {
        totalTasks: newState.totalTasks,
        isActive: newState.isActive,
        currentPlayIndex: newState.currentPlayIndex
      }
    })

  } catch (error) {
    console.error('Pipeline start error:', error)
    
    // 根据错误类型返回不同的响应
    if (error instanceof Error) {
      if (error.message.includes('already active')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error while starting pipeline' },
      { status: 500 }
    )
  }
}

// 处理不支持的HTTP方法
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to start pipeline.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to start pipeline.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to start pipeline.' },
    { status: 405 }
  )
}