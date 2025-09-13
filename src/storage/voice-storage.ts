import { VoiceConfig } from '../types/voice'

const STORAGE_KEY = 'ai_news_voice_configs'
const VOICE_FILES_KEY = 'ai_news_voice_files'

// 音色配置存储管理
export class VoiceStorageManager {
  // 获取所有音色配置
  static getVoiceConfigs(): VoiceConfig[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []
      
      const configs: VoiceConfig[] = JSON.parse(stored)
      
      // 恢复音频文件 URL
      return configs.map(config => ({
        ...config,
        audioFile: null, // 文件对象无法序列化，需要重新获取
        audioUrl: config.audioUrl || this.getVoiceFileUrl(config.id) || undefined
      }))
    } catch (error) {
      console.error('Failed to load voice configs:', error)
      return []
    }
  }

  // 保存音色配置
  static saveVoiceConfig(voiceConfig: VoiceConfig): boolean {
    try {
      const configs = this.getVoiceConfigs()
      
      // 检查是否已存在相同ID的配置
      const existingIndex = configs.findIndex(c => c.id === voiceConfig.id)
      
      if (existingIndex >= 0) {
        configs[existingIndex] = voiceConfig
      } else {
        configs.push(voiceConfig)
      }

      // 保存配置（不包含文件对象）
      const configsToStore = configs.map(config => ({
        ...config,
        audioFile: null // 文件对象无法序列化
      }))

      localStorage.setItem(STORAGE_KEY, JSON.stringify(configsToStore))

      // 如果有音频文件，单独存储
      if (voiceConfig.audioFile) {
        this.saveVoiceFile(voiceConfig.id, voiceConfig.audioFile)
      }

      return true
    } catch (error) {
      console.error('Failed to save voice config:', error)
      return false
    }
  }

  // 删除音色配置
  static deleteVoiceConfig(voiceId: string): boolean {
    try {
      const configs = this.getVoiceConfigs()
      const filteredConfigs = configs.filter(c => c.id !== voiceId)
      
      // 保存更新后的配置
      const configsToStore = filteredConfigs.map(config => ({
        ...config,
        audioFile: null
      }))

      localStorage.setItem(STORAGE_KEY, JSON.stringify(configsToStore))
      
      // 删除对应的音频文件
      this.deleteVoiceFile(voiceId)
      
      return true
    } catch (error) {
      console.error('Failed to delete voice config:', error)
      return false
    }
  }

  // 根据角色获取音色配置
  static getVoiceConfigByCharacter(character: 'moderator' | 'tom' | 'mark'): VoiceConfig | null {
    const configs = this.getVoiceConfigs()
    return configs.find(c => c.character === character) || null
  }

  // 保存音频文件到 IndexedDB
  static async saveVoiceFile(voiceId: string, file: File): Promise<boolean> {
    try {
      // 使用 FileReader 将文件转换为 ArrayBuffer
      const arrayBuffer = await this.fileToArrayBuffer(file)
      
      // 存储到 localStorage（小文件）或 IndexedDB（大文件）
      if (file.size < 1024 * 1024) { // 小于1MB使用localStorage
        const base64 = await this.fileToBase64(file)
        const fileData = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64,
          lastModified: file.lastModified
        }
        localStorage.setItem(`${VOICE_FILES_KEY}_${voiceId}`, JSON.stringify(fileData))
      } else {
        // 大文件使用IndexedDB（这里简化处理，实际项目中建议使用专门的IndexedDB库）
        console.warn('Large file detected, should use IndexedDB for better performance')
        const base64 = await this.fileToBase64(file)
        const fileData = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64,
          lastModified: file.lastModified
        }
        localStorage.setItem(`${VOICE_FILES_KEY}_${voiceId}`, JSON.stringify(fileData))
      }
      
      return true
    } catch (error) {
      console.error('Failed to save voice file:', error)
      return false
    }
  }

  // 获取音频文件URL
  static getVoiceFileUrl(voiceId: string): string | null {
    try {
      const fileDataStr = localStorage.getItem(`${VOICE_FILES_KEY}_${voiceId}`)
      if (!fileDataStr) return null
      
      const fileData = JSON.parse(fileDataStr)
      
      // 将base64转换为Blob URL
      const byteCharacters = atob(fileData.data.split(',')[1])
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: fileData.type })
      
      return URL.createObjectURL(blob)
    } catch (error) {
      console.error('Failed to get voice file URL:', error)
      return null
    }
  }

  // 删除音频文件
  static deleteVoiceFile(voiceId: string): boolean {
    try {
      localStorage.removeItem(`${VOICE_FILES_KEY}_${voiceId}`)
      return true
    } catch (error) {
      console.error('Failed to delete voice file:', error)
      return false
    }
  }

  // 获取音频文件对象
  static async getVoiceFile(voiceId: string): Promise<File | null> {
    try {
      const fileDataStr = localStorage.getItem(`${VOICE_FILES_KEY}_${voiceId}`)
      if (!fileDataStr) return null
      
      const fileData = JSON.parse(fileDataStr)
      
      // 将base64转换为File对象
      const response = await fetch(fileData.data)
      const blob = await response.blob()
      
      return new File([blob], fileData.name, {
        type: fileData.type,
        lastModified: fileData.lastModified
      })
    } catch (error) {
      console.error('Failed to get voice file:', error)
      return null
    }
  }

  // 清理所有音色数据
  static clearAllVoiceData(): boolean {
    try {
      // 获取所有音色配置
      const configs = this.getVoiceConfigs()
      
      // 删除所有音频文件
      configs.forEach(config => {
        this.deleteVoiceFile(config.id)
        if (config.audioUrl) {
          URL.revokeObjectURL(config.audioUrl)
        }
      })
      
      // 删除配置
      localStorage.removeItem(STORAGE_KEY)
      
      return true
    } catch (error) {
      console.error('Failed to clear voice data:', error)
      return false
    }
  }

  // 获取存储使用情况
  static getStorageUsage(): { used: number; total: number; percentage: number } {
    try {
      let used = 0
      const configs = this.getVoiceConfigs()
      
      // 计算配置数据大小
      const configSize = JSON.stringify(configs).length * 2 // UTF-16编码
      used += configSize
      
      // 计算音频文件大小
      configs.forEach(config => {
        const fileDataStr = localStorage.getItem(`${VOICE_FILES_KEY}_${config.id}`)
        if (fileDataStr) {
          used += fileDataStr.length * 2
        }
      })
      
      // localStorage 通常限制为 5-10MB
      const total = 5 * 1024 * 1024 // 假设5MB限制
      const percentage = (used / total) * 100
      
      return { used, total, percentage }
    } catch (error) {
      console.error('Failed to get storage usage:', error)
      return { used: 0, total: 0, percentage: 0 }
    }
  }

  // 辅助方法：文件转ArrayBuffer
  private static fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  // 辅助方法：文件转Base64
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
}