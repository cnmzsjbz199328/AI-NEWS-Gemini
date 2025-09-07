import { NextRequest, NextResponse } from 'next/server'
import { PERSONALITIES } from '@/config'
import { getAIProviderForSpeaker } from '@/services/aiProviders'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { speaker, prompt, conversation = [] } = body

    if (!speaker || !prompt) {
      return NextResponse.json(
        { error: 'Speaker and prompt are required' },
        { status: 400 }
      )
    }
    
    // 根据speaker选择对应的人格和AI提供商
    let systemInstruction: string
    
    switch (speaker) {
      case 'moderator':
        systemInstruction = PERSONALITIES.MODERATOR
        break
      case 'tom':
        systemInstruction = PERSONALITIES.TOM
        break
      case 'mark':
        systemInstruction = PERSONALITIES.MARK
        break
      default:
        return NextResponse.json(
          { error: 'Invalid speaker' },
          { status: 400 }
        )
    }

    // 构建上下文
    const recentConversation = conversation.slice(-5)
      .map((entry: any) => `${entry.speaker}: ${entry.text}`)
      .join('\n')

    const fullPrompt = recentConversation ? 
      `Context:\n${recentConversation}\n\nNew prompt: ${prompt}` : 
      prompt

    // 获取对应的AI提供商并生成回应
    const aiProvider = getAIProviderForSpeaker(speaker)
    const text = await aiProvider.generateResponse(systemInstruction, fullPrompt)

    if (!text) {
      throw new Error(`Empty response from ${aiProvider.name} AI service`)
    }

    console.log(`Generated response using ${aiProvider.name} for ${speaker}: ${text.substring(0, 50)}...`)

    return NextResponse.json({ text })
  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: `Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
