/**
 * 浏览器内置 TTS 备用方案
 * 当 Google Cloud TTS 不可用时使用
 */

export interface TTSConfig {
  voice?: SpeechSynthesisVoice
  rate: number
  pitch: number
  volume: number
}

// 为每个角色配置不同的声音参数
export const SPEAKER_TTS_CONFIG: Record<string, TTSConfig> = {
  moderator: {
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8
  },
  tom: {
    rate: 1.1,
    pitch: 1.2,
    volume: 0.8
  },
  mark: {
    rate: 0.9,
    pitch: 0.8,
    volume: 0.8
  }
}

export class FallbackTTS {
  private synthesis: SpeechSynthesis
  private voices: SpeechSynthesisVoice[] = []
  private isInitialized = false

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis
      this.initializeVoices()
    } else {
      throw new Error('Speech synthesis not supported in this browser')
    }
  }

  private async initializeVoices(): Promise<void> {
    return new Promise((resolve) => {
      const loadVoices = () => {
        this.voices = this.synthesis.getVoices()
        if (this.voices.length > 0) {
          this.isInitialized = true
          console.log('[FallbackTTS] Available voices:', this.voices.map(v => `${v.name} (${v.lang})`))
          resolve()
        }
      }

      // 立即尝试加载
      loadVoices()

      // 如果没有声音，等待 voiceschanged 事件
      if (this.voices.length === 0) {
        this.synthesis.addEventListener('voiceschanged', loadVoices, { once: true })
        
        // 备用超时机制
        setTimeout(() => {
          if (!this.isInitialized) {
            console.warn('[FallbackTTS] Voice loading timeout, using default voice')
            this.isInitialized = true
            resolve()
          }
        }, 2000)
      }
    })
  }

  private selectVoiceForSpeaker(speaker: string): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) return null

    // 优先选择英语声音
    const englishVoices = this.voices.filter(voice => 
      voice.lang.startsWith('en-') && !voice.name.includes('Google')
    )

    // 为不同角色选择不同类型的声音
    switch (speaker) {
      case 'moderator':
        // 寻找权威、成熟的男性声音
        return englishVoices.find(voice => 
          voice.name.toLowerCase().includes('male') ||
          voice.name.toLowerCase().includes('david') ||
          voice.name.toLowerCase().includes('daniel')
        ) || englishVoices[0] || this.voices[0]

      case 'tom':
        // 寻找年轻、活泼的声音
        return englishVoices.find(voice => 
          voice.name.toLowerCase().includes('alex') ||
          voice.name.toLowerCase().includes('fred') ||
          voice.name.toLowerCase().includes('junior')
        ) || englishVoices[1] || this.voices[1] || this.voices[0]

      case 'mark':
        // 寻找稳重的声音
        return englishVoices.find(voice => 
          voice.name.toLowerCase().includes('bruce') ||
          voice.name.toLowerCase().includes('ralph') ||
          voice.name.toLowerCase().includes('richard')
        ) || englishVoices[2] || this.voices[2] || this.voices[0]

      default:
        return englishVoices[0] || this.voices[0]
    }
  }

  async speak(text: string, speaker: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeVoices()
    }

    return new Promise((resolve, reject) => {
      try {
        // 停止当前播放
        this.synthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(text)
        const config = SPEAKER_TTS_CONFIG[speaker] || SPEAKER_TTS_CONFIG.moderator
        const voice = this.selectVoiceForSpeaker(speaker)

        // 配置语音参数
        if (voice) {
          utterance.voice = voice
        }
        utterance.rate = config.rate
        utterance.pitch = config.pitch
        utterance.volume = config.volume

        // 事件监听
        utterance.onend = () => {
          console.log(`[FallbackTTS] Speech completed for ${speaker}`)
          resolve()
        }

        utterance.onerror = (event) => {
          console.error(`[FallbackTTS] Speech error for ${speaker}:`, event.error)
          reject(new Error(`Speech synthesis failed: ${event.error}`))
        }

        utterance.onstart = () => {
          console.log(`[FallbackTTS] Speech started for ${speaker}: "${text.substring(0, 50)}..."`)
        }

        // 开始播放
        this.synthesis.speak(utterance)

      } catch (error) {
        console.error(`[FallbackTTS] Error setting up speech for ${speaker}:`, error)
        reject(error)
      }
    })
  }

  stop(): void {
    this.synthesis.cancel()
  }

  pause(): void {
    this.synthesis.pause()
  }

  resume(): void {
    this.synthesis.resume()
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices
  }
}