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

  // Metadata & Counters
  MIGRATION_VERSION: 'ainews:v2:meta:version',
} as const;
