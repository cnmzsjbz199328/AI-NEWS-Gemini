/**
 * 获取下一个待播放内容API端点
 * GET /api/pipeline/next
 */

import { NextResponse } from 'next/server'
import { pipelineOrchestrator } from '@/lib/pipeline-orchestrator'

export async function GET() {
  try {
    // 获取流水线状态
    const pipelineState = pipelineOrchestrator.getState()
    
    if (!pipelineState.isActive) {
      return NextResponse.json({
        success: false,
        status: 'inactive',
        message: 'Pipeline is not active',
        data: null
      })
    }

    // 获取下一个可播放的任务
    const nextTask = pipelineOrchestrator.getNextPlayableTask()
    
    if (!nextTask) {
      // 检查是否还有未完成的任务
      const hasPendingTasks = pipelineState.tasks.some(task => 
        task.status !== 'DONE' && task.status !== 'READY_TO_PLAY'
      )
      
      if (hasPendingTasks) {
        return NextResponse.json({
          success: true,
          status: 'waiting',
          message: 'Next content is still being generated. Please wait.',
          data: null,
          progress: {
            currentIndex: pipelineState.currentPlayIndex,
            totalTasks: pipelineState.totalTasks,
            completedTasks: pipelineState.completedTasks
          }
        })
      } else {
        // 所有任务都已完成
        return NextResponse.json({
          success: true,
          status: 'completed',
          message: 'All content has been played',
          data: null,
          progress: {
            currentIndex: pipelineState.currentPlayIndex,
            totalTasks: pipelineState.totalTasks,
            completedTasks: pipelineState.completedTasks
          }
        })
      }
    }

    // 验证任务数据完整性
    if (!nextTask.audioPlaylist) {
      console.error(`Task ${nextTask.id} is marked as READY_TO_PLAY but has no audio playlist`)
      return NextResponse.json({
        success: false,
        status: 'error',
        message: 'Content is ready but audio data is missing',
        data: null
      }, { status: 500 })
    }

    // 返回可播放的内容
    const response = {
      success: true,
      status: 'ready',
      message: 'Content ready for playback',
      data: {
        taskId: nextTask.id,
        newsTopic: nextTask.newsTopic,
        audioPlaylist: nextTask.audioPlaylist,
        script: nextTask.script, // 可选：用于显示文本
        debateRounds: nextTask.debateRounds,
        voiceConfig: nextTask.voiceConfig
      },
      progress: {
        currentIndex: pipelineState.currentPlayIndex,
        totalTasks: pipelineState.totalTasks,
        completedTasks: pipelineState.completedTasks,
        remainingTasks: pipelineState.totalTasks - pipelineState.currentPlayIndex - 1
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Pipeline next API error:', error)
    
    return NextResponse.json({
      success: false,
      status: 'error',
      message: 'Internal server error while fetching next content',
      data: null
    }, { status: 500 })
  }
}

// 处理播放完成的POST请求
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { taskId, action } = body

    if (action !== 'complete') {
      return NextResponse.json(
        { error: 'Invalid action. Use "complete" to mark task as finished.' },
        { status: 400 }
      )
    }

    if (!taskId || typeof taskId !== 'string') {
      return NextResponse.json(
        { error: 'taskId is required and must be a string' },
        { status: 400 }
      )
    }

    // 标记当前任务为已完成
    const success = pipelineOrchestrator.markCurrentTaskAsCompleted()
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to mark task as completed. Task may not be ready or already completed.' },
        { status: 400 }
      )
    }

    // 获取更新后的状态
    const pipelineState = pipelineOrchestrator.getState()
    
    return NextResponse.json({
      success: true,
      message: 'Task marked as completed',
      progress: {
        currentIndex: pipelineState.currentPlayIndex,
        totalTasks: pipelineState.totalTasks,
        completedTasks: pipelineState.completedTasks
      }
    })

  } catch (error) {
    console.error('Pipeline complete API error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error while completing task' },
      { status: 500 }
    )
  }
}

// 处理不支持的HTTP方法
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch next content or POST to mark completion.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch next content or POST to mark completion.' },
    { status: 405 }
  )
}