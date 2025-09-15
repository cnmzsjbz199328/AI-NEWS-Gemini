/**
 * 手动触发下一个任务API端点
 * POST /api/pipeline/next
 */

import { NextRequest, NextResponse } from 'next/server'
import { pipelineScheduler } from '@/lib/PipelineScheduler'

interface NextTaskRequest {
  taskId?: string
  force?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: NextTaskRequest = await request.json()
    
    // 检查流水线是否激活
    const currentState = pipelineScheduler.getState()
    if (!currentState.isActive) {
      return NextResponse.json(
        { error: 'Pipeline is not active' },
        { status: 400 }
      )
    }

    // 尝试完成当前任务并移动到下一个
    const success = pipelineScheduler.markCurrentTaskAsCompleted()
    
    if (success) {
      const newState = pipelineScheduler.getState()
      return NextResponse.json({
        success: true,
        message: 'Moved to next task',
        currentPlayIndex: newState.currentPlayIndex,
        totalTasks: newState.totalTasks
      })
    } else {
      return NextResponse.json(
        { error: 'No task available to complete or task not ready' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Pipeline next error:', error)
    return NextResponse.json(
      { error: 'Internal server error while moving to next task' },
      { status: 500 }
    )
  }
}

// 处理不支持的HTTP方法
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to trigger next task.' },
    { status: 405 }
  )
}