/**
 * IndexTTS-2-Demo 语音合成服务
 * 支持音色克隆和情感控制的高级 TTS 服务
 */

import { client, type Client } from '@gradio/client'
import { Speaker } from '@/types'

export interface IndexTTSConfig {
  text: string
  voiceReferenceUrl: string
  emoControlMethod?: string
  temperature?: number
}

export interface IndexTTSResult {
  success: boolean
  audioUrl?: string
  audioBlob?: Blob
  duration?: number
  error?: string
}

// 角色音色配置 - 默认音色参考文件
const DEFAULT_VOICE_REFERENCES = {
  moderator: '/voices/moderator_reference.wav',
  tom: '/voices/tom_reference.wav',
  mark: '/voices/mark_reference.wav'
} as const

export class IndexTTSService {
  private client: Client | null = null
  private readonly baseUrl = 'IndexTeam/IndexTTS-2-Demo'
  private readonly maxRetries = 3
  private readonly retryDelay = 2000 // 2秒

  constructor() {
    console.log('[IndexTTS] Service initialized')
  }

  /**
   * 获取或创建 Gradio 客户端
   */
  private async getClient(): Promise<Client> {
    if (!this.client) {
      console.log('[IndexTTS] Connecting to IndexTTS-2-Demo client...')
      try {
        this.client = await client(this.baseUrl)
        console.log('[IndexTTS] Client connected successfully')
      } catch (error) {
        console.error('[IndexTTS] Failed to connect to client:', error)
        throw new Error(`Failed to connect to IndexTTS: ${error}`)
      }
    }
    return this.client
  }

  /**
   * 检查服务是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.getClient()
      return true
    } catch (error) {
      console.warn('[IndexTTS] Service not available:', error)
      return false
    }
  }

  /**
   * 生成语音
   */
  async generateSpeech(
    text: string, 
    speaker: Speaker, 
    customVoiceUrl?: string
  ): Promise<IndexTTSResult> {
    if (!text.trim()) {
      return {
        success: false,
        error: 'Text cannot be empty'
      }
    }

    const startTime = Date.now()
    console.log(`[IndexTTS] Generating speech for ${speaker}: "${text.substring(0, 50)}..."`)

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[IndexTTS] Attempt ${attempt}/${this.maxRetries}`)

        // 获取客户端
        const app = await this.getClient()

        // 获取音色参考文件
        const voiceReferenceUrl = customVoiceUrl || DEFAULT_VOICE_REFERENCES[speaker]
        const voiceBlob = await this.fetchVoiceReference(voiceReferenceUrl)

        // 调用 IndexTTS API
        const result: any = await app.predict('/gen_single', {
          text: text,
          prompt: voiceBlob,
          emo_control_method: 'Same as the voice reference',
          temperature: 0.8
        })

        // 解析结果
        const audioUrl = result.data?.[0]?.url
        if (!audioUrl) {
          throw new Error('No audio URL in API response')
        }

        const duration = Date.now() - startTime
        console.log(`[IndexTTS] Speech generated successfully for ${speaker} in ${duration}ms`)
        console.log(`[IndexTTS] Audio URL: ${audioUrl}`)

        // 获取音频 Blob 用于预览
        let audioBlob: Blob | undefined
        try {
          const audioResponse = await fetch(audioUrl)
          if (audioResponse.ok) {
            audioBlob = await audioResponse.blob()
          }
        } catch (error) {
          console.warn('[IndexTTS] Failed to fetch audio blob:', error)
        }

        return {
          success: true,
          audioUrl,
          audioBlob,
          duration
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        console.error(`[IndexTTS] Attempt ${attempt} failed:`, lastError.message)

        // 如果连接失败，重置客户端
        if (lastError.message.includes('connect')) {
          this.client = null
        }

        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.maxRetries) {
          console.log(`[IndexTTS] Retrying in ${this.retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, this.retryDelay))
        }
      }
    }

    const duration = Date.now() - startTime
    return {
      success: false,
      duration,
      error: `Failed after ${this.maxRetries} attempts: ${lastError?.message}`
    }
  }

  /**
   * 获取音色参考文件
   */
  private async fetchVoiceReference(voiceUrl: string): Promise<Blob> {
    try {
      // 如果是相对路径，转换为完整URL
      const fullUrl = voiceUrl.startsWith('/') 
        ? `${window.location.origin}${voiceUrl}`
        : voiceUrl

      console.log(`[IndexTTS] Fetching voice reference: ${fullUrl}`)
      
      const response = await fetch(fullUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch voice reference: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()
      console.log(`[IndexTTS] Voice reference loaded, size: ${blob.size} bytes`)
      
      return blob
    } catch (error) {
      console.error('[IndexTTS] Error fetching voice reference:', error)
      throw new Error(`Voice reference fetch failed: ${error}`)
    }
  }

  /**
   * 批量生成语音（用于单条新闻的所有角色）
   */
  async generateBatchSpeech(
    segments: Array<{ text: string; speaker: Speaker; id: string }>
  ): Promise<Map<string, IndexTTSResult>> {
    console.log(`[IndexTTS] Starting batch generation for ${segments.length} segments`)
    
    const results = new Map<string, IndexTTSResult>()
    
    // 并发生成所有音频
    const promises = segments.map(async (segment) => {
      const result = await this.generateSpeech(segment.text, segment.speaker)
      results.set(segment.id, result)
      return { id: segment.id, result }
    })

    // 等待所有音频生成完成
    await Promise.all(promises)
    
    const successCount = Array.from(results.values()).filter(r => r.success).length
    console.log(`[IndexTTS] Batch generation completed: ${successCount}/${segments.length} successful`)
    
    return results
  }

  /**
   * 获取支持的角色列表
   */
  getSupportedSpeakers(): Speaker[] {
    return ['moderator', 'tom', 'mark']
  }

  /**
   * 获取默认音色配置
   */
  getDefaultVoiceConfig() {
    return DEFAULT_VOICE_REFERENCES
  }

  /**
   * 重置客户端连接
   */
  resetConnection(): void {
    console.log('[IndexTTS] Resetting client connection')
    this.client = null
  }

  /**
   * 清理资源
   */
  dispose(): void {
    console.log('[IndexTTS] Disposing service')
    this.client = null
  }
}

// 导出单例实例
export const indexTTSService = new IndexTTSService()