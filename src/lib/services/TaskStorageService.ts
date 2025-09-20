import { Redis } from '@upstash/redis';
import { KV_KEYS } from '@/lib/kv/kv-keys';
import { StoredTask, StoredAudioCollection, StoredAudioItem } from '@/lib/kv/kv-schemas';
import { DebateScript } from '@/types';

const TASK_EXPIRATION_SECONDS = 86400 * 7; // 7 days

// Initialize the Redis client from environment variables
const redis = Redis.fromEnv();

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
      pipeline.hset(KV_KEYS.TASK(taskData.id), taskData);
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
    return this.withRetry(() => redis.hgetall<StoredTask>(KV_KEYS.TASK(taskId)));
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
    return this.withRetry(() => redis.set(KV_KEYS.SCRIPT(taskId), script, { ex: TASK_EXPIRATION_SECONDS }));
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
}
