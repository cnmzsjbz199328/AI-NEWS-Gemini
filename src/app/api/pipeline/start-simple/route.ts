/**
 * 简化版启动流水线API端点
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Received start request:', body)
    
    // 基础验证
    if (!body.newsTopics || !Array.isArray(body.newsTopics) || body.newsTopics.length === 0) {
      return NextResponse.json(
        { error: 'newsTopics is required and must be a non-empty array' },
        { status: 400 }
      )
    }

    // 模拟启动流水线
    return NextResponse.json({
      success: true,
      message: 'Pipeline started successfully (simplified)',
      pipelineState: { 
        totalTasks: body.newsTopics.length, 
        isActive: true, 
        currentPlayIndex: 0 
      }
    })

  } catch (error) {
    console.error('Pipeline start error:', error)
    return NextResponse.json(
      { error: 'Internal server error while starting pipeline' },
      { status: 500 }
    )
  }
}