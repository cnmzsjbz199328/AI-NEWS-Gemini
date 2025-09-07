import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, Modality } from '@google/genai'
import { PERSONALITIES } from '@/config'

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
    const { text, speaker } = body

    if (!text || !speaker) {
      return NextResponse.json(
        { error: 'Text and speaker are required' },
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

    // 添加朗读指令
    const narrationInstruction = ` You will be given a line of text. Your only task is to say this line of text out loud in character. Do not add any extra words or commentary.`
    systemInstruction += narrationInstruction

    // 生成语音
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: [{ text }],
      },
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: systemInstruction,
      },
    })

    // 收集音频数据
    const audioChunks: Uint8Array[] = []
    
    for await (const chunk of responseStream) {
      const audio = chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData
      if (audio?.data) {
        // 将base64转换为Uint8Array
        const binaryString = atob(audio.data)
        const audioData = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          audioData[i] = binaryString.charCodeAt(i)
        }
        audioChunks.push(audioData)
      }
    }

    if (audioChunks.length === 0) {
      return NextResponse.json(
        { error: 'No audio data generated' },
        { status: 500 }
      )
    }

    // 合并音频数据
    const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const combinedAudio = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of audioChunks) {
      combinedAudio.set(chunk, offset)
      offset += chunk.length
    }

    // 返回音频数据
    return new NextResponse(combinedAudio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': combinedAudio.length.toString(),
      },
    })
  } catch (error) {
    console.error('Speech generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    )
  }
}
