/**
 * 标记任务为已播放API
 * POST /api/pipeline/task/[taskId]/mark-played
 */

import { NextRequest, NextResponse } from 'next/server'
import { PipelineScheduler } from '@/lib/PipelineScheduler'

interface RouteParams {
  params: {
    taskId: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { taskId } = params
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    console.log(`[Mark Played API] 🎵 Marking task as played: ${taskId}`)

    // 获取流水线调度器实例
    const orchestrator = PipelineScheduler.getInstance()
    
    // 标记任务为已完成
    const success = orchestrator.markTaskAsCompleted(taskId)
    
    if (success) {
      console.log(`[Mark Played API] ✅ Task marked as completed: ${taskId}`)
      return NextResponse.json({
        success: true,
        message: 'Task marked as played'
      })
    } else {
      return NextResponse.json(
        { error: 'Task not found or already completed' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('[Mark Played API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error while marking task as played' },
      { status: 500 }
    )
  }
}

// 处理不支持的HTTP方法
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to mark task as played.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to mark task as played.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to mark task as played.' },
    { status: 405 }
  )
}