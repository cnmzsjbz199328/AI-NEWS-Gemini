// 音色配置类型定义
export interface VoiceConfig {
  id: string
  name: string
  character: 'moderator' | 'tom' | 'mark'
  audioFile: File | null
  audioUrl?: string
  isDefault: boolean
  uploadedAt: string
  fileSize: number
  duration?: number
}

export interface VoiceUploadProps {
  onVoiceUpload: (voiceConfig: VoiceConfig) => void
  onVoiceDelete: (voiceId: string) => void
  existingVoices: VoiceConfig[]
  maxFileSize?: number // MB
  acceptedFormats?: string[]
}

export interface VoicePreviewProps {
  voiceConfig: VoiceConfig
  onPreview: (voiceId: string, text: string, audioUrl?: string, voiceConfig?: VoiceConfig) => Promise<void>
  isPlaying: boolean
  previewText?: string
}

// IndexTTS 音色克隆配置
export interface IndexTTSVoiceConfig {
  voiceId: string
  emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised'
  speed: number
  pitch: number
}

// 音色管理状态
export interface VoiceManagerState {
  voices: VoiceConfig[]
  activeVoice: string | null
  isUploading: boolean
  uploadProgress: number
  error: string | null
}