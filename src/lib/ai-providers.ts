/**
 * AI提供商服务 - 服务器端专用
 * 此文件只能在 API 路由中使用，包含敏感的 API 密钥和配置
 * 
 * 位置: src/lib/ 表明这是服务器端库文件
 * 使用: 只能在 src/app/api/ 路由中导入使用
 */

import { GoogleGenAI } from '@google/genai'
import { Mistral } from '@mistralai/mistralai'
import OpenAI from 'openai'

// 模型配置 - 服务器端专用，前端永远无法访问
const MODEL_CONFIG = {
  GEMINI_MODEL: 'gemini-2.5-flash',
  MISTRAL_MODEL: 'mistral-large-latest', 
  REKA_MODEL: 'reka-flash' // 使用公共可用的基础模型
} as const

export interface AIProvider {
  name: string
  generateResponse: (systemInstruction: string, prompt: string) => Promise<string>
}

// Gemini提供商 - 用于主持人
export const createGeminiProvider = (): AIProvider => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not found in environment variables')
  }

  const client = new GoogleGenAI({ apiKey })

  return {
    name: 'Gemini',
    generateResponse: async (systemInstruction: string, prompt: string): Promise<string> => {
      try {
        const chat = client.chats.create({
          model: MODEL_CONFIG.GEMINI_MODEL,
          config: { 
            systemInstruction,
            temperature: 0.7
          }
        })
        
        const result = await chat.sendMessage({ message: prompt })
        const responseText = result.text?.trim()
        
        console.log('Gemini API response:', {
          hasText: !!responseText,
          textLength: responseText?.length || 0,
          textPreview: responseText?.substring(0, 500)
        })
        
        return responseText || ''
      } catch (error) {
        console.error('Gemini API error:', error)
        // 返回一个备用回应而不是抛出错误
        return `As the moderator, I believe this is an important topic that deserves careful consideration from all perspectives.`
      }
    }
  }
}

// Mistral提供商 - 用于Tom
export const createMistralProvider = (): AIProvider => {
  const apiKey = process.env.MISTRAL_API_KEY
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY not found in environment variables')
  }

  const client = new Mistral({ apiKey })

  return {
    name: 'Mistral',
    generateResponse: async (systemInstruction: string, prompt: string): Promise<string> => {
      const chatResponse = await client.chat.complete({
        model: MODEL_CONFIG.MISTRAL_MODEL,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        maxTokens: 150
      })
      
      const content = chatResponse.choices?.[0]?.message?.content
      if (typeof content === 'string') {
        return content
      } else if (Array.isArray(content)) {
        // 如果是ContentChunk数组，提取文本内容
        return content
          .filter(chunk => chunk.type === 'text')
          .map(chunk => (chunk as any).text || '')
          .join('')
      }
      return ''
    }
  }
}

// Reka提供商 - 用于Mark (使用OpenAI兼容接口)
export const createRekaProvider = (): AIProvider => {
  const apiKey = process.env.REKA_API_KEY
  if (!apiKey) {
    throw new Error('REKA_API_KEY not found in environment variables')
  }

  const client = new OpenAI({
    baseURL: 'https://api.reka.ai/v1',
    apiKey: apiKey,
  });

  return {
    name: 'Reka',
    generateResponse: async (systemInstruction: string, prompt: string): Promise<string> => {
      try {
        const completion = await client.chat.completions.create({
          model: MODEL_CONFIG.REKA_MODEL,
          messages: [
            { 
              role: 'user', 
              content: `${systemInstruction}\n\n${prompt}` 
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        });

        const content = completion.choices[0]?.message?.content?.trim();
        
        console.log('Reka API response:', {
          hasContent: !!content,
          contentLength: content?.length || 0,
          contentPreview: content?.substring(0, 50)
        });
        
        return content || '';
        
      } catch (error) {
        console.error('Reka API error:', error);
        throw error; // 让API路由处理错误
      }
    }
  }
}

// 获取对应角色的AI提供商
export const getAIProviderForSpeaker = (speaker: string): AIProvider => {
  switch (speaker) {
    case 'moderator':
      return createGeminiProvider()
    case 'tom':
      return createMistralProvider()
    case 'mark':
      return createRekaProvider()
    default:
      throw new Error(`Unknown speaker: ${speaker}`)
  }
}

// 获取对应AI工作者的提供商
export const getAIProviderForWorker = (workerType: string): AIProvider => {
  switch (workerType) {
    case 'Gemini':
      return createGeminiProvider()
    case 'Mistral':
      return createMistralProvider()
    case 'Reka':
      return createRekaProvider()
    default:
      throw new Error(`Unknown worker type: ${workerType}`)
  }
}