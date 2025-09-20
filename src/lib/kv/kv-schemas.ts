import { 
  PipelineTaskStatus, 
  VoiceConfig,
  SupportedLanguage 
} from '@/types';

/**
 * Defines the raw data structures stored in Vercel KV.
 * 
 * It's highly recommended to create corresponding Zod schemas 
 * for validation during data retrieval to increase robustness.
 */

export interface StoredTask {
  id: string;
  newsTopic: string;
  status: PipelineTaskStatus;
  debateRounds: number;
  language: SupportedLanguage;
  voiceConfig: VoiceConfig;
  assignedWorker?: string | null;
  createdAt: number;
  updatedAt: number;
  error?: string;
  retryCount?: number;
  expectedAudioCount: number;  // Pre-calculated expected audio count
}

export type AudioItemType = 'moderator_intro' | 'conversation' | 'moderator_outro';

export interface StoredAudioItem {
  type: AudioItemType;
  speaker?: string;
  audioUrl: string;
  text: string;
  index?: number; // Order for conversation items
}

export interface StoredAudioCollection {
  taskId: string;
  audioItems: StoredAudioItem[];
  isComplete: boolean;
  createdAt: number;
  updatedAt: number;
}
