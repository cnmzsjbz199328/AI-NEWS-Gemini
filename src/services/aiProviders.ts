/**
 * AI提供商服务 - 统一管理不同的AI服务
 * 所有模型配置集中在后端，前端通过API调用时不知道具体使用的模型
 */

import { GoogleGenAI } from '@google/genai'
import { Mistral } from '@mistralai/mistralai'
import OpenAI from 'openai'

// 模型配置 - 只在后端存在，前端不可见
const MODEL_CONFIG = {
  GEMINI_MODEL: 'gemini-2.5-flash',
  MISTRAL_MODEL: 'mistral-large-latest', 
  REKA_MODEL: 'reka-flash-research'
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
          textPreview: responseText?.substring(0, 50)
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

  return {
    name: 'Reka',
    generateResponse: async (systemInstruction: string, prompt: string): Promise<string> => {
      try {
        console.log('Attempting Reka API call using OpenAI client...');
        
        const client = new OpenAI({
          baseURL: 'https://api.reka.ai/v1',
          apiKey: apiKey,
        });

        const completion = await client.chat.completions.create({
          model: MODEL_CONFIG.REKA_MODEL,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt }
          ],
          max_tokens: 150,
          temperature: 0.7
        });

        console.log('Reka response received successfully');
        
        const content = completion.choices[0]?.message?.content;
        
        if (content) {
          return content;
        } else {
          console.warn('Reka API returned empty content');
          return generateFallbackResponse(systemInstruction, prompt);
        }
        
      } catch (error) {
        console.error('Reka API error:', error);
        return generateFallbackResponse(systemInstruction, prompt);
      }
    }
  }
}

// 智能备用回应生成器
function generateFallbackResponse(systemInstruction: string, prompt: string): string {
  // 基于Mark的保守、传统的特征生成合理的回应
  const responses = [
    "I believe we need to approach this with caution and consider the long-term implications.",
    "Traditional methods have proven their worth over time, and we shouldn't rush into untested solutions.",
    "While innovation has its place, we must prioritize stability and proven approaches.",
    "Experience teaches us that hasty decisions often lead to unintended consequences.",
    "Let's not forget the value of time-tested principles in addressing this challenge.",
    "I'm concerned about the potential risks of moving too quickly without proper consideration."
  ]
  
  // 简单的关键词匹配选择合适的回应
  const lowerPrompt = prompt.toLowerCase()
  if (lowerPrompt.includes('technology') || lowerPrompt.includes('ai')) {
    return "While technology offers possibilities, we must carefully weigh its benefits against potential risks to human judgment."
  }
  if (lowerPrompt.includes('change') || lowerPrompt.includes('reform')) {
    return "Change is inevitable, but it should be gradual and well-considered rather than rushed."
  }
  if (lowerPrompt.includes('economy') || lowerPrompt.includes('business')) {
    return "Economic stability requires proven strategies, not experimental approaches that could harm established systems."
  }
  
  // 默认保守回应
  return responses[Math.floor(Math.random() * responses.length)]
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
