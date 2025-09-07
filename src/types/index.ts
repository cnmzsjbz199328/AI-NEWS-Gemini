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

export interface AppState {
  conversation: ConversationEntry[];
  currentNewsIndex: number;
  isDebating: boolean;
  newsItems: NewsItem[];
  isLoading?: boolean;
  error?: string;
  currentMessage?: ConversationEntry | null;
  currentSpeaker?: Speaker | 'none';
}
