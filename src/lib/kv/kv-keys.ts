/**
 * Vercel KV Key Manager
 * 
 * Centralized definitions for all KV keys to ensure consistency.
 */

export const KV_KEYS = {
  // Core Task Data (Hash)
  TASK: (taskId: string) => `ainews:v2:task:${taskId}`,
  
  // Audio Collection (JSON String)
  AUDIO_COLLECTION: (taskId: string) => `ainews:v2:audio_collection:${taskId}`,

  // Script Data (JSON String)
  SCRIPT: (taskId: string) => `ainews:v2:script:${taskId}`,

  // Slide Playlist (JSON String)
  SLIDES: (taskId: string) => `ainews:v2:slides:${taskId}`,

  // News Topic Index (String -> TaskId mapping)
  NEWS_TOPIC_INDEX: (topicHash: string) => `ainews:v2:topic_index:${topicHash}`,
  
  // Latest Task for Topic (String -> TaskId)
  LATEST_TASK: (topicHash: string) => `ainews:v2:latest:${topicHash}`,

  // Metadata & Counters
  MIGRATION_VERSION: 'ainews:v2:meta:version',
} as const;

/**
 * Generate consistent hash for news topic (for indexing)
 */
export function generateTopicHash(newsTopic: string, debateRounds: number, language: string): string {
  // 简单的哈希策略：使用主题+轮数+语言的组合
  const content = `${newsTopic.trim().toLowerCase()}-${debateRounds}-${language}`;
  // 使用简单的哈希算法（生产环境建议使用更强的哈希）
  return Buffer.from(content).toString('base64').replace(/[+/=]/g, '').substring(0, 12);
}
