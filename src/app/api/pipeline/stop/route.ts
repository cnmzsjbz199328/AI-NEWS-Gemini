/**
 * 停止流水线API端点
 * POST /api/pipeline/stop
 */

import { NextRequest, NextResponse } from 'next/server'
import { pipelineScheduler } from '@/lib/PipelineScheduler'

export async function POST(request: NextRequest) {
  try {
    // 检查流水线是否激活
    const currentState = pipelineScheduler.getState()
    if (!currentState.isActive) {
      return NextResponse.json(
        { error: 'Pipeline is not currently active' },
        { status: 400 }
      )
    }

    // 停止流水线
    pipelineScheduler.stopPipeline()
    
    return NextResponse.json({
      success: true,
      message: 'Pipeline stopped successfully'
    })

  } catch (error) {
    console.error('Pipeline stop error:', error)
    return NextResponse.json(
      { error: 'Internal server error while stopping pipeline' },
      { status: 500 }
    )
  }
}

// GET方法返回当前流水线状态
export async function GET() {
  try {
    const state = pipelineScheduler.getState()
    return NextResponse.json({
      canStop: state.isActive,
      isActive: state.isActive,
      totalTasks: state.totalTasks,
      currentPlayIndex: state.currentPlayIndex
    })
  } catch (error) {
    console.error('Pipeline stop status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 处理不支持的HTTP方法
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to stop pipeline.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to stop pipeline.' },
    { status: 405 }
  )
}