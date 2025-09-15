/**
 * IndexTTS 集成服务
 * 结合私有Space API客户端和音色配置管理器
 * 提供简化的语音生成接口
 */

import { Speaker } from '@/types'
import { getIndexTTSClient, IndexTTSAPIParams, IndexTTSAPIResponse } from './indexTTS-private-client'
import { getVoiceConfigManager, VoiceConfig } from './voice-config-manager'

export interface SpeechGenerationOptions {
  emotion?: 'neutral' | 'happy' | 'angry' | 'sad' | 'fear' | 'hate' | 'low' | 'surprise'
  emotionWeight?: number
  temperature?: number
  speed?: number
}

export interface SpeechGenerationResult {
  success: boolean
  audioUrl?: string
  audioBlob?: Blob
  duration?: number
  voiceConfig?: VoiceConfig
  error?: string
}

export class IndexTTSIntegratedService {
  private client = getIndexTTSClient()
  private voiceManager = getVoiceConfigManager()

  constructor() {
    console.log('[IndexTTS-Integrated] Service initialized')
  }

  /**
   * 为指定角色生成语音
   */
  async generateSpeechForRole(
    text: string,
    role: Speaker,
    options: SpeechGenerationOptions = {}
  ): Promise<SpeechGenerationResult> {
    try {
      console.log(`[IndexTTS-Integrated] 🎯 Generating speech for ${role}: "${text.substring(0, 30)}..."`)

      // 1. 获取角色对应的音色配置
      const voiceConfig = this.voiceManager.getVoiceForRole(role)
      console.log(`[IndexTTS-Integrated] 🎵 Using voice: ${voiceConfig.name} (${voiceConfig.id})`)

      // 2. 构建API参数
      const apiParams: Partial<IndexTTSAPIParams> = {
        emotionControlMethod: "Same as the voice reference",
        emotionWeight: options.emotionWeight || 0.8,
        temperature: options.temperature || 0.8,
        ...this.mapEmotionToVectors(options.emotion)
      }

      // 3. 调用私有Space API
      const result = await this.client.generateSpeech(text, voiceConfig.url, apiParams)

      // 4. 返回增强结果
      return {
        ...result,
        voiceConfig
      }

    } catch (error) {
      console.error(`[IndexTTS-Integrated] ❌ Failed to generate speech for ${role}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 批量生成语音（用于新闻辩论）
   */
  async generateBatchSpeech(
    segments: Array<{ text: string; speaker: Speaker }>,
    options: SpeechGenerationOptions = {}
  ): Promise<SpeechGenerationResult[]> {
    console.log(`[IndexTTS-Integrated] 🎪 Generating batch speech: ${segments.length} segments`)

    const results: SpeechGenerationResult[] = []
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      console.log(`[IndexTTS-Integrated] 📋 Processing segment ${i + 1}/${segments.length}`)

      try {
        const result = await this.generateSpeechForRole(segment.text, segment.speaker, options)
        results.push(result)

        // 避免请求过于频繁
        if (i < segments.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

      } catch (error) {
        console.error(`[IndexTTS-Integrated] ❌ Segment ${i + 1} failed:`, error)
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    console.log(`[IndexTTS-Integrated] ✅ Batch completed: ${successCount}/${segments.length} successful`)

    return results
  }

  /**
   * 预览音色（用于设置界面）
   */
  async previewVoice(
    voiceId: string,
    text: string = "你好，这是音色预览测试。Hello, this is a voice preview test."
  ): Promise<SpeechGenerationResult> {
    try {
      console.log(`[IndexTTS-Integrated] 🔊 Previewing voice: ${voiceId}`)

      // 从预设音色中获取配置
      const allVoices = this.voiceManager.getAllPresetVoices()
      const voiceConfig = allVoices.find(v => v.id === voiceId)

      if (!voiceConfig) {
        throw new Error(`Voice not found: ${voiceId}`)
      }

      // 使用基础API参数进行预览
      const result = await this.client.generateSpeech(text, voiceConfig.url, {
        emotionControlMethod: "Same as the voice reference",
        emotionWeight: 0.8
      })

      return {
        ...result,
        voiceConfig
      }

    } catch (error) {
      console.error(`[IndexTTS-Integrated] ❌ Voice preview failed:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 获取角色当前音色信息
   */
  getRoleVoiceInfo(role: Speaker): VoiceConfig {
    return this.voiceManager.getVoiceForRole(role)
  }

  /**
   * 更新角色音色
   */
  updateRoleVoice(role: Speaker, voiceId: string): void {
    const allVoices = this.voiceManager.getAllPresetVoices()
    const voice = allVoices.find(v => v.id === voiceId)
    
    if (!voice) {
      throw new Error(`Invalid voice ID: ${voiceId}`)
    }

    this.voiceManager.setVoiceForRole(role, voice.id as any)
    console.log(`[IndexTTS-Integrated] ✅ Updated ${role} voice to ${voiceId}`)
  }

  /**
   * 获取所有可用音色
   */
  getAvailableVoices(): VoiceConfig[] {
    return this.voiceManager.getAllPresetVoices()
  }

  /**
   * 获取当前角色音色映射
   */
  getCurrentVoiceMapping(): Record<Speaker, VoiceConfig> {
    const mapping = this.voiceManager.getCurrentMapping()
    return {
      moderator: this.voiceManager.getVoiceForRole('moderator'),
      tom: this.voiceManager.getVoiceForRole('tom'),
      mark: this.voiceManager.getVoiceForRole('mark')
    }
  }

  /**
   * 测试服务可用性
   */
  async testService(): Promise<{ 
    connection: boolean, 
    voices: Record<string, boolean> 
  }> {
    console.log('[IndexTTS-Integrated] 🧪 Testing service...')

    // 测试API连接
    const connection = await this.client.testConnection()
    console.log(`[IndexTTS-Integrated] Connection test: ${connection ? '✅' : '❌'}`)

    // 测试音色文件可用性
    const voices = await this.voiceManager.validateAllVoices()
    const validVoices = Object.values(voices).filter(Boolean).length
    console.log(`[IndexTTS-Integrated] Voice validation: ${validVoices}/${Object.keys(voices).length} valid`)

    return { connection, voices }
  }

  /**
   * 将情感选项映射为情感向量
   */
  private mapEmotionToVectors(emotion?: string): Partial<IndexTTSAPIParams> {
    if (!emotion || emotion === 'neutral') {
      return {
        emotionVectors: [0, 0, 0, 0, 0, 0, 0, 1] // neutral
      }
    }

    const emotionMap: Record<string, number[]> = {
      happy: [1, 0, 0, 0, 0, 0, 0, 0],
      angry: [0, 1, 0, 0, 0, 0, 0, 0],
      sad: [0, 0, 1, 0, 0, 0, 0, 0],
      fear: [0, 0, 0, 1, 0, 0, 0, 0],
      hate: [0, 0, 0, 0, 1, 0, 0, 0],
      low: [0, 0, 0, 0, 0, 1, 0, 0],
      surprise: [0, 0, 0, 0, 0, 0, 1, 0]
    }

    return {
      emotionVectors: emotionMap[emotion] || emotionMap.neutral,
      emotionControlMethod: "Manual control",
      emotionText: `${emotion} emotion`
    }
  }

  /**
   * 重置为默认音色配置
   */
  resetToDefaultVoices(): void {
    this.voiceManager.resetToDefault()
    console.log('[IndexTTS-Integrated] ✅ Reset to default voices')
  }

  /**
   * 关闭服务
   */
  async close(): Promise<void> {
    await this.client.close()
    console.log('[IndexTTS-Integrated] ✅ Service closed')
  }
}

// 单例实例
let integratedServiceInstance: IndexTTSIntegratedService | null = null

export function getIndexTTSIntegratedService(): IndexTTSIntegratedService {
  if (!integratedServiceInstance) {
    integratedServiceInstance = new IndexTTSIntegratedService()
  }
  return integratedServiceInstance
}

// 便捷函数导出
export async function generateSpeechForRole(
  text: string,
  role: Speaker,
  options?: SpeechGenerationOptions
): Promise<SpeechGenerationResult> {
  return getIndexTTSIntegratedService().generateSpeechForRole(text, role, options)
}

export function getCurrentVoiceMapping(): Record<Speaker, VoiceConfig> {
  return getIndexTTSIntegratedService().getCurrentVoiceMapping()
}
