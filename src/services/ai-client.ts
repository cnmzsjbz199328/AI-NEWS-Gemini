/**
 * 前端 AI 服务 - 客户端专用
 * 此文件负责前端与后端 AI API 的通信
 * 
 * 位置: src/services/ 表明这是前端服务文件  
 * 使用: 前端组件中调用 AI 相关功能
 * 职责: 封装 API 调用，不包含任何敏感信息
 */

import { Speaker } from '@/types'

export interface AIResponse {
  text: string
}

export interface AIError {
  error: string
}

/**
 * 生成 AI 回应
 * @param speaker 发言人角色
 * @param prompt 提示词
 * @returns AI 生成的文本回应
 */
export async function generateAIResponse(speaker: Speaker, prompt: string): Promise<string> {
  try {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        speaker,
        prompt,
      }),
    })

    if (!response.ok) {
      throw new Error(`AI API request failed: ${response.status}`)
    }

    const data: AIResponse = await response.json()
    return data.text
  } catch (error) {
    console.error('AI response generation failed:', error)
    throw error
  }
}

/**
 * 生成语音
 * @param text 要转换为语音的文本
 * @param speaker 发言人角色
 * @returns 语音数据的 Blob
 */
export async function generateSpeech(text: string, speaker: Speaker): Promise<Blob | null> {
  try {
    const response = await fetch('/api/speech/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        speaker,
      }),
    })

    if (!response.ok) {
      console.warn(`Speech generation failed: ${response.status}`)
      return null
    }

    return await response.blob()
  } catch (error) {
    console.error('Speech generation failed:', error)
    return null
  }
}

/**
 * 前端 AI 服务类
 * 提供统一的 AI 功能接口给前端组件使用
 */
export class AIService {
  private static instance: AIService

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  /**
   * 生成 AI 回应（实例方法）
   */
  async generateResponse(speaker: Speaker, prompt: string): Promise<string> {
    return generateAIResponse(speaker, prompt)
  }

  /**
   * 生成语音（实例方法）
   */
  async generateSpeech(text: string, speaker: Speaker): Promise<Blob | null> {
    return generateSpeech(text, speaker)
  }
}
