import { NextRequest, NextResponse } from 'next/server'
import { PERSONALITIES } from '@/config'
import { getAIProviderForSpeaker } from '@/lib/ai-providers'

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
    console.log(`Attempting to generate response using ${aiProvider.name} for ${speaker}`)
    
    const text = await aiProvider.generateResponse(systemInstruction, fullPrompt)

    console.log(`Response from ${aiProvider.name}:`, {
      hasText: !!text,
      textLength: text?.length || 0,
      textPreview: text?.substring(0, 1000)
    })

    if (!text || text.trim().length === 0) {
      console.warn(`Empty response from ${aiProvider.name}, using fallback`)
      const fallbackText = `I appreciate this discussion and look forward to hearing different perspectives on this important topic.`
      return NextResponse.json({ text: fallbackText })
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
