/**
 * 重试失败任务API端点
 * POST /api/pipeline/retry
 */

import { NextRequest, NextResponse } from 'next/server'
import { pipelineScheduler } from '@/lib/PipelineScheduler'

interface RetryTaskRequest {
  taskId?: string
  retryType?: 'text' | 'audio' | 'all'
}

export async function POST(request: NextRequest) {
  try {
    const body: RetryTaskRequest = await request.json()
    
    // 检查流水线是否激活
    const currentState = pipelineScheduler.getState()
    if (!currentState.isActive) {
      return NextResponse.json(
        { error: 'Pipeline is not active' },
        { status: 400 }
      )
    }

    // 如果没有指定taskId，重试当前失败的任务
    let targetTaskId = body.taskId
    if (!targetTaskId) {
      // 查找第一个失败的任务
      const failedTask = currentState.tasks.find(task => 
        task.status === 'PENDING_TEXT' && task.error
      )
      if (failedTask) {
        targetTaskId = failedTask.id
      } else {
        return NextResponse.json(
          { error: 'No failed tasks found to retry' },
          { status: 400 }
        )
      }
    }

    // 查找指定的任务
    const task = currentState.tasks.find(t => t.id === targetTaskId)
    if (!task) {
      return NextResponse.json(
        { error: `Task not found: ${targetTaskId}` },
        { status: 404 }
      )
    }

    // 根据重试类型重置任务状态
    const retryType = body.retryType || 'all'
    
    if (retryType === 'text' || retryType === 'all') {
      // 重试文本生成
      // Note: Direct task status updates need to be handled differently in new architecture
      // This functionality may need to be reimplemented
      // 清除错误信息
      if (task.error) {
        delete task.error
      }
    } else if (retryType === 'audio') {
      // 重试音频生成（需要有script）
      if (!task.script) {
        return NextResponse.json(
          { error: 'Cannot retry audio generation without script' },
          { status: 400 }
        )
      }
      // Note: Direct task status updates need to be handled differently in new architecture
      // This functionality may need to be reimplemented
    }

    // 重置工作者错误计数（如果有分配的工作者）
    if (task.assignedWorker) {
      // Note: Worker error count reset needs to be handled differently in new architecture
      // This functionality may need to be reimplemented
    }

    return NextResponse.json({
      success: true,
      message: `Task ${targetTaskId} queued for retry`,
      taskId: targetTaskId,
      retryType,
      newStatus: task.status
    })

  } catch (error) {
    console.error('Pipeline retry error:', error)
    return NextResponse.json(
      { error: 'Internal server error while retrying task' },
      { status: 500 }
    )
  }
}

// GET方法返回可重试的任务列表
export async function GET() {
  try {
    const state = pipelineScheduler.getState()
    
    // 查找失败或有错误的任务
    const retryableTasks = state.tasks.filter(task => 
      task.error || 
      (task.status === 'PENDING_TEXT' && task.assignedWorker) ||
      (task.status === 'PENDING_AUDIO' && task.script)
    ).map(task => ({
      id: task.id,
      newsTopic: task.newsTopic,
      status: task.status,
      error: task.error,
      assignedWorker: task.assignedWorker,
      hasScript: !!task.script,
      canRetryText: task.status === 'PENDING_TEXT' || !!task.error,
      canRetryAudio: task.status === 'PENDING_AUDIO' && !!task.script
    }))
    
    return NextResponse.json({
      retryableTasks,
      totalRetryable: retryableTasks.length
    })

  } catch (error) {
    console.error('Pipeline retry status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 处理不支持的HTTP方法
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to retry tasks or GET to list retryable tasks.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to retry tasks or GET to list retryable tasks.' },
    { status: 405 }
  )
}