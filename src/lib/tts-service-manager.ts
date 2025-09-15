/**
 * TTS 服务管理器 - 三层架构
 * IndexTTS-2-Demo → CosyVoice → Web Speech API
 */

import { Speaker } from '@/types'
import { indexTTSService, type IndexTTSResult } from './indexTTS-service'
import { cosyVoiceTTSService } from './cosyvoice-tts-service'

export type TTSServiceType = 'indexTTS' | 'cosyVoice'

export interface TTSGenerationResult {
  success: boolean
  audioUrl?: string
  audioBlob?: Blob
  duration?: number
  serviceUsed: TTSServiceType
  error?: string
}

export interface TTSServiceStatus {
  indexTTS: boolean
  cosyVoice: boolean
}

export class TTSServiceManager {
  private serviceStatus: TTSServiceStatus = {
    indexTTS: false,
    cosyVoice: false
  }

  constructor() {
    console.log('[TTSManager] Initializing TTS Service Manager')
    this.checkServiceAvailability()
  }


  /**
   * 检查所有服务可用性
   */
  async checkServiceAvailability(): Promise<TTSServiceStatus> {
    console.log('[TTSManager] Checking service availability...')

    // 检查 IndexTTS
    try {
      this.serviceStatus.indexTTS = await indexTTSService.isAvailable()
      console.log(`[TTSManager] IndexTTS available: ${this.serviceStatus.indexTTS}`)
    } catch (error) {
      console.warn('[TTSManager] IndexTTS check failed:', error)
      this.serviceStatus.indexTTS = false
    }

    // 检查 CosyVoice
    try {
      // CosyVoice 服务检查（简化版）
      this.serviceStatus.cosyVoice = true // 假设总是可用，实际可以添加健康检查
      console.log(`[TTSManager] CosyVoice available: ${this.serviceStatus.cosyVoice}`)
    } catch (error) {
      console.warn('[TTSManager] CosyVoice check failed:', error)
      this.serviceStatus.cosyVoice = false
    }

    console.log('[TTSManager] Service status:', this.serviceStatus)
    return this.serviceStatus
  }

  /**
   * 生成语音 - 自动降级策略（优先使用IndexTTS）
   */
  async generateSpeech(
    text: string, 
    speaker: Speaker,
    preferredService?: TTSServiceType
  ): Promise<TTSGenerationResult> {
    console.log(`[TTSManager] Generating speech for ${speaker} with preferred service: ${preferredService || 'IndexTTS (default)'}`)

    // 定义服务优先级 - IndexTTS 为主力，CosyVoice 为备用
    const allServices: TTSServiceType[] = ['indexTTS', 'cosyVoice']
    const serviceOrder: TTSServiceType[] = preferredService 
      ? [preferredService, ...allServices.filter(s => s !== preferredService)]
      : allServices // IndexTTS 已经是第一位

    let lastError: string | undefined

    for (const serviceType of serviceOrder) {
      if (!this.serviceStatus[serviceType]) {
        console.log(`[TTSManager] Skipping ${serviceType} - not available`)
        continue
      }

      try {
        console.log(`[TTSManager] 🎯 Using ${serviceType} as PRIMARY service for ${speaker}`)
        
        switch (serviceType) {
          case 'indexTTS':
            return await this.tryIndexTTS(text, speaker)
          
          case 'cosyVoice':
            // CosyVoice 作为备用服务，只在 IndexTTS 不可用时使用
            console.warn(`[TTSManager] ⚠️ Using CosyVoice as FALLBACK service`)
            return await this.tryCosyVoice(text, speaker)
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.warn(`[TTSManager] ${serviceType} failed for ${speaker}:`, errorMsg)
        lastError = errorMsg
        
        // 标记服务为不可用
        this.serviceStatus[serviceType] = false
      }
    }

    // 所有服务都失败
    return {
      success: false,
      serviceUsed: 'indexTTS', // 默认值
      error: `All TTS services failed. Last error: ${lastError}`
    }
  }

  /**
   * 尝试使用 IndexTTS
   */
  private async tryIndexTTS(text: string, speaker: Speaker): Promise<TTSGenerationResult> {
    const result = await indexTTSService.generateSpeech(text, speaker)
    
    if (!result.success) {
      throw new Error(result.error || 'IndexTTS generation failed')
    }

    // 下载音频文件并转换为 Blob
    const audioBlob = await this.downloadAudioAsBlob(result.audioUrl!)
    
    return {
      success: true,
      audioUrl: result.audioUrl,
      audioBlob,
      duration: result.duration,
      serviceUsed: 'indexTTS'
    }
  }

  /**
   * 尝试使用 CosyVoice
   */
  private async tryCosyVoice(text: string, speaker: Speaker): Promise<TTSGenerationResult> {
    const result = await cosyVoiceTTSService.generateSpeech(speaker, text, 'en-US')
    
    if (!result.success) {
      throw new Error(result.error || 'CosyVoice generation failed')
    }

    // 下载音频文件并转换为 Blob
    const audioBlob = await this.downloadAudioAsBlob(result.audioUrl)
    
    return {
      success: true,
      audioUrl: result.audioUrl,
      audioBlob,
      duration: result.duration,
      serviceUsed: 'cosyVoice'
    }
  }


  /**
   * 下载音频文件并转换为 Blob
   */
  private async downloadAudioAsBlob(audioUrl: string): Promise<Blob> {
    try {
      console.log(`[TTSManager] Downloading audio: ${audioUrl}`)
      const response = await fetch(audioUrl)
      
      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.status}`)
      }
      
      const blob = await response.blob()
      console.log(`[TTSManager] Audio downloaded, size: ${blob.size} bytes`)
      
      return blob
    } catch (error) {
      console.error('[TTSManager] Error downloading audio:', error)
      throw error
    }
  }

  /**
   * 批量生成语音（用于单条新闻）
   */
  async generateBatchSpeech(
    segments: Array<{ text: string; speaker: Speaker; id: string }>,
    preferredService?: TTSServiceType
  ): Promise<Map<string, TTSGenerationResult>> {
    console.log(`[TTSManager] Starting batch generation for ${segments.length} segments`)
    
    const results = new Map<string, TTSGenerationResult>()
    
    // 🔥 核心：并发生成所有音频，等待全部完成
    const promises = segments.map(async (segment) => {
      const result = await this.generateSpeech(segment.text, segment.speaker, preferredService)
      results.set(segment.id, result)
      return { id: segment.id, result }
    })

    // 🔥 关键：使用 Promise.all 等待所有音频生成完成
    await Promise.all(promises)
    
    const successCount = Array.from(results.values()).filter(r => r.success).length
    console.log(`[TTSManager] Batch generation completed: ${successCount}/${segments.length} successful`)
    
    return results
  }

  /**
   * 获取服务状态
   */
  getServiceStatus(): TTSServiceStatus {
    return { ...this.serviceStatus }
  }

  /**
   * 手动设置服务优先级
   */
  setServicePreference(service: TTSServiceType, enabled: boolean): void {
    this.serviceStatus[service] = enabled
    console.log(`[TTSManager] Service ${service} set to ${enabled}`)
  }

  /**
   * 重置所有服务状态
   */
  async resetServices(): Promise<void> {
    console.log('[TTSManager] Resetting all services')
    
    // 重置 IndexTTS
    indexTTSService.resetConnection()
    
    // 重新检查可用性
    await this.checkServiceAvailability()
  }

  /**
   * 获取当前最佳可用服务
   */
  getBestAvailableService(): TTSServiceType | null {
    if (this.serviceStatus.indexTTS) return 'indexTTS'
    if (this.serviceStatus.cosyVoice) return 'cosyVoice'
    return null
  }
}

// 导出单例实例
export const ttsServiceManager = new TTSServiceManager()