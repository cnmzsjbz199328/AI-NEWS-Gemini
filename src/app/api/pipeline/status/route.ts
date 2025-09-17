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
      DONE: 0,
      FAILED: 0
    }

    pipelineState.tasks.forEach(task => {
      if (statusCounts[task.status as keyof typeof statusCounts] !== undefined) {
        statusCounts[task.status as keyof typeof statusCounts]++
      }
    })

    // 定义各状态的进度权重
    const progressWeights = {
      PENDING_TEXT: 0,
      GENERATING_TEXT: 0.25,
      PENDING_AUDIO: 0.5,
      GENERATING_AUDIO: 0.75,
      READY_TO_PLAY: 1,
      PLAYING: 1, // PLAYING 状态也视为100%
      DONE: 1,      // DONE 状态也视为100%
      FAILED: 1     // FAILED 状态也视为100%，因为它已结束
    }

    // --- 详细日志开始 ---
    console.log(`[Status API] Polling at ${new Date().toISOString()}`)
    console.log(`[Status API] Is pipeline active? ${pipelineState.isActive}`)
    console.log(`[Status API] Total tasks: ${pipelineState.tasks.length}`)
    pipelineState.tasks.forEach((task, index) => {
      console.log(`[Status API] Task ${index}: ID=${task.id}, Status=${task.status}`)
    })
    // --- 详细日志结束 ---

    // 计算总进度
    let totalProgress = 0
    pipelineState.tasks.forEach(task => {
      totalProgress += progressWeights[task.status as keyof typeof progressWeights] || 0
    })

    const progressPercentage = pipelineState.totalTasks > 0
      ? Math.round((totalProgress / pipelineState.totalTasks) * 100)
      : 0
    
    console.log(`[Status API] Calculated totalProgress=${totalProgress}, progressPercentage=${progressPercentage}%`)

    // 获取下一个可播放的任务
    const nextPlayableTask = orchestrator.getNextPlayableTask()

    const response = {
      isActive: pipelineState.isActive,
      totalTasks: pipelineState.totalTasks,
      completedTasks: pipelineState.completedTasks,
      currentPlayIndex: pipelineState.currentPlayIndex,
      progressPercentage,
      statusCounts,
      tasks: pipelineState.tasks, // 返回完整的任务对象
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
