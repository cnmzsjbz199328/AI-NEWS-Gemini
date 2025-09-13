import { useState, useCallback } from 'react'
import { VoiceConfig } from '../types/voice'

export function useVoicePreview() {
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

    // 处理音色预览
  const handleVoicePreview = useCallback(async (voiceId: string, text: string, audioUrl?: string, voiceConfig?: VoiceConfig): Promise<void> => {
    try {
      setPreviewingVoice(voiceId)
      setError(null)
      
      console.log('HandleVoicePreview called with:', { 
        voiceId, 
        text, 
        audioUrl,
        voiceConfig: {
          id: voiceConfig?.id,
          hasAudioFile: !!voiceConfig?.audioFile,
          audioUrl: voiceConfig?.audioUrl,
          audioFileType: voiceConfig?.audioFile?.type,
          audioFileName: voiceConfig?.audioFile?.name,
          audioFileSize: voiceConfig?.audioFile?.size
        }
      })
      
      let voiceData: string
      
      if (voiceConfig?.audioFile) {
        // 如果有audioFile，直接使用它
        console.log('Using audioFile from voiceConfig')
        console.log('AudioFile details:', {
          name: voiceConfig.audioFile.name,
          size: voiceConfig.audioFile.size,
          type: voiceConfig.audioFile.type,
          lastModified: voiceConfig.audioFile.lastModified
        })
        
        try {
          const arrayBuffer = await voiceConfig.audioFile.arrayBuffer()
          console.log('ArrayBuffer created, size:', arrayBuffer.byteLength)
          
          const uint8Array = new Uint8Array(arrayBuffer)
          let binaryString = ''
          for (let i = 0; i < uint8Array.length; i++) {
            binaryString += String.fromCharCode(uint8Array[i])
          }
          const base64 = btoa(binaryString)
          voiceData = base64
          console.log('Successfully converted audioFile to base64, length:', base64.length)
        } catch (fileError) {
          console.error('Error reading audioFile:', fileError)
          if (fileError instanceof Error) {
            console.error('FileError details:', {
              name: fileError.name,
              message: fileError.message,
              stack: fileError.stack
            })
          }
          throw new Error('无法读取音色文件数据')
        }
      } else if (voiceConfig?.id && !voiceConfig.audioFile) {
        // 如果没有audioFile但有id，尝试从存储中恢复
        console.log('No audioFile found, trying to recover from storage for id:', voiceConfig.id)
        try {
          // 动态导入VoiceStorageManager
          const { VoiceStorageManager } = await import('../storage/voice-storage')
          const recoveredFile = await VoiceStorageManager.getVoiceFile(voiceConfig.id)
          
          if (recoveredFile) {
            console.log('Successfully recovered file from storage:', {
              name: recoveredFile.name,
              size: recoveredFile.size,
              type: recoveredFile.type
            })
            
            const arrayBuffer = await recoveredFile.arrayBuffer()
            const uint8Array = new Uint8Array(arrayBuffer)
            let binaryString = ''
            for (let i = 0; i < uint8Array.length; i++) {
              binaryString += String.fromCharCode(uint8Array[i])
            }
            const base64 = btoa(binaryString)
            voiceData = base64
            console.log('Successfully converted recovered file to base64, length:', base64.length)
          } else {
            console.error('No file found in storage for id:', voiceConfig.id)
            throw new Error('无法从存储中恢复音色文件')
          }
        } catch (storageError) {
          console.error('Error recovering file from storage:', storageError)
          throw new Error('无法读取音色文件数据')
        }
      } else if (audioUrl || voiceConfig?.audioUrl) {
        // 如果没有audioFile但有audioUrl，尝试fetch（用于本地blob URL）
        const urlToUse = audioUrl || voiceConfig?.audioUrl
        if (!urlToUse) {
          throw new Error('音色文件URL不可用')
        }
        
        console.log('Using local audioUrl (blob URL):', urlToUse)
        
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
          console.log('Successfully converted local audioUrl to base64, length:', base64.length)
        } catch (fetchError) {
          console.error('Error fetching local audioUrl:', fetchError)
          throw new Error('无法读取音色文件数据')
        }
      } else {
        console.error('No audioFile or audioUrl provided')
        console.error('voiceConfig details:', {
          hasVoiceConfig: !!voiceConfig,
          audioFile: voiceConfig?.audioFile,
          audioUrl: voiceConfig?.audioUrl,
          id: voiceConfig?.id,
          name: voiceConfig?.name,
          passedAudioUrl: audioUrl
        })
        throw new Error('音色文件不可用，请重新上传音色')
      }
      
      console.log('About to send API request with voiceData length:', voiceData.length)
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

      // 播放生成的音频
      const audio = new Audio(generatedAudioUrl)
      
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(generatedAudioUrl)
      })

      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e)
        URL.revokeObjectURL(generatedAudioUrl)
      })

      await audio.play()
      
    } catch (error) {
      console.error('Voice preview error:', error)
      setError(`预览失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setPreviewingVoice(null)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    previewingVoice,
    error,
    handleVoicePreview,
    clearError
  }
}