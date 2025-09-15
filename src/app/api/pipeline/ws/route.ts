/**
 * WebSocket实时状态同步端点
 * GET /api/pipeline/ws (WebSocket升级)
 */

import { NextRequest } from 'next/server'
import { pipelineScheduler } from '@/lib/PipelineScheduler'

// 简化的WebSocket状态管理
console.log('WebSocket route loaded')

export async function GET(request: NextRequest) {
  try {
    // 检查是否支持WebSocket升级
    const upgrade = request.headers.get('upgrade')
    if (upgrade !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 400 })
    }

    // 在Node.js环境中，我们需要使用不同的WebSocket实现
    // 这里返回一个指导信息，实际的WebSocket服务器需要在不同的端口运行
    return new Response(
      JSON.stringify({
        error: 'WebSocket endpoint not available in this environment',
        message: 'Please use a WebSocket client to connect to ws://localhost:3001/ws for real-time updates',
        alternativeEndpoint: '/api/pipeline/status',
        pollingRecommendation: 'Poll /api/pipeline/status every 2-3 seconds for status updates'
      }),
      {
        status: 501,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('WebSocket upgrade error:', error)
    return new Response('WebSocket upgrade failed', { status: 500 })
  }
}

// 处理不支持的HTTP方法
export async function POST() {
  return new Response('Method not allowed. Use WebSocket upgrade.', { status: 405 })
}

export async function PUT() {
  return new Response('Method not allowed. Use WebSocket upgrade.', { status: 405 })
}

export async function DELETE() {
  return new Response('Method not allowed. Use WebSocket upgrade.', { status: 405 })
}