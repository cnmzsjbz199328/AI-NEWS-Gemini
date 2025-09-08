/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Speaker = 'moderator' | 'tom' | 'mark';

export interface ConversationEntry {
  speaker: Speaker;
  text: string;
}

export interface NewsItem {
  title: string;
  description: string;
  date: string;
  thumbnailUrl: string;
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
  timestamp: number;
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
  // Legacy properties for compatibility
  status?: string;
  news: NewsItem[];
  newsError: string;
  activeNewsIndex: number;
}
