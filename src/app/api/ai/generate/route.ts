import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { PERSONALITIES } from '@/config'

// 确保API密钥从环境变量获取，不暴露给前端
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not found in environment variables')
  }
  return new GoogleGenAI({ apiKey })
}

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

    const ai = getGeminiClient()
    
    // 根据speaker选择对应的人格
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

    // 创建聊天会话
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: { systemInstruction }
    })

    // 构建上下文
    const recentConversation = conversation.slice(-5)
      .map((entry: any) => `${entry.speaker}: ${entry.text}`)
      .join('\n')

    const fullPrompt = recentConversation ? 
      `Context:\n${recentConversation}\n\nNew prompt: ${prompt}` : 
      prompt

    // 生成回应
    const result = await chat.sendMessage({ message: fullPrompt })
    const text = result.text.trim()

    return NextResponse.json({ text })
  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    )
  }
}
