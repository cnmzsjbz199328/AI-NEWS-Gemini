import { NextRequest, NextResponse } from 'next/server'
import { getAIProviderForSpeaker } from '@/lib/ai-providers'
import { PromptManager, DebateContext } from '@/lib/prompt-manager'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { speaker, prompt, topic, phase, conversation = [] } = body

    if (!speaker || !prompt) {
      return NextResponse.json(
        { error: 'Speaker and prompt are required' },
        { status: 400 }
      )
    }

    const promptManager = PromptManager.getInstance()
    
    // 获取系统指令
    const systemInstruction = promptManager.getSystemInstruction(speaker)
    
    // 构建上下文（如果提供了topic和conversation）
    let finalPrompt = prompt
    if (topic && conversation.length >= 0) {
      const context: DebateContext = {
        topic,
        currentTurn: conversation.length,
        history: conversation
      }
      finalPrompt = promptManager.buildContextualPrompt(speaker, prompt, context)
    }

    // 添加严格的字符限制提醒
    finalPrompt = promptManager.addStrictLimitPrefix(finalPrompt)

    // 获取对应的AI提供商并生成回应
    const aiProvider = getAIProviderForSpeaker(speaker)
    console.log(`Attempting to generate response using ${aiProvider.name} for ${speaker}`)
    console.log(`Final prompt length: ${finalPrompt.length} characters`)
    
    let text = await aiProvider.generateResponse(systemInstruction, finalPrompt)

    console.log(`Response from ${aiProvider.name}:`, {
      hasText: !!text,
      textLength: text?.length || 0,
      textPreview: text?.substring(0, 50)
    })

    // 验证回应质量
    const validation = promptManager.validateResponse(text, speaker)
    if (!validation.isValid) {
      console.warn(`Response validation failed:`, validation.issues)
    }

    // 使用处理后的文本
    text = validation.processedResponse

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
