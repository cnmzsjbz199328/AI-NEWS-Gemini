import { useState, useCallback } from 'react'
import { validateAudioFile, getAudioDuration } from '../components/ui/fileValidation'
import { VoiceConfig } from '../types/voice'

interface UseFileUploadOptions {
  onUploadSuccess: (voiceConfig: VoiceConfig) => void
  existingVoices: VoiceConfig[]
  maxFileSize?: number
  acceptedFormats?: string[]
}

export function useFileUpload({
  onUploadSuccess,
  existingVoices,
  maxFileSize,
  acceptedFormats
}: UseFileUploadOptions) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // 模拟上传进度
  const simulateUpload = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 30
        if (progress >= 100) {
          setUploadProgress(100)
          clearInterval(interval)
          setTimeout(resolve, 200)
        } else {
          setUploadProgress(progress)
        }
      }, 100)
    })
  }, [])

  // 处理文件上传
  const handleFileUpload = useCallback(async (
    file: File,
    selectedCharacter: 'moderator' | 'tom' | 'mark',
    voiceName: string
  ) => {
    setError(null)
    
    // 验证文件
    const validation = validateAudioFile(file, maxFileSize, acceptedFormats)
    if (!validation.isValid) {
      setError(validation.error!)
      return
    }

    // 检查是否已有相同角色的音色
    const existingVoice = existingVoices.find(v => v.character === selectedCharacter)
    if (existingVoice) {
      setError(`${selectedCharacter} 角色已有音色配置，请先删除现有配置`)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // 获取音频时长
      const duration = await getAudioDuration(file)
      
      // 模拟上传过程
      await simulateUpload()
      
      // 创建音色配置
      const voiceConfig: VoiceConfig = {
        id: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: voiceName || `${selectedCharacter}的音色`,
        character: selectedCharacter,
        audioFile: file,
        audioUrl: URL.createObjectURL(file),
        isDefault: false,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size,
        duration
      }

      // 调用成功回调
      onUploadSuccess(voiceConfig)
      
      // 重置进度
      setUploadProgress(0)
      
    } catch (error) {
      setError('上传失败，请重试')
      console.error('Voice upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }, [existingVoices, onUploadSuccess, maxFileSize, acceptedFormats, simulateUpload])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isUploading,
    uploadProgress,
    error,
    handleFileUpload,
    clearError
  }
}