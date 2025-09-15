/**
 * Pipeline Status API - 获取流水线状态
 * GET /api/pipeline/status
 */

import { NextResponse } from 'next/server'
import { PipelineScheduler } from '@/lib/PipelineScheduler'

export async function GET() {
  try {
    // 获取流水线调度器实例
    const orchestrator = PipelineScheduler.getInstance()
    
    // 获取流水线状态
    const pipelineState = orchestrator.getState()

    // 统计各状态的任务数量
    const statusCounts = {
      PENDING_TEXT: 0,
      GENERATING_TEXT: 0,
      PENDING_AUDIO: 0,
      GENERATING_AUDIO: 0,
      READY_TO_PLAY: 0,
      PLAYING: 0,
      DONE: 0
    }

    pipelineState.tasks.forEach(task => {
      if (statusCounts[task.status as keyof typeof statusCounts] !== undefined) {
        statusCounts[task.status as keyof typeof statusCounts]++
      }
    })

    // 计算进度百分比
    const progressPercentage = pipelineState.totalTasks > 0 
      ? Math.round((pipelineState.completedTasks / pipelineState.totalTasks) * 100)
      : 0

    // 获取任务详情（不包含大量数据，只包含关键信息）
    const taskSummaries = pipelineState.tasks.map(task => ({
      id: task.id,
      newsTopic: task.newsTopic.substring(0, 50) + (task.newsTopic.length > 50 ? '...' : ''),
      status: task.status,
      assignedWorker: task.assignedWorker,
      hasScript: !!task.script,
      hasAudio: !!task.audioPlaylist,
      error: task.error,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }))

    // 获取下一个可播放的任务
    const nextPlayableTask = orchestrator.getNextPlayableTask()

    const response = {
      isActive: pipelineState.isActive,
      totalTasks: pipelineState.totalTasks,
      completedTasks: pipelineState.completedTasks,
      currentPlayIndex: pipelineState.currentPlayIndex,
      progressPercentage,
      statusCounts,
      tasks: taskSummaries,
      nextPlayableTask: nextPlayableTask ? {
        id: nextPlayableTask.id,
        newsTopic: nextPlayableTask.newsTopic.substring(0, 50) + '...'
      } : null,
      timestamp: Date.now()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Pipeline status error:', error)
    return NextResponse.json(
      { error: 'Internal server error while getting pipeline status' },
      { status: 500 }
    )
  }
}

// 处理不支持的HTTP方法
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to get pipeline status.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to get pipeline status.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to get pipeline status.' },
    { status: 405 }
  )
}
