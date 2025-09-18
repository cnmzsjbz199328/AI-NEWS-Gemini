/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Speaker = 'moderator' | 'tom' | 'mark';

export interface ConversationEntry {
  id: string;
  speaker: Speaker;
  text: string;
  timestamp: Date;
}

export interface NewsItem {
  title: string;
  description: string;
  date: string;
  thumbnailUrl: string;
  source?: string; // 新闻来源（ABC News 或 BBC News）
}

export interface DebateHistory {
  speaker: Speaker;
  text: string;
}

export interface AIResponse {
  text: string;
  audio?: string;
}

// 语音播放状态
export type AudioPlaybackState = 'pending' | 'ready' | 'playing' | 'completed';

// 角色生成状态
export type GenerationState = 'idle' | 'generating_text' | 'generating_audio' | 'ready_to_play';

// 角色动画状态
export type SpeakerAnimationState = 'static' | 'thinking' | 'speaking';

// 语音项目
export interface AudioItem {
  id: string;
  speaker: Speaker;
  text: string;
  audioBlob?: Blob;
  sequenceNumber: number;
  state: AudioPlaybackState;
  timestamp?: number;
  onPlaybackStart?: () => void;
}

// 角色状态
export interface SpeakerState {
  animationState: SpeakerAnimationState;
  generationState: GenerationState;
  currentAudioId?: string;
  lastTextGeneratedAt?: number;
  lastAudioGeneratedAt?: number;
}

// 所有角色的状态
export interface SpeakersState {
  moderator: SpeakerState;
  tom: SpeakerState;
  mark: SpeakerState;
}

// 音频播放信息
export interface AudioPlaybackInfo {
  currentSequence: number;
  queueLength: number;
  isPlaying: boolean;
  currentSpeaker?: Speaker;
}

// ============= 并发流水线类型定义 =============

// 流水线任务状态
export type PipelineTaskStatus = 
  | 'PENDING_TEXT'      // 待文本生成
  | 'GENERATING_TEXT'   // 文本生成中
  | 'PENDING_AUDIO'     // 待语音生成
  | 'GENERATING_AUDIO'  // 语音生成中
  | 'READY_TO_PLAY'     // 准备播放
  | 'DONE'              // 已完成
  | 'FAILED';           // 失败（超过最大重试次数）

// AI工作者类型
export type AIWorkerType = 'Gemini' | 'Mistral' | 'Reka';

// 角色音色配置
export interface VoiceConfig {
  moderator: {
    voiceId: string;
    style?: string;
    speed?: number;
    pitch?: number;
  };
  tom: {
    voiceId: string;
    style?: string;
    speed?: number;
    pitch?: number;
  };
  mark: {
    voiceId: string;
    style?: string;
    speed?: number;
    pitch?: number;
  };
}

// 辩论脚本结构
export interface DebateScript {
  moderator_intro: string;
  conversation: {
    speaker: Speaker;
    text: string;
  }[];
  moderator_outro: string;
}

// 音频播放列表
export interface AudioPlaylist {
  moderator_intro: string; // 音频文件URL或路径
  conversation: {
    speaker: Speaker;
    audioUrl: string;
    text: string; // 保留文本用于调试
  }[];
  moderator_outro: string; // 音频文件URL或路径
}

// 流水线任务定义
export interface PipelineTask {
  id: string;
  newsTopic: string;
  status: PipelineTaskStatus;
  script: DebateScript | null;
  audioPlaylist: AudioPlaylist | null;
  voiceConfig: VoiceConfig;
  assignedWorker: AIWorkerType | null;
  debateRounds: number;
  language: SupportedLanguage; // 新增语言字段
  createdAt: number;
  updatedAt: number;
  error?: string;
  retryCount?: number; // 重试次数计数
}

// 流水线状态
export interface PipelineState {
  tasks: PipelineTask[];
  currentPlayIndex: number;
  isActive: boolean;
  totalTasks: number;
  completedTasks: number;
}

// 可用音色选项
export interface AvailableVoice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female';
  description?: string;
  previewUrl?: string;
}

// AI工作者状态
export interface AIWorkerState {
  type: AIWorkerType;
  isIdle: boolean;
  currentTaskId: string | null;
  lastCompletedAt: number | null;
  errorCount: number;
}

// 支持的语言类型
export type SupportedLanguage = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'yue-CN';

// 语言配置
export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  voicePrefix: string; // CosyVoice API中的音色前缀
}

// 流水线启动参数
export interface PipelineStartParams {
  newsTopics: string[];
  debateRounds?: number;
  voiceConfig?: Partial<VoiceConfig>;
  language?: SupportedLanguage; // 新增语言参数
}

export interface AppState {
  conversation: ConversationEntry[];
  currentNewsIndex: number;
  isDebating: boolean;
  newsItems: NewsItem[];
  isLoading?: boolean;
  error?: string;
  currentMessage?: ConversationEntry | null;
  currentSpeaker?: Speaker | 'none';
  speakersState: SpeakersState;
  audioQueue: AudioItem[];
  currentPlayingAudio?: string;
  nextSequenceNumber: number;
  // 新增流水线状态
  pipelineState?: PipelineState;
  // Legacy properties for compatibility
  status?: string;
  news: NewsItem[];
  newsError: string;
  activeNewsIndex: number;
}
