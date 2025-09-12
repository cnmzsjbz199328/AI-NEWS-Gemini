/**
 * CosyVoice TTS服务
 * 基于API_DOCUMENTATION.md中的CosyVoice API实现
 */

import { Speaker, SupportedLanguage, VoiceConfig } from '@/types'

// 语言配置映射
export const LANGUAGE_CONFIGS = {
  'zh-CN': {
    code: 'zh-CN' as SupportedLanguage,
    name: 'Chinese (Simplified)',
    nativeName: '中文（简体）',
    voicePrefix: '中文'
  },
  'en-US': {
    code: 'en-US' as SupportedLanguage,
    name: 'English (US)',
    nativeName: 'English (US)',
    voicePrefix: '英文'
  },
  'ja-JP': {
    code: 'ja-JP' as SupportedLanguage,
    name: 'Japanese',
    nativeName: '日本語',
    voicePrefix: '日语'
  },
  'ko-KR': {
    code: 'ko-KR' as SupportedLanguage,
    name: 'Korean',
    nativeName: '한국어',
    voicePrefix: '韩语'
  },
  'yue-CN': {
    code: 'yue-CN' as SupportedLanguage,
    name: 'Cantonese',
    nativeName: '粤语',
    voicePrefix: '粤语'
  }
} as const

// CosyVoice预设音色映射
const COSYVOICE_PRESET_VOICES = {
  'zh-CN': {
    moderator: '中文女',
    tom: '中文男',
    mark: '中文男'
  },
  'en-US': {
    moderator: '英文女',
    tom: '英文男',
    mark: '英文男'
  },
  'ja-JP': {
    moderator: '日语男', // CosyVoice只有日语男声
    tom: '日语男',
    mark: '日语男'
  },
  'ko-KR': {
    moderator: '韩语女',
    tom: '韩语女', // CosyVoice只有韩语女声
    mark: '韩语女'
  },
  'yue-CN': {
    moderator: '粤语女',
    tom: '粤语女', // CosyVoice只有粤语女声
    mark: '粤语女'
  }
} as const

export interface TTSGenerationResult {
  speaker: Speaker;
  text: string;
  audioUrl: string;
  duration?: number;
  success: boolean;
  error?: string;
}

export interface TTSBatchResult {
  results: TTSGenerationResult[];
  totalDuration: number;
  successCount: number;
  failureCount: number;
}

export class CosyVoiceTTSService {
  private readonly baseUrl = 'https://iic-cosyvoice-300m.ms.show/'
  private readonly maxRetries = 3
  private readonly retryDelay = 1000 // 1秒

  /**
   * 为单个角色生成语音
   */
  async generateSpeech(
    speaker: Speaker,
    text: string,
    language: SupportedLanguage,
    voiceConfig?: VoiceConfig
  ): Promise<TTSGenerationResult> {
    const startTime = Date.now()

    try {
      // 获取音色配置
      const voiceId = this.getVoiceForSpeaker(speaker, language, voiceConfig)
      
      console.log(`🎵 Generating speech for ${speaker} in ${language} with voice: ${voiceId}`)
      console.log(`📝 Text: ${text.substring(0, 50)}...`)

      // 调用CosyVoice API
      const audioUrl = await this.callCosyVoiceAPI(voiceId, text)
      
      const duration = Date.now() - startTime
      console.log(`✅ Speech generated for ${speaker} in ${duration}ms`)

      return {
        speaker,
        text,
        audioUrl,
        duration,
        success: true
      }

    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      console.error(`❌ Speech generation failed for ${speaker}:`, errorMessage)

      return {
        speaker,
        text,
        audioUrl: '',
        duration,
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * 批量生成语音（串行处理以避免API限制）
   */
  async generateBatchSpeech(
    items: Array<{ speaker: Speaker; text: string }>,
    language: SupportedLanguage,
    voiceConfig?: VoiceConfig
  ): Promise<TTSBatchResult> {
    const startTime = Date.now()
    
    console.log(`🎵 Starting batch speech generation for ${items.length} items in ${language}`)

    // 串行生成语音以避免API限制和超时
    const results: TTSGenerationResult[] = []
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      console.log(`🎵 Generating speech ${i + 1}/${items.length} for ${item.speaker}`)
      
      try {
        const result = await this.generateSpeech(item.speaker, item.text, language, voiceConfig)
        results.push(result)
        
        // 在请求之间添加短暂延迟以避免API限制
        if (i < items.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`❌ Failed to generate speech for ${item.speaker}:`, error)
        results.push({
          speaker: item.speaker,
          text: item.text,
          audioUrl: '',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    const totalDuration = Date.now() - startTime
    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount

    console.log(`📊 Batch generation completed: ${successCount}/${results.length} successful in ${totalDuration}ms`)

    return {
      results,
      totalDuration,
      successCount,
      failureCount
    }
  }

  /**
   * 获取角色对应的音色
   */
  private getVoiceForSpeaker(
    speaker: Speaker,
    language: SupportedLanguage,
    voiceConfig?: VoiceConfig
  ): string {
    // 如果提供了自定义音色配置，优先使用
    if (voiceConfig && voiceConfig[speaker]?.voiceId) {
      return voiceConfig[speaker].voiceId
    }

    // 使用预设音色
    const presetVoices = COSYVOICE_PRESET_VOICES[language]
    if (!presetVoices) {
      throw new Error(`Unsupported language: ${language}`)
    }

    return presetVoices[speaker]
  }

  /**
   * 调用CosyVoice API生成语音
   */
  private async callCosyVoiceAPI(voiceId: string, text: string): Promise<string> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 CosyVoice API call attempt ${attempt}/${this.maxRetries}`)

        // 动态导入gradio client
        const { client } = await import('@gradio/client')
        
        // 连接到CosyVoice API
        const app = await client(this.baseUrl)
        
        // 生成随机种子
        const seed = Math.floor(Math.random() * 10000)
        
        // 调用预设音色生成API
        const result = await app.predict('/generate_audio', [
          voiceId,           // _sound_radio
          text,              // _synthetic_input_textbox  
          seed               // _seed
        ])

        // 检查结果
        if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
          const firstResult = result.data[0] as any
          if (firstResult && firstResult.url) {
            const audioUrl = firstResult.url
            console.log(`✅ CosyVoice API success, audio URL: ${audioUrl}`)
            return audioUrl
          }
        }
        
        throw new Error('Invalid response from CosyVoice API')

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        console.error(`❌ CosyVoice API attempt ${attempt} failed:`, lastError.message)

        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.maxRetries) {
          console.log(`⏳ Waiting ${this.retryDelay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, this.retryDelay))
        }
      }
    }

    throw new Error(`CosyVoice API failed after ${this.maxRetries} attempts: ${lastError?.message}`)
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages() {
    return Object.values(LANGUAGE_CONFIGS)
  }

  /**
   * 获取指定语言的可用音色
   */
  getAvailableVoicesForLanguage(language: SupportedLanguage) {
    const presetVoices = COSYVOICE_PRESET_VOICES[language]
    if (!presetVoices) {
      return []
    }

    return Object.entries(presetVoices).map(([speaker, voiceId]) => ({
      speaker: speaker as Speaker,
      voiceId,
      language,
      name: `${voiceId} (${speaker})`
    }))
  }

  /**
   * 验证语言是否支持
   */
  isLanguageSupported(language: string): language is SupportedLanguage {
    return language in LANGUAGE_CONFIGS
  }
}

// 导出单例实例
export const cosyVoiceTTSService = new CosyVoiceTTSService()