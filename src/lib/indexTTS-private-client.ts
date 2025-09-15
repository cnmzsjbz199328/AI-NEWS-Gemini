/**
 * IndexTTS-2 私有Space API客户端
 * 基于开发指南实现的专用API客户端
 * 使用 handle_file() 和 24参数结构
 */

import { Client, handle_file } from '@gradio/client'

// API参数配置接口
export interface IndexTTSAPIParams {
  text: string
  voiceBlob: Blob
  emotionControlMethod?: string
  emotionWeight?: number
  emotionVectors?: number[]
  emotionText?: string
  temperature?: number
  topP?: number
  topK?: number
  maxTokens?: number
  doSample?: boolean
  lengthPenalty?: number
  numBeams?: number
  repetitionPenalty?: number
  maxMelTokens?: number
}

// API响应接口
export interface IndexTTSAPIResponse {
  success: boolean
  audioUrl?: string
  audioBlob?: Blob
  duration?: number
  error?: string
}

// 情感预设
export const EMOTION_PRESETS = {
  neutral: [0, 0, 0, 0, 0, 0, 0, 1],
  happy: [1, 0, 0, 0, 0, 0, 0, 0],
  angry: [0, 1, 0, 0, 0, 0, 0, 0],
  sad: [0, 0, 1, 0, 0, 0, 0, 0],
  fear: [0, 0, 0, 1, 0, 0, 0, 0],
  hate: [0, 0, 0, 0, 1, 0, 0, 0],
  low: [0, 0, 0, 0, 0, 1, 0, 0],
  surprise: [0, 0, 0, 0, 0, 0, 1, 0]
} as const

export class IndexTTSPrivateClient {
  private client: Client | null = null
  private readonly spaceId = 'Tom1986/indextts2'
  private readonly hfToken: string
  private readonly maxRetries = 3
  private readonly retryDelay = 1500  // 减少重试延迟
  private readonly requestTimeout = 45000  // 45秒超时（之前可能太长）

  constructor() {
    // 从环境变量获取HF token
    this.hfToken = process.env.HF_TOKEN || process.env.hf_token || ''
    if (!this.hfToken) {
      console.error('[IndexTTS-Client] ❌ HF_TOKEN not found')
      throw new Error('HF_TOKEN is required for private Space access')
    }
    console.log('[IndexTTS-Client] ✅ Client initialized with 45s timeout')
  }

  /**
   * 建立或获取客户端连接
   */
  private async getClient(): Promise<Client> {
    if (!this.client) {
      console.log(`[IndexTTS-Client] 🔐 Connecting to private Space: ${this.spaceId}`)
      try {
        this.client = await Client.connect(this.spaceId, {
          hf_token: this.hfToken as `hf_${string}`
        })
        console.log('[IndexTTS-Client] ✅ Connected successfully')
      } catch (error) {
        console.error('[IndexTTS-Client] ❌ Connection failed:', error)
        throw new Error(`Failed to connect to private Space: ${error}`)
      }
    }
    return this.client
  }

  /**
   * 处理音频文件 - 基于开发指南的统一处理方式
   */
  private async processAudioFile(source: Blob | string): Promise<any> {
    try {
      let blob: Blob

      if (typeof source === 'string' && source.startsWith('http')) {
        // 网络文件处理
        console.log(`[IndexTTS-Client] 📥 Downloading network file...`)
        const response = await fetch(source)
        if (!response.ok) {
          throw new Error(`Failed to download: ${response.status} ${response.statusText}`)
        }
        blob = await response.blob()
        console.log(`[IndexTTS-Client] ✅ Downloaded ${blob.size} bytes`)
      } else if (source instanceof Blob) {
        // Blob对象处理
        blob = source
        console.log(`[IndexTTS-Client] 📁 Using provided Blob: ${blob.size} bytes`)
      } else {
        throw new Error('Unsupported source type')
      }

      // 确保正确的MIME类型
      if (!blob.type || !blob.type.startsWith('audio/')) {
        console.warn('[IndexTTS-Client] ⚠️ Setting audio MIME type')
        blob = new Blob([blob], { type: 'audio/m4a' })
      }

      // 关键步骤：使用handle_file()处理
      console.log('[IndexTTS-Client] 🔄 Processing with handle_file...')
      const handledFile = handle_file(blob)
      console.log('[IndexTTS-Client] ✅ File processed successfully')
      
      return handledFile
    } catch (error) {
      console.error('[IndexTTS-Client] ❌ File processing failed:', error)
      throw new Error(`File processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 构建24参数API调用结构 - 基于开发指南
   */
  private buildAPIParameters(
    text: string,
    processedVoiceFile: any,
    config: Partial<IndexTTSAPIParams> = {}
  ): any[] {
    // 基于开发指南的完整24参数结构
    const parameters = [
      // 0: emotion_control_method
      config.emotionControlMethod || "Same as the voice reference",
      // 1: voice_reference (关键!)
      processedVoiceFile,
      // 2: text
      text,
      // 3: emotion_reference
      config.emotionControlMethod === "Use emotion reference audio" ? processedVoiceFile : null,
      // 4: emotion_weight
      config.emotionWeight || 0.8,
      // 5-12: emotion_vectors (8个)
      ...(config.emotionVectors || EMOTION_PRESETS.neutral),
      // 13: emotion_text
      config.emotionText || "",
      // 14: random_emotion
      false,
      // 15: max_tokens
      config.maxTokens || 120,
      // 16: do_sample
      config.doSample !== undefined ? config.doSample : true,
      // 17: top_p
      config.topP || 0.8,
      // 18: top_k
      config.topK || 30,
      // 19: temperature
      config.temperature || 0.8,
      // 20: length_penalty
      config.lengthPenalty || 0,
      // 21: num_beams
      config.numBeams || 3,
      // 22: repetition_penalty
      config.repetitionPenalty || 10,
      // 23: max_mel_tokens
      config.maxMelTokens || 1500
    ]

    console.log(`[IndexTTS-Client] 🔧 Built ${parameters.length} parameters`)
    return parameters
  }

  /**
   * 解析API响应
   */
  private async parseAPIResponse(result: any, startTime: number): Promise<IndexTTSAPIResponse> {
    console.log('[IndexTTS-Client] 📊 Parsing API response...')
    
    let audioUrl: string | undefined

    // 多种格式兼容 - 基于开发指南
    if (result.data?.[0]?.url) {
      audioUrl = result.data[0].url
      console.log('[IndexTTS-Client] ✅ Found audio URL:', audioUrl)
    } else if (result.data?.[0]?.value?.url) {
      audioUrl = result.data[0].value.url
      console.log('[IndexTTS-Client] ✅ Found nested audio URL:', audioUrl)
    } else if (result.data?.[0]) {
      console.log('[IndexTTS-Client] 📋 Response structure:', Object.keys(result.data[0]))
      throw new Error('Audio URL not found in expected format')
    } else {
      throw new Error('Invalid API response structure')
    }

    // 获取音频Blob用于缓存
    let audioBlob: Blob | undefined
    if (audioUrl) {
      try {
        const response = await fetch(audioUrl)
        if (response.ok) {
          audioBlob = await response.blob()
          console.log(`[IndexTTS-Client] ✅ Downloaded audio blob: ${audioBlob.size} bytes`)
        }
      } catch (error) {
        console.warn('[IndexTTS-Client] ⚠️ Failed to download audio blob:', error)
      }
    }

    const duration = Date.now() - startTime
    console.log(`[IndexTTS-Client] ✅ Processing completed in ${duration}ms`)

    return {
      success: true,
      audioUrl,
      audioBlob,
      duration
    }
  }

  /**
   * 生成语音 - 主要API方法
   */
  async generateSpeech(
    text: string,
    voiceSource: Blob | string,
    config: Partial<IndexTTSAPIParams> = {}
  ): Promise<IndexTTSAPIResponse> {
    if (!text.trim()) {
      return {
        success: false,
        error: 'Text cannot be empty'
      }
    }

    const startTime = Date.now()
    console.log(`[IndexTTS-Client] 🚀 Starting speech generation: "${text.substring(0, 50)}..."`)

    let lastError: Error | null = null

    // 重试机制
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[IndexTTS-Client] 📋 Attempt ${attempt}/${this.maxRetries}`)

        // 1. 获取客户端连接
        const client = await this.getClient()

        // 2. 处理音频文件
        const processedVoiceFile = await this.processAudioFile(voiceSource)

        // 3. 构建API参数
        const apiParameters = this.buildAPIParameters(text, processedVoiceFile, config)

        // 4. 调用API with timeout control
        console.log('[IndexTTS-Client] 🔄 Calling /gen_single...')
        
        // 创建超时Promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Request timeout after ${this.requestTimeout}ms`)), this.requestTimeout)
        })

        // API调用Promise
        const apiPromise = client.predict('/gen_single', apiParameters)

        // 使用Promise.race来实现超时控制
        const result = await Promise.race([apiPromise, timeoutPromise])

        // 5. 解析响应
        return await this.parseAPIResponse(result, startTime)

      } catch (error) {
        lastError = error as Error
        console.error(`[IndexTTS-Client] ❌ Attempt ${attempt} failed:`, lastError.message)

        if (attempt < this.maxRetries) {
          console.log(`[IndexTTS-Client] ⏱️ Retrying in ${this.retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, this.retryDelay))
        }
      }
    }

    return {
      success: false,
      error: `All ${this.maxRetries} attempts failed. Last error: ${lastError?.message || 'Unknown error'}`
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getClient()
      return true
    } catch (error) {
      console.error('[IndexTTS-Client] ❌ Connection test failed:', error)
      return false
    }
  }

  /**
   * 关闭客户端连接
   */
  async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close()
        console.log('[IndexTTS-Client] ✅ Client closed')
      } catch (error) {
        console.warn('[IndexTTS-Client] ⚠️ Error closing client:', error)
      } finally {
        this.client = null
      }
    }
  }

  /**
   * 获取API信息（调试用）
   */
  async getAPIInfo(): Promise<any> {
    try {
      const client = await this.getClient()
      const apiInfo = await client.view_api()
      return apiInfo
    } catch (error) {
      console.error('[IndexTTS-Client] ❌ Failed to get API info:', error)
      throw error
    }
  }
}

// 单例模式
let clientInstance: IndexTTSPrivateClient | null = null

export function getIndexTTSClient(): IndexTTSPrivateClient {
  if (!clientInstance) {
    clientInstance = new IndexTTSPrivateClient()
  }
  return clientInstance
}
