/**
 * 标记任务为已播放API
 * POST /api/pipeline/task/[taskId]/mark-played
 */

import { NextRequest, NextResponse } from 'next/server'
import { TaskManager } from '@/lib/managers/TaskManager'

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

    // 获取任务
    const task = await TaskManager.getTaskById(taskId)
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // 更新任务状态为已完成
    await TaskManager.updateTaskStatus(taskId, 'DONE')

    return NextResponse.json({
      success: true,
      message: 'Task marked as played',
      taskId
    })

  } catch (error) {
    console.error(`[API /mark-played] Error marking task as played:`, error)
    
    return NextResponse.json(
      { 
        error: 'Failed to mark task as played',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}