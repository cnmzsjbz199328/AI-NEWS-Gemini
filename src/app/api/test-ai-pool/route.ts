/**
 * 测试AI工作池的API端点
 */

import { NextRequest, NextResponse } from 'next/server'
import { aiWorkerPool } from '@/lib/ai-worker-pool'
import { PipelineTask, AIWorkerType } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { task, workerType } = body

    if (!task || !workerType) {
      return NextResponse.json(
        { error: 'Task and workerType are required' },
        { status: 400 }
      )
    }

    console.log(`🧪 Testing AI pool with task: ${task.id} and worker: ${workerType}`)

    // 检查工作者是否空闲
    const isIdle = aiWorkerPool.isWorkerIdle(workerType as AIWorkerType)
    console.log(`Worker ${workerType} is idle: ${isIdle}`)

    if (!isIdle) {
      return NextResponse.json(
        { error: `Worker ${workerType} is not idle` },
        { status: 409 }
      )
    }

    // 执行任务
    console.log(`🚀 Assigning task to worker: ${workerType}`)
    const result = await aiWorkerPool.assignTask(task as PipelineTask, workerType as AIWorkerType)

    console.log(`📋 Task result:`, {
      success: result.success,
      hasScript: !!result.script,
      error: result.error,
      duration: result.duration
    })

    return NextResponse.json({
      success: true,
      result
    })

  } catch (error) {
    console.error('❌ AI Pool test error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}