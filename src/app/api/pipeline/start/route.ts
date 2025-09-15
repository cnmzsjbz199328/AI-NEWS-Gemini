/**
 * 启动流水线API端点
 * POST /api/pipeline/start
 * Updated: Fixed topic length validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { PipelineScheduler } from '@/lib/PipelineScheduler'

interface StartPipelineRequest {
  newsTopics: string[]
  debateRounds?: number
  voiceConfig?: any
  language?: string
}

export async function POST(request: NextRequest) {
  console.log('[Pipeline API] Received POST request to start pipeline')
  
  try {
    const body: StartPipelineRequest = await request.json()
    console.log('[Pipeline API] Request body:', JSON.stringify(body, null, 2))
    
    // 请求参数验证
    if (!body.newsTopics || !Array.isArray(body.newsTopics) || body.newsTopics.length === 0) {
      console.log('[Pipeline API] Validation failed: newsTopics invalid')
      return NextResponse.json(
        { error: 'newsTopics is required and must be a non-empty array' },
        { status: 400 }
      )
    }

    if (body.newsTopics.length > 20) {
      console.log('[Pipeline API] Validation failed: too many topics')
      return NextResponse.json(
        { error: 'Maximum 20 news topics allowed' },
        { status: 400 }
      )
    }

    console.log('[Pipeline API] Validating individual topics...')
    // 验证每个新闻主题
    for (const topic of body.newsTopics) {
      if (typeof topic !== 'string' || topic.trim().length === 0) {
        console.log('[Pipeline API] Validation failed: invalid topic format')
        return NextResponse.json(
          { error: 'Each news topic must be a non-empty string' },
          { status: 400 }
        )
      }
      if (topic.length > 500) {
        console.log('[Pipeline API] Validation failed: topic too long')
        return NextResponse.json(
          { error: 'Each news topic must be less than 500 characters' },
          { status: 400 }
        )
      }
    }

    console.log('[Pipeline API] Validating debate rounds...')
    // 验证辩论轮次
    const debateRounds = body.debateRounds || 3
    if (debateRounds < 1 || debateRounds > 10) {
      console.log('[Pipeline API] Validation failed: invalid debate rounds')
      return NextResponse.json(
        { error: 'debateRounds must be between 1 and 10' },
        { status: 400 }
      )
    }

    console.log('[Pipeline API] Validating language...')
    // 验证语言参数（简化版本）
    const language = body.language || 'zh-CN'

    console.log('[Pipeline API] Validating voice config...')
    // 验证音色配置（基础验证，详细验证在后续迭代中完善）
    if (body.voiceConfig) {
      const validVoiceKeys = ['moderator', 'tom', 'mark']
      for (const key of Object.keys(body.voiceConfig)) {
        if (!validVoiceKeys.includes(key)) {
          console.log(`[Pipeline API] Validation failed: invalid voice key ${key}`)
          return NextResponse.json(
            { error: `Invalid voice config key: ${key}. Valid keys are: ${validVoiceKeys.join(', ')}` },
            { status: 400 }
          )
        }
      }
    }

    console.log('[Pipeline API] All validations passed, getting orchestrator...')

    // 获取流水线调度器单例
    const orchestrator = PipelineScheduler.getInstance()
    console.log('[Pipeline API] Orchestrator obtained, checking current state...')
    
    // 检查流水线是否已经激活
    const currentState = orchestrator.getState()
    console.log('[Pipeline API] Current pipeline state:', {
      isActive: currentState.isActive,
      totalTasks: currentState.totalTasks,
      completedTasks: currentState.completedTasks
    })
    
    if (currentState.isActive) {
      console.log('[Pipeline API] Pipeline already active, returning 409')
      return NextResponse.json(
        { error: 'Pipeline is already active. Stop the current pipeline before starting a new one.' },
        { status: 409 }
      )
    }

    console.log('[Pipeline API] Starting pipeline with parameters:', {
      newsTopicsCount: body.newsTopics.length,
      debateRounds,
      voiceConfig: body.voiceConfig,
      language
    })
    
    // 启动流水线（使用完整的统一剧本生成）
    await orchestrator.startPipeline(
      body.newsTopics,
      debateRounds,
      body.voiceConfig,
      language as any
    )
    
    console.log('[Pipeline API] Pipeline started successfully')

    // 返回成功响应
    const newState = orchestrator.getState()
    console.log('[Pipeline API] New pipeline state:', {
      isActive: newState.isActive,
      totalTasks: newState.totalTasks
    })
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
    console.error('[Pipeline API] Error in POST handler:', error)
    console.error('[Pipeline API] Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    // 根据错误类型返回不同的响应
    if (error instanceof Error) {
      console.log('[Pipeline API] Error message:', error.message)
      
      if (error.message.includes('already active')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        )
      }
      
      // 检查是否是JSON解析错误
      if (error.message.includes('JSON') || error.message.includes('parse')) {
        return NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { 
        error: 'Internal server error while starting pipeline',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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