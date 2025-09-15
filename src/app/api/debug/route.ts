/**
 * 调试API端点
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Debug POST called')
    
    const body = await request.json()
    console.log('Body parsed:', body)
    
    return NextResponse.json({
      success: true,
      received: body,
      timestamp: Date.now()
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { 
        error: 'Debug error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Debug GET working',
    timestamp: Date.now()
  })
}