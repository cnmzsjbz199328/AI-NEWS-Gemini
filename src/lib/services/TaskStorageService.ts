import { getStorageClient } from '@/lib/kv/redis-client';
import { KV_KEYS, generateTopicHash } from '@/lib/kv/kv-keys';
import { StoredTask, StoredAudioCollection, StoredAudioItem } from '@/lib/kv/kv-schemas';
import { DebateScript } from '@/types';

const TASK_EXPIRATION_SECONDS = 86400 * 7; // 7 days

const redis = getStorageClient();

/**
 * Task Storage Service
 * 
 * Provides low-level, atomic operations for interacting with Vercel KV (powered by Upstash).
 * This service is the single source of truth for data persistence.
 * It contains NO business logic, only data access logic.
 */
export class TaskStorageService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 500; // ms

  private static async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
        }
      }
    }
    throw new Error(`[TaskStorageService] Operation failed after ${this.MAX_RETRIES} attempts: ${lastError?.message}`);
  }

  // --- Task Record Operations ---

  static async createTaskRecord(taskData: StoredTask): Promise<void> {
    return this.withRetry(async () => {
      const pipeline = redis.pipeline();
      pipeline.hset(KV_KEYS.TASK(taskData.id), taskData as unknown as Record<string, unknown>);
      pipeline.expire(KV_KEYS.TASK(taskData.id), TASK_EXPIRATION_SECONDS);
      
      // Also initialize the audio collection
      const audioCollection: StoredAudioCollection = {
        taskId: taskData.id,
        audioItems: [],
        isComplete: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      pipeline.set(KV_KEYS.AUDIO_COLLECTION(taskData.id), audioCollection, { ex: TASK_EXPIRATION_SECONDS });

      await pipeline.exec();
    });
  }

  static async getTaskRecord(taskId: string): Promise<StoredTask | null> {
    return this.withRetry(() => redis.hgetall(KV_KEYS.TASK(taskId)) as Promise<StoredTask | null>);
  }

  static async updateTaskRecord(taskId: string, updates: Partial<StoredTask>): Promise<void> {
    return this.withRetry(async () => {
      const key = KV_KEYS.TASK(taskId);
      if (!(await redis.exists(key))) {
        throw new Error(`Task with ID ${taskId} not found for update.`);
      }
      await redis.hset(key, { ...updates, updatedAt: Date.now() });
    });
  }

  static async incrementCompletedAudio(taskId: string): Promise<number> {
    return this.withRetry(() => redis.hincrby(KV_KEYS.TASK(taskId), 'completedAudioItems', 1));
  }

  // --- Script Operations ---

  static async saveScript(taskId: string, script: DebateScript): Promise<void> {
    await this.withRetry(() => redis.set(KV_KEYS.SCRIPT(taskId), script, { ex: TASK_EXPIRATION_SECONDS }));
  }

  static async getScript(taskId: string): Promise<DebateScript | null> {
    return this.withRetry(() => redis.get<DebateScript>(KV_KEYS.SCRIPT(taskId)));
  }

  // --- Audio Collection Operations ---

  static async addAudioItem(taskId: string, audioItem: StoredAudioItem): Promise<void> {
    return this.withRetry(async () => {
      // Note: This is not a true atomic 'push'. For high-concurrency, a list-based approach might be better.
      // For this project's scale, a get-and-set is acceptable and wrapped in a retry.
      const collection = await this.getAudioCollection(taskId);
      if (!collection) {
        throw new Error(`Audio collection for task ID ${taskId} not found.`);
      }
      collection.audioItems.push(audioItem);
      collection.updatedAt = Date.now();
      await redis.set(KV_KEYS.AUDIO_COLLECTION(taskId), collection, { ex: TASK_EXPIRATION_SECONDS });
    });
  }

  static async getAudioCollection(taskId: string): Promise<StoredAudioCollection | null> {
    return this.withRetry(() => redis.get<StoredAudioCollection>(KV_KEYS.AUDIO_COLLECTION(taskId)));
  }

  static async markAudioCollectionComplete(taskId: string): Promise<void> {
    return this.withRetry(async () => {
      const collection = await this.getAudioCollection(taskId);
      if (!collection) {
        throw new Error(`Audio collection for task ID ${taskId} not found.`);
      }
      collection.isComplete = true;
      collection.updatedAt = Date.now();
      await redis.set(KV_KEYS.AUDIO_COLLECTION(taskId), collection, { ex: TASK_EXPIRATION_SECONDS });
    });
  }

  // --- News Topic Reuse Operations ---

  /**
   * Check if a task exists for the same news topic (including in-progress tasks)
   */
  static async findExistingTask(newsTopic: string, debateRounds: number, language: string): Promise<string | null> {
    return this.withRetry(async () => {
      const topicHash = generateTopicHash(newsTopic, debateRounds, language);
      const latestTaskId = await redis.get<string>(KV_KEYS.LATEST_TASK(topicHash));
      
      if (latestTaskId) {
        // Verify the task still exists and is either complete or in progress (not failed)
        const task = await this.getTaskRecord(latestTaskId);
        if (task && ['PENDING_TEXT', 'GENERATING_TEXT', 'GENERATING_AUDIO', 'READY_TO_PLAY', 'DONE'].includes(task.status)) {
          return latestTaskId;
        }
      }
      
      return null;
    });
  }

  /**
   * Index a completed task by its topic hash
   */
  static async indexTaskByTopic(taskId: string, newsTopic: string, debateRounds: number, language: string): Promise<void> {
    return this.withRetry(async () => {
      const topicHash = generateTopicHash(newsTopic, debateRounds, language);
      await redis.set(KV_KEYS.LATEST_TASK(topicHash), taskId, { ex: TASK_EXPIRATION_SECONDS });
    });
  }

  // --- Status and Monitoring Operations ---

  /**
   * Get all task IDs from KV storage
   */
  static async getAllTaskKeys(): Promise<string[]> {
    return this.withRetry(async () => {
      // Use Redis SCAN to find all task keys with the correct pattern
      const pattern = 'ainews:v2:task:*';
      const keys = await redis.keys(pattern);

      // Extract task IDs from the keys (remove the prefix)
      return keys.map(key => key.replace('ainews:v2:task:', '')).filter(Boolean);
    });
  }
}
