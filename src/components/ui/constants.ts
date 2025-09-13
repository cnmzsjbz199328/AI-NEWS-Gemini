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
  indexTTS: 'IndexTTS-2 (推荐)',
  cosyVoice: 'CosyVoice',
  webSpeech: 'Web Speech API'
} as const