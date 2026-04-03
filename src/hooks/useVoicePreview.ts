import { useState, useCallback } from 'react'
import { VoiceConfig } from '../types/voice'

// 添加音频缓存
const audioCache = new Map<string, string>() // voiceId + text -> generatedAudioUrl

export function useVoicePreview() {
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generatedAudioCache, setGeneratedAudioCache] = useState<Map<string, string>>(new Map())

    // 处理音色预览 - 只生成音频，不直接播放
  const handleVoicePreview = useCallback(async (voiceId: string, text: string, audioUrl?: string, voiceConfig?: VoiceConfig): Promise<string | null> => {
    try {
      setPreviewingVoice(voiceId)
      setError(null)
      
      // 🔧 检查缓存，避免重复生成
      const cacheKey = `${voiceId}_${text}`
      const cachedAudio = audioCache.get(cacheKey)
      if (cachedAudio) {
        setPreviewingVoice(null)
        return cachedAudio // 返回缓存的音频URL
      }

      let voiceData: string
      
      if (voiceConfig?.audioFile) {
        // 如果有audioFile，直接使用它
        try {
          const arrayBuffer = await voiceConfig.audioFile.arrayBuffer()
          const uint8Array = new Uint8Array(arrayBuffer)
          let binaryString = ''
          for (let i = 0; i < uint8Array.length; i++) {
            binaryString += String.fromCharCode(uint8Array[i])
          }
          const base64 = btoa(binaryString)
          voiceData = base64
        } catch (fileError) {
          throw new Error('无法读取音色文件数据')
        }
      } else if (voiceConfig?.id && !voiceConfig.audioFile) {
        // 如果没有audioFile但有id，尝试从存储中恢复
        try {
          // 动态导入VoiceStorageManager
          const { VoiceStorageManager } = await import('../storage/voice-storage')
          const recoveredFile = await VoiceStorageManager.getVoiceFile(voiceConfig.id)
          
          if (recoveredFile) {
            const arrayBuffer = await recoveredFile.arrayBuffer()
            const uint8Array = new Uint8Array(arrayBuffer)
            let binaryString = ''
            for (let i = 0; i < uint8Array.length; i++) {
              binaryString += String.fromCharCode(uint8Array[i])
            }
            const base64 = btoa(binaryString)
            voiceData = base64
          } else {
            throw new Error('无法从存储中恢复音色文件')
          }
        } catch (storageError) {
          throw new Error('无法读取音色文件数据')
        }
      } else if (audioUrl || voiceConfig?.audioUrl) {
        // 如果没有audioFile但有audioUrl，尝试fetch（用于本地blob URL）
        const urlToUse = audioUrl || voiceConfig?.audioUrl
        if (!urlToUse) {
          throw new Error('音色文件URL不可用')
        }
        
        try {
          const response = await fetch(urlToUse)
          if (!response.ok) {
            throw new Error('Failed to fetch voice file')
          }
          const blob = await response.blob()
          
          // 将Blob转换为base64
          const arrayBuffer = await blob.arrayBuffer()
          const uint8Array = new Uint8Array(arrayBuffer)
          let binaryString = ''
          for (let i = 0; i < uint8Array.length; i++) {
            binaryString += String.fromCharCode(uint8Array[i])
          }
          const base64 = btoa(binaryString)
          voiceData = base64
        } catch (fetchError) {
          throw new Error('无法读取音色文件数据')
        }
      } else {
        throw new Error('音色文件不可用，请重新上传音色')
      }

      // 调用预览API生成音频
      const response = await fetch('/api/voice/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceData, // 传递base64数据而不是URL
          emotion: 'neutral',
          speed: 1.0,
          pitch: 1.0
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate preview')
      }

      // 获取音频数据
      const audioBlob = await response.blob()
      const generatedAudioUrl = URL.createObjectURL(audioBlob)

      // 🔧 缓存生成的音频URL
      audioCache.set(cacheKey, generatedAudioUrl)

      // 返回生成的音频URL，让调用者决定是否播放
      setPreviewingVoice(null)
      return generatedAudioUrl
      
    } catch (error) {
      setError(`预览失败: ${error instanceof Error ? error.message : '未知错误'}`)
      setPreviewingVoice(null)
      return null
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearCache = useCallback(() => {
    // 清理所有缓存的音频URL
    audioCache.forEach((url) => {
      URL.revokeObjectURL(url)
    })
    audioCache.clear()
  }, [])

  return {
    previewingVoice,
    error,
    handleVoicePreview,
    clearError,
    clearCache
  }
}