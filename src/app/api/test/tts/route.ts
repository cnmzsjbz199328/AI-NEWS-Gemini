import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // 测试所有角色的语音生成
    const testCases = [
      { speaker: 'moderator', text: 'Hello, this is the moderator speaking.' },
      { speaker: 'tom', text: 'Hi everyone, this is Tom with a different voice.' },
      { speaker: 'mark', text: 'Greetings, this is Mark with yet another voice.' }
    ]

    const results = []

    for (const { speaker, text } of testCases) {
      try {
        console.log(`Testing TTS for ${speaker}...`)
        
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/speech/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, speaker })
        })

        const success = response.ok
        const size = response.ok ? Number(response.headers.get('content-length') || 0) : 0
        
        results.push({
          speaker,
          success,
          size,
          status: response.status
        })

        console.log(`TTS test for ${speaker}: ${success ? 'SUCCESS' : 'FAILED'} (${size} bytes)`)
      } catch (error) {
        console.error(`TTS test failed for ${speaker}:`, error)
        results.push({
          speaker,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: 'TTS test completed',
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    })

  } catch (error) {
    console.error('TTS test error:', error)
    return NextResponse.json(
      { error: 'TTS test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
