import { ACCEPTED_AUDIO_FORMATS, MAX_FILE_SIZE_MB } from './constants'

export interface FileValidationResult {
  isValid: boolean
  error?: string
}

/**
 * 验证音频文件
 */
export const validateAudioFile = (
  file: File,
  maxSizeMB: number = MAX_FILE_SIZE_MB,
  acceptedFormats: string[] = ACCEPTED_AUDIO_FORMATS
): FileValidationResult => {
  // 检查文件格式
  if (!acceptedFormats.includes(file.type)) {
    return {
      isValid: false,
      error: `不支持的文件格式。请上传：${acceptedFormats.map(f => f.split('/')[1]).join(', ')}`
    }
  }
  
  // 检查文件大小
  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      isValid: false,
      error: `文件大小超过限制（${maxSizeMB}MB）`
    }
  }
  
  return { isValid: true }
}

/**
 * 获取音频文件时长
 */
export const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const audio = new Audio()
    const url = URL.createObjectURL(file)
    
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration)
      URL.revokeObjectURL(url)
    })
    
    audio.addEventListener('error', () => {
      resolve(0)
      URL.revokeObjectURL(url)
    })
    
    audio.src = url
  })
}