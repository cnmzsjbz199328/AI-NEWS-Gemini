import {
  PipelineTask,
  PipelineTaskStatus,
  VoiceConfig,
  DebateScript,
  AudioPlaylist,
  SlidePlaylist,
  SupportedLanguage
} from '@/types';
import { TaskStorageService } from '@/lib/services/TaskStorageService';
import { StoredTask, StoredAudioCollection, StoredAudioItem, AudioItemType } from '@/lib/kv/kv-schemas';

/**
 * Task Manager - Refactored for Vercel KV
 * 
 * This class is now a stateless service that orchestrates business logic.
 * It uses TaskStorageService for all data persistence.
 * All methods are static as it no longer holds any internal state.
 */
export class TaskManager {

  /**
   * Creates a new task, calculates expected audio, and persists it to KV.
   * If forceNew is false, will try to reuse existing completed task for same topic.
   */
  public static async createTask(
    newsTopic: string, 
    debateRounds: number = 1,
    voiceConfig: VoiceConfig,
    language: SupportedLanguage = 'zh-CN',
    forceNew: boolean = false
  ): Promise<PipelineTask> {
    
    // Check for existing task if not forcing new generation
    if (!forceNew) {
      const existingTaskId = await TaskStorageService.findExistingTask(newsTopic, debateRounds, language);
      if (existingTaskId) {
        const existingTask = await this.getTaskById(existingTaskId);
        if (existingTask) {
          return existingTask;
        }
      }
    }

    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Business Logic: Calculate the expected number of audio segments.
    const expectedAudioCount = 1 + (debateRounds * 2) + 1; // intro + (2 speakers * rounds) + outro
    
    const storedTask: StoredTask = {
      id: taskId,
      newsTopic,
      status: 'PENDING_TEXT',
      debateRounds,
      language,
      voiceConfig,
      assignedWorker: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      retryCount: 0,
      expectedAudioCount,
    };

    await TaskStorageService.createTaskRecord(storedTask);

    // Immediately index the task by topic to prevent duplicate creation
    await TaskStorageService.indexTaskByTopic(taskId, newsTopic, debateRounds, language);

    return this.mapStoredTaskToPipelineTask(storedTask);
  }

  /**
   * Retrieves a full task object, including script and playlist if available.
   */
  public static async getTaskById(taskId: string): Promise<PipelineTask | null> {
    const storedTask = await TaskStorageService.getTaskRecord(taskId);
    if (!storedTask) {
      return null;
    }

    const [script, audioCollection, slides] = await Promise.all([
      TaskStorageService.getScript(taskId),
      TaskStorageService.getAudioCollection(taskId),
      TaskStorageService.getSlides(taskId),
    ]);

    const pipelineTask = this.mapStoredTaskToPipelineTask(storedTask);
    pipelineTask.script = script ?? null;
    pipelineTask.slides = slides ?? null;

    if (audioCollection?.isComplete) {
      pipelineTask.audioPlaylist = this.buildAudioPlaylist(audioCollection);
    } else {
      pipelineTask.audioPlaylist = null;
    }

    return pipelineTask;
  }

  /**
   * Updates specific fields of a task.
   */
  public static async updateTask(taskId: string, updates: Partial<Omit<StoredTask, 'id'>>): Promise<boolean> {
    try {
      await TaskStorageService.updateTaskRecord(taskId, updates);
      return true;
    } catch (error) {
      console.error(`[TaskManager] Failed to update task ${taskId}:`, error);
      return false;
    }
  }

  /**
   * A simplified interface to update only the task's status.
   */
  public static async updateTaskStatus(taskId: string, status: PipelineTaskStatus, error?: string): Promise<boolean> {
    const updates: Partial<StoredTask> = { status };
    if (error) {
      updates.error = error;
    }
    return this.updateTask(taskId, updates);
  }

  /**
   * Saves the debate script for a task.
   */
  public static async saveTaskScript(taskId: string, script: DebateScript): Promise<boolean> {
    try {
      await TaskStorageService.saveScript(taskId, script);
      return true;
    } catch (error) {
      console.error(`[TaskManager] Failed to save script for ${taskId}:`, error);
      return false;
    }
  }

  /**
   * Adds a generated audio segment to a task and checks if the task is complete.
   */
  public static async addAudioSegment(
    taskId: string,
    type: AudioItemType,
    audioUrl: string,
    text: string,
    speaker?: string,
    index?: number
  ): Promise<{ isComplete: boolean }> {
    const audioItem: StoredAudioItem = { type, audioUrl, text, speaker, index };
    await TaskStorageService.addAudioItem(taskId, audioItem);

    // Business Logic: Check for completion after adding the audio.
    const completedCount = await TaskStorageService.incrementCompletedAudio(taskId);
    const taskRecord = await TaskStorageService.getTaskRecord(taskId);

    if (!taskRecord) {
      throw new Error(`[TaskManager] Task ${taskId} vanished after adding audio.`);
    }

    const isComplete = completedCount >= taskRecord.expectedAudioCount;

    if (isComplete) {
      await Promise.all([
        this.updateTaskStatus(taskId, 'READY_TO_PLAY'),
        TaskStorageService.markAudioCollectionComplete(taskId),
        // Index the completed task by topic for future reuse
        TaskStorageService.indexTaskByTopic(taskId, taskRecord.newsTopic, taskRecord.debateRounds, taskRecord.language)
      ]);
    }

    return { isComplete };
  }

  // --- Data Mapping Utilities ---

  /**
   * Maps the raw stored task object to the application-level PipelineTask.
   */
  private static mapStoredTaskToPipelineTask(storedTask: StoredTask): PipelineTask {
    return {
      id: storedTask.id,
      newsTopic: storedTask.newsTopic,
      status: storedTask.status,
      script: null,       // Should be populated by the caller
      audioPlaylist: null, // Should be populated by the caller
      slides: null,        // Should be populated by the caller
      voiceConfig: storedTask.voiceConfig,
      assignedWorker: storedTask.assignedWorker as any,
      debateRounds: storedTask.debateRounds,
      language: storedTask.language,
      createdAt: storedTask.createdAt,
      updatedAt: storedTask.updatedAt,
      error: storedTask.error,
      retryCount: storedTask.retryCount,
    };
  }

  /**
   * Builds the structured AudioPlaylist from the flat array in StoredAudioCollection.
   */
  private static buildAudioPlaylist(audioCollection: StoredAudioCollection): AudioPlaylist {
    const playlist: AudioPlaylist = {
      moderator_intro: '',
      conversation: [],
      moderator_outro: ''
    };

    for (const item of audioCollection.audioItems) {
      switch (item.type) {
        case 'moderator_intro':
          playlist.moderator_intro = item.audioUrl;
          break;
        case 'moderator_outro':
          playlist.moderator_outro = item.audioUrl;
          break;
        case 'conversation':
          if (item.speaker && typeof item.index === 'number') {
            playlist.conversation[item.index] = {
              speaker: item.speaker as any,
              audioUrl: item.audioUrl,
              text: item.text
            };
          }
          break;
      }
    }
    // Ensure conversation array has no empty slots from out-of-order insertion
    playlist.conversation = playlist.conversation.filter(Boolean);
    return playlist;
  }

  /**
   * Get all tasks from KV storage for status monitoring
   */
  public static async getAllTasks(): Promise<PipelineTask[]> {
    const allTaskKeys = await TaskStorageService.getAllTaskKeys();
    const tasks: PipelineTask[] = [];
    
    for (const taskId of allTaskKeys) {
      const task = await this.getTaskById(taskId);
      if (task) {
        tasks.push(task);
      }
    }
    
    // Sort by creation time (most recent first)
    return tasks.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get pipeline status summary
   */
  public static async getPipelineStatus(): Promise<{
    tasks: PipelineTask[];
    totalTasks: number;
    completedTasks: number;
    progressPercentage: number;
    isActive: boolean;
  }> {
    const tasks = await this.getAllTasks();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => 
      task.status === 'READY_TO_PLAY' || task.status === 'DONE'
    ).length;
    const activeTasks = tasks.filter(task => 
      task.status === 'GENERATING_TEXT' || task.status === 'GENERATING_AUDIO'
    ).length;
    
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const isActive = activeTasks > 0;
    
    return {
      tasks,
      totalTasks,
      completedTasks,
      progressPercentage,
      isActive
    };
  }
}
