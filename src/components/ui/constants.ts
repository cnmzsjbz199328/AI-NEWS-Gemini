// UI相关常量
export const ACCEPTED_AUDIO_FORMATS = ['audio/wav', 'audio/mp3', 'audio/ogg', 'audio/m4a', 'audio/aac']
export const MAX_FILE_SIZE_MB = 10
export const PREVIEW_TEXT = "你好，这是音色预览测试。Hello, this is a voice preview test."

// 动画时长
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500
} as const

// 设置面板相关
export const SETTINGS_PANEL = {
  WIDTH: 320,
  AUTO_COLLAPSE_DELAY: 5000,
  USER_INTERACTION_RESET_DELAY: 2000
} as const

// 角色映射
export const CHARACTER_LABELS = {
  moderator: '主持人',
  tom: 'Tom (正方)',
  mark: 'Mark (反方)'
} as const

// 主题选项
export const THEME_OPTIONS = {
  auto: '跟随系统',
  light: '浅色',
  dark: '深色'
} as const

// 语言选项
export const LANGUAGE_OPTIONS = {
  auto: '自动检测',
  zh: '中文',
  en: 'English'
} as const

// 辩论速度选项
export const DEBATE_SPEED_OPTIONS = {
  slow: '慢速',
  normal: '正常',
  fast: '快速'
} as const

// TTS服务选项
export const TTS_SERVICE_OPTIONS = {
  googleTTS: 'Google Cloud TTS',
} as const

// Google Cloud TTS Neural2 可用语音列表
export const GOOGLE_TTS_VOICES = [
  { value: 'en-US-Neural2-A', label: 'Neural2-A (男性，成熟)', gender: 'MALE' as const },
  { value: 'en-US-Neural2-C', label: 'Neural2-C (女性，专业)', gender: 'FEMALE' as const },
  { value: 'en-US-Neural2-D', label: 'Neural2-D (男性，权威)', gender: 'MALE' as const },
  { value: 'en-US-Neural2-E', label: 'Neural2-E (女性，清晰)', gender: 'FEMALE' as const },
  { value: 'en-US-Neural2-F', label: 'Neural2-F (女性，温和)', gender: 'FEMALE' as const },
  { value: 'en-US-Neural2-G', label: 'Neural2-G (女性，活泼)', gender: 'FEMALE' as const },
  { value: 'en-US-Neural2-H', label: 'Neural2-H (女性，自然)', gender: 'FEMALE' as const },
  { value: 'en-US-Neural2-I', label: 'Neural2-I (男性，低沉)', gender: 'MALE' as const },
  { value: 'en-US-Neural2-J', label: 'Neural2-J (男性，年轻)', gender: 'MALE' as const },
]

// 默认每角色 TTS 语音配置（对应 tts-service.ts 中的硬编码值）
export const DEFAULT_TTS_VOICE_CONFIG = {
  moderator: { voiceId: 'en-US-Neural2-D', ssmlGender: 'MALE' as const, speed: 1.0, pitch: 0.0 },
  tom:       { voiceId: 'en-US-Neural2-J', ssmlGender: 'MALE' as const, speed: 1.1, pitch: 2.0 },
  mark:      { voiceId: 'en-US-Neural2-A', ssmlGender: 'MALE' as const, speed: 0.9, pitch: -1.0 },
}