/**
 * IndexTTS-2-Demo 语音合成服务
 * 支持音色克隆和情感控制的高级 TTS 服务
 */

import { client, type Client } from '@gradio/client'
import { Speaker } from '@/types'
import { getVoiceConfigManager } from './voice-config-manager'

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

// 获取角色对应的音色URL（动态从voice-config-manager获取）
function getVoiceUrlForSpeaker(speaker: Speaker): string {
  const voiceManager = getVoiceConfigManager()
  const voiceConfig = voiceManager.getVoiceForRole(speaker)
  return voiceConfig.url
}

export class IndexTTSService {
  private client: Client | null = null
  private readonly baseUrl = 'Tom1986/indextts2' // 使用私有Space
  private readonly maxRetries = 3
  private readonly retryDelay = 2000 // 2秒
  private readonly hfToken = process.env.HF_TOKEN // Hugging Face token

  constructor() {
    console.log('[IndexTTS] Service initialized with private space')
    if (!this.hfToken) {
      console.warn('[IndexTTS] No HF_TOKEN found in environment variables')
    }
  }

  /**
   * 获取或创建 Gradio 客户端
   */
  private async getClient(): Promise<Client> {
    if (!this.client) {
      console.log('[IndexTTS] Connecting to private space client...')
      try {
        // 使用token连接私有Space
        const connectOptions: any = {
          timeout: 60000
        }
        
        if (this.hfToken) {
          connectOptions.hf_token = this.hfToken
        }
        
        this.client = await client(this.baseUrl, connectOptions)
        console.log('[IndexTTS] Private space client connected successfully')
      } catch (error) {
        console.error('[IndexTTS] Failed to connect to private space:', error)
        throw new Error(`Failed to connect to IndexTTS private space: ${error}`)
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
   * 生成语音（使用Blob数据）
   */
  async generateSpeechWithBlob(
    text: string, 
    speaker: Speaker, 
    voiceBlob: Blob
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

        // 直接使用传入的voiceBlob
        console.log(`[IndexTTS] Using provided voice blob, size: ${voiceBlob.size} bytes`)
        
        // 🔍 检查voiceBlob的详细信息
        console.log(`[IndexTTS] VoiceBlob details:`, {
          size: voiceBlob.size,
          type: voiceBlob.type,
          hasType: !!voiceBlob.type,
          constructor: voiceBlob.constructor.name
        })
        
        // 🔍 如果type为空，尝试创建一个有正确type的blob
        const voiceBlobWithType = voiceBlob.type ? voiceBlob : new Blob([voiceBlob], { type: 'audio/m4a' })
        console.log(`[IndexTTS] Using voiceBlob with type:`, voiceBlobWithType.type)

        // 调用 IndexTTS API - 使用数组格式参数
        console.log(`[IndexTTS] Using CORRECT object format parameters:`, {
          prompt: `${voiceBlobWithType.size} bytes, type: ${voiceBlobWithType.type}`,
          text: `"${text.substring(0, 30)}..."`,
          emo_control_method: "Same as the voice reference",
          emo_ref_path: `${voiceBlobWithType.size} bytes (same as prompt)`,
          emo_weight: 0.8
        })
        
        let result: any
        try {
          // 🔍 首先尝试获取API信息来验证端点
          console.log(`[IndexTTS] 🔍 Checking available API endpoints...`)
          try {
            const apiInfo = await app.view_api()
            console.log(`[IndexTTS] Available API endpoints:`, apiInfo)
            
            // 🔍 详细检查 /gen_single 端点的参数要求
            if (apiInfo.named_endpoints && apiInfo.named_endpoints['/gen_single']) {
              const genSingleInfo = apiInfo.named_endpoints['/gen_single']
              console.log(`[IndexTTS] /gen_single endpoint details:`, {
                parameters: genSingleInfo.parameters,
                returns: genSingleInfo.returns,
                type: genSingleInfo.type
              })
              
              // 详细显示每个参数
              if (genSingleInfo.parameters) {
                genSingleInfo.parameters.forEach((param: any, index: number) => {
                  console.log(`[IndexTTS] Parameter ${index + 1}:`, param)
                })
              }
            }
          } catch (apiInfoError) {
            console.warn(`[IndexTTS] Could not get API info:`, apiInfoError)
          }
          
          console.log(`[IndexTTS] 🚀 Using corrected 24-parameter array format from development plan...`)
          
          // 使用handle_file处理音频Blob
          const { handle_file } = await import('@gradio/client')
          const handledVoiceFile = handle_file(voiceBlobWithType)
          
          console.log(`[IndexTTS] Processed voice file with handle_file:`, {
            originalSize: voiceBlobWithType.size,
            originalType: voiceBlobWithType.type,
            handledFile: typeof handledVoiceFile
          })
          
          // 按照开发计划中的成功模板，使用24个参数的数组格式
          const params = [
            "Same as the voice reference",  // 0: emotion_control_method
            handledVoiceFile,              // 1: voice_reference (关键!)
            text,                          // 2: text
            null,                          // 3: emotion_reference
            0.8,                          // 4: emotion_weight
            0, 0, 0, 0, 0, 0, 0, 0,      // 5-12: emotion_vectors (8个)
            "",                           // 13: emotion_text
            false,                        // 14: random_emotion
            120,                          // 15: max_tokens
            true, 0.8, 30, 0.8, 0, 3, 10, 1500  // 16-23: 高级参数
          ]
          
          console.log(`[IndexTTS] Calling /gen_single with 24-parameter array format`)
          result = await app.predict("/gen_single", params)
          
          console.log(`[IndexTTS] ✅ API call succeeded with object format!`)
          console.log(`[IndexTTS] 🎉 API CALL SUCCEEDED! Received response.`)
        } catch (predictError) {
          // 🔍 关键：捕获并详细记录API调用的具体错误
          console.error(`[IndexTTS] ❌ API CALL FAILED:`, {
            error: predictError,
            message: predictError instanceof Error ? predictError.message : 'No message',
            stack: predictError instanceof Error ? predictError.stack : 'No stack',
            name: predictError instanceof Error ? predictError.name : typeof predictError,
            stringified: JSON.stringify(predictError, null, 2)
          })
          
          // 重新抛出具体的错误而不是"Unknown error"
          throw predictError instanceof Error ? predictError : new Error(`API predict failed: ${JSON.stringify(predictError)}`)
        }
        
        console.log(`[IndexTTS] API response received:`, {
          hasData: !!result.data,
          dataLength: result.data?.length,
          firstElement: result.data?.[0]
        })
        
        // 🔍 关键调试：记录完整的原始响应结构
        console.log(`[IndexTTS] COMPLETE RAW API RESPONSE:`, JSON.stringify(result, null, 2))

        // 解析结果 - 根据文档优先检查IndexTTS-2的嵌套格式
        let audioUrl: string | undefined

        // 格式1: IndexTTS-2嵌套URL格式 (result.data[0].value.url) - 根据文档这是主要格式
        if (result.data?.[0]?.value?.url) {
          audioUrl = result.data[0].value.url
          console.log(`[IndexTTS] ✅ Found audio URL in IndexTTS-2 format (value.url):`, audioUrl)
        }
        // 格式2: 直接URL格式 (result.data[0].url) - 备选格式
        else if (result.data?.[0]?.url) {
          audioUrl = result.data[0].url
          console.log(`[IndexTTS] ✅ Found audio URL in direct format:`, audioUrl)
        }
        // 格式3: Base64数据格式
        else if (result.data?.[0]?.data && typeof result.data[0].data === 'string') {
          audioUrl = result.data[0].data
          const safeUrl = audioUrl || ''  // 确保不是undefined
          console.log(`[IndexTTS] Found audio data in Format 3 (base64):`, safeUrl.substring(0, 50) + '...')
        }
        
        if (!audioUrl) {
          console.error(`[IndexTTS] No audio URL found in any expected format!`)
          console.error(`[IndexTTS] Available data paths:`, {
            'data': !!result.data,
            'data[0]': !!result.data?.[0],
            'data[0].url': !!result.data?.[0]?.url,
            'data[0].value': !!result.data?.[0]?.value,
            'data[0].value.url': !!result.data?.[0]?.value?.url,
            'data[0].data': !!result.data?.[0]?.data
          })
          throw new Error(`No audio URL in API response. Response structure: ${JSON.stringify(result?.data)}`)
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
        const voiceReferenceUrl = customVoiceUrl || getVoiceUrlForSpeaker(speaker)
        const voiceBlob = await this.fetchVoiceReference(voiceReferenceUrl)

        // 使用handle_file处理音频Blob
        const { handle_file } = await import('@gradio/client')
        const handledVoiceFile = handle_file(voiceBlob)
        
        // 使用正确的24参数数组格式
        const params = [
          "Same as the voice reference",  // 0: emotion_control_method
          handledVoiceFile,              // 1: voice_reference (关键!)
          text,                          // 2: text
          null,                          // 3: emotion_reference
          0.8,                          // 4: emotion_weight
          0, 0, 0, 0, 0, 0, 0, 0,      // 5-12: emotion_vectors (8个)
          "",                           // 13: emotion_text
          false,                        // 14: random_emotion
          120,                          // 15: max_tokens
          true, 0.8, 30, 0.8, 0, 3, 10, 1500  // 16-23: 高级参数
        ]
        
        const result: any = await app.predict('/gen_single', params)

        // 🔍 关键调试：记录完整的原始响应结构 - generateSpeech方法
        console.log(`[IndexTTS] COMPLETE RAW API RESPONSE (generateSpeech):`, JSON.stringify(result, null, 2))

        // 解析结果 - 检查多种可能的响应格式
        let audioUrl: string | undefined

        // 格式1: 直接URL格式 (result.data[0].url)
        if (result.data?.[0]?.url) {
          audioUrl = result.data[0].url
          console.log(`[IndexTTS] Found audio URL in Format 1 (direct):`, audioUrl)
        }
        // 格式2: 嵌套URL格式 (result.data[0].value.url)
        else if (result.data?.[0]?.value?.url) {
          audioUrl = result.data[0].value.url
          console.log(`[IndexTTS] Found audio URL in Format 2 (nested):`, audioUrl)
        }
        // 格式3: Base64数据格式
        else if (result.data?.[0]?.data && typeof result.data[0].data === 'string') {
          audioUrl = result.data[0].data
          const safeUrl = audioUrl || ''
          console.log(`[IndexTTS] Found audio data in Format 3 (base64):`, safeUrl.substring(0, 50) + '...')
        }
        
        if (!audioUrl) {
          console.error(`[IndexTTS] No audio URL found in any expected format! (generateSpeech)`)
          console.error(`[IndexTTS] Available data paths:`, {
            'data': !!result.data,
            'data[0]': !!result.data?.[0],
            'data[0].url': !!result.data?.[0]?.url,
            'data[0].value': !!result.data?.[0]?.value,
            'data[0].value.url': !!result.data?.[0]?.value?.url,
            'data[0].data': !!result.data?.[0]?.data
          })
          throw new Error(`No audio URL in API response. Response structure: ${JSON.stringify(result?.data)}`)
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
    const voiceManager = getVoiceConfigManager()
    return {
      moderator: voiceManager.getVoiceForRole('moderator').url,
      tom: voiceManager.getVoiceForRole('tom').url,
      mark: voiceManager.getVoiceForRole('mark').url
    }
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