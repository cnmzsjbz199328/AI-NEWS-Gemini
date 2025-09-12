/**
 * 获取流水线状态API端点
 * GET /api/pipeline/status
 */

import { NextResponse } from 'next/server'
import { pipelineOrchestrator } from '@/lib/pipeline-orchestrator'

export async function GET() {
  try {
    // 获取流水线状态
    const pipelineState = pipelineOrchestrator.getState()
    const workerStates = pipelineOrchestrator.getWorkerStates()

    // 统计各状态的任务数量
    const statusCounts = {
      PENDING_TEXT: 0,
      GENERATING_TEXT: 0,
      PENDING_AUDIO: 0,
      GENERATING_AUDIO: 0,
      READY_TO_PLAY: 0,
      DONE: 0
    }

    pipelineState.tasks.forEach(task => {
      statusCounts[task.status]++
    })

    // 计算进度百分比
    const progressPercentage = pipelineState.totalTasks > 0 
      ? Math.round((pipelineState.completedTasks / pipelineState.totalTasks) * 100)
      : 0

    // 转换工作者状态为可序列化的对象
    const workers = Object.entries(workerStates).map(([type, state]) => ({
      type,
      isIdle: state.isIdle,
      currentTaskId: state.currentTaskId,
      lastCompletedAt: state.lastCompletedAt,
      errorCount: state.errorCount
    }))

    // 获取任务详情（不包含大量数据，只包含关键信息）
    const taskSummaries = pipelineState.tasks.map(task => ({
      id: task.id,
      newsTopic: task.newsTopic.substring(0, 50) + (task.newsTopic.length > 50 ? '...' : ''),
      status: task.status,
      assignedWorker: task.assignedWorker,
      debateRounds: task.debateRounds,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      hasScript: !!task.script,
      hasAudioPlaylist: !!task.audioPlaylist,
      error: task.error
    }))

    const response = {
      success: true,
      pipeline: {
        isActive: pipelineState.isActive,
        currentPlayIndex: pipelineState.currentPlayIndex,
        totalTasks: pipelineState.totalTasks,
        completedTasks: pipelineState.completedTasks,
        progressPercentage
      },
      statusCounts,
      workers,
      tasks: taskSummaries,
      timestamp: Date.now()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Pipeline status API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error while fetching pipeline status',
      pipeline: null,
      statusCounts: null,
      workers: null,
      tasks: null,
      timestamp: Date.now()
    }, { status: 500 })
  }
}

// 停止流水线的DELETE请求
export async function DELETE() {
  try {
    pipelineOrchestrator.stopPipeline()
    
    return NextResponse.json({
      success: true,
      message: 'Pipeline stopped successfully'
    })

  } catch (error) {
    console.error('Pipeline stop API error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error while stopping pipeline' },
      { status: 500 }
    )
  }
}

// 处理不支持的HTTP方法
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch status or DELETE to stop pipeline.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch status or DELETE to stop pipeline.' },
    { status: 405 }
  )
}