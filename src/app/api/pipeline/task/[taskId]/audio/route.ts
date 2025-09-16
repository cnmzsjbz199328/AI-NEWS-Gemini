/**
 * 获取任务音频播放列表API
 * GET /api/pipeline/task/[taskId]/audio
 */

import { NextRequest, NextResponse } from 'next/server'
import { PipelineScheduler } from '@/lib/PipelineScheduler'

interface RouteParams {
  params: {
    taskId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { taskId } = params
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    console.log(`[Task Audio API] 🎵 Getting audio for task: ${taskId}`)

    // 获取流水线调度器实例
    const orchestrator = PipelineScheduler.getInstance()
    const pipelineState = orchestrator.getState()
    
    // 查找指定的任务
    const task = pipelineState.tasks.find(t => t.id === taskId)
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    if (!task.audioPlaylist) {
      return NextResponse.json(
        { error: 'Audio not available for this task' },
        { status: 404 }
      )
    }

    console.log(`[Task Audio API] ✅ Returning audio playlist for task: ${taskId}`)

    return NextResponse.json({
      taskId: task.id,
      status: task.status,
      audioPlaylist: task.audioPlaylist,
      script: {
        moderator_intro: task.script?.moderator_intro || '',
        conversation: task.script?.conversation || [],
        moderator_outro: task.script?.moderator_outro || ''
      }
    })

  } catch (error) {
    console.error('[Task Audio API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error while getting task audio' },
      { status: 500 }
    )
  }
}

// 处理不支持的HTTP方法
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to get task audio.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to get task audio.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to get task audio.' },
    { status: 405 }
  )
}