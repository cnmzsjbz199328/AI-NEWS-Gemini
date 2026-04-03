/**
 * 音色配置管理器
 * 管理角色音色映射、预设音色库和用户选择
 */

import { Speaker } from '@/types'

// 预设音色库 - 基于开发计划中的5个音色文件
export const PRESET_VOICES = {
  tom: {
    id: 'tom',
    name: 'Tom',
    description: '男性声音，温和清晰',
    url: 'https://pub-b436254f85684e9e95bebad4567b11ff.r2.dev/voice/Tom.m4a',
    language: 'zh-en',
    gender: 'male'
  },
  guodegang: {
    id: 'guodegang',
    name: '郭德纲',
    description: '相声演员声音，幽默风趣',
    url: 'https://pub-b436254f85684e9e95bebad4567b11ff.r2.dev/voice/guodegang.mp3',
    language: 'zh',
    gender: 'male'
  },
  cillian: {
    id: 'cillian',
    name: 'Cillian Murphy',
    description: '英式男性声音，优雅深沉',
    url: 'https://pub-b436254f85684e9e95bebad4567b11ff.r2.dev/voice/CillianMurphy.mp3',
    language: 'en',
    gender: 'male'
  },
  kaluoling: {
    id: 'kaluoling',
    name: '卡洛琳',
    description: '女性声音，甜美温柔',
    url: 'https://pub-b436254f85684e9e95bebad4567b11ff.r2.dev/voice/kaluoling.mp3',
    language: 'zh-en',
    gender: 'female'
  },
  liyunlong: {
    id: 'liyunlong',
    name: '李云龙',
    description: '军人声音，豪爽有力',
    url: 'https://pub-b436254f85684e9e95bebad4567b11ff.r2.dev/voice/liyunlong.mp3',
    language: 'zh',
    gender: 'male'
  }
} as const

export type PresetVoiceId = keyof typeof PRESET_VOICES

// 音色配置接口
export interface VoiceConfig {
  id: string
  name: string
  description: string
  url: string
  language: string
  gender: 'male' | 'female'
}

// 角色音色映射配置
export interface RoleVoiceMapping {
  moderator: PresetVoiceId
  tom: PresetVoiceId
  mark: PresetVoiceId
}

// 默认角色音色映射
const DEFAULT_ROLE_VOICE_MAPPING: RoleVoiceMapping = {
  moderator: 'tom',        // 主持人使用Tom音色
  tom: 'guodegang',       // Tom角色使用郭德纲音色  
  mark: 'cillian'         // Mark角色使用Cillian音色
}

export class VoiceConfigManager {
  private roleVoiceMapping: RoleVoiceMapping
  private readonly storageKey = 'ai-news-voice-mapping'

  constructor() {
    // 从localStorage加载用户配置，如果没有则使用默认配置
    this.roleVoiceMapping = this.loadFromStorage() || DEFAULT_ROLE_VOICE_MAPPING
  }

  /**
   * 获取角色对应的音色配置
   */
  getVoiceForRole(role: Speaker): VoiceConfig {
    const voiceId = this.roleVoiceMapping[role]
    const voiceConfig = PRESET_VOICES[voiceId]
    
    if (!voiceConfig) {
      console.warn(`[VoiceConfigManager] Voice not found for role ${role}, using fallback`)
      return PRESET_VOICES.tom // 降级到默认音色
    }
    
    return voiceConfig
  }

  /**
   * 设置角色的音色
   */
  setVoiceForRole(role: Speaker, voiceId: PresetVoiceId): void {
    if (!PRESET_VOICES[voiceId]) {
      throw new Error(`Invalid voice ID: ${voiceId}`)
    }
    
    this.roleVoiceMapping[role] = voiceId
    this.saveToStorage()
  }

  /**
   * 获取所有可用音色
   */
  getAllPresetVoices(): VoiceConfig[] {
    return Object.values(PRESET_VOICES)
  }

  /**
   * 获取当前角色音色映射
   */
  getCurrentMapping(): RoleVoiceMapping {
    return { ...this.roleVoiceMapping }
  }

  /**
   * 重置为默认映射
   */
  resetToDefault(): void {
    this.roleVoiceMapping = { ...DEFAULT_ROLE_VOICE_MAPPING }
    this.saveToStorage()
  }

  /**
   * 从localStorage加载配置
   */
  private loadFromStorage(): RoleVoiceMapping | null {
    try {
      if (typeof window === 'undefined') return null
      
      const saved = localStorage.getItem(this.storageKey)
      if (!saved) return null
      
      const parsed = JSON.parse(saved) as RoleVoiceMapping
      
      // 验证配置的有效性
      const isValid = Object.entries(parsed).every(([role, voiceId]) => {
        return ['moderator', 'tom', 'mark'].includes(role) && 
               PRESET_VOICES[voiceId as PresetVoiceId]
      })
      
      if (!isValid) {
        return null
      }
      
      return parsed
    } catch (error) {
      console.error('[VoiceConfigManager] Failed to load from storage:', error)
      return null
    }
  }

  /**
   * 保存配置到localStorage
   */
  private saveToStorage(): void {
    try {
      if (typeof window === 'undefined') return
      
      localStorage.setItem(this.storageKey, JSON.stringify(this.roleVoiceMapping))
    } catch (error) {
      console.error('[VoiceConfigManager] Failed to save to storage:', error)
    }
  }

  /**
   * 验证音色URL是否可访问
   */
  async validateVoiceUrl(voiceId: PresetVoiceId): Promise<boolean> {
    try {
      const voice = PRESET_VOICES[voiceId]
      if (!voice) return false
      
      const response = await fetch(voice.url, { method: 'HEAD' })
      return response.ok
    } catch (error) {
      console.error(`[VoiceConfigManager] Failed to validate ${voiceId}:`, error)
      return false
    }
  }

  /**
   * 批量验证所有音色URL
   */
  async validateAllVoices(): Promise<Record<PresetVoiceId, boolean>> {
    const results = {} as Record<PresetVoiceId, boolean>
    
    await Promise.all(
      Object.keys(PRESET_VOICES).map(async (voiceId) => {
        results[voiceId as PresetVoiceId] = await this.validateVoiceUrl(voiceId as PresetVoiceId)
      })
    )
    
    return results
  }
}

// 单例实例
let voiceConfigManagerInstance: VoiceConfigManager | null = null

export function getVoiceConfigManager(): VoiceConfigManager {
  if (!voiceConfigManagerInstance) {
    voiceConfigManagerInstance = new VoiceConfigManager()
  }
  return voiceConfigManagerInstance
}

// 导出便捷函数
export function getVoiceForRole(role: Speaker): VoiceConfig {
  return getVoiceConfigManager().getVoiceForRole(role)
}

export function setVoiceForRole(role: Speaker, voiceId: PresetVoiceId): void {
  return getVoiceConfigManager().setVoiceForRole(role, voiceId)
}
