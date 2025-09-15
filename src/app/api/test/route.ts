/**
 * 简单测试API端点
 */

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API is working',
    timestamp: Date.now()
  })
}