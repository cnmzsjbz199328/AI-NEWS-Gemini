/**
 * 文本生成服务 - 封装文本生成的完整逻辑
 * 包括调用AI、处理结果和重试机制
 */

import { PipelineTask, AIWorkerType, DebateScript, SupportedLanguage, VoiceConfig } from '@/types'
import { aiWorkerPool, WorkerResult } from '../ai-worker-pool';

export interface TextGenerationResult {
  success: boolean;
  script?: DebateScript;
  error?: string;
  shouldRetry: boolean;
  duration?: number;
}

export class TextGenerationService {
  private readonly maxRetries: number = 3;

  /**
   * Static entry point to generate a debate script.
   * This simplifies calls from other services like the orchestrator.
   */
  public static async generateDebateScript(topic: string, rounds: number, language: SupportedLanguage): Promise<DebateScript> {
    // For now, we'll use a default worker type or decide based on some logic.
    // This part can be expanded later.
    const workerType: AIWorkerType = 'Gemini'; 
    const service = new TextGenerationService();
    
    // We need a mock PipelineTask object to pass to the execute method.
    const mockTask: PipelineTask = {
      id: `text-gen-task-${Date.now()}`,
      newsTopic: topic,
      debateRounds: rounds,
      language: language,
      status: 'GENERATING_TEXT',
      // Fill in other required fields with default/mock values
      script: null,
      audioPlaylist: null,
      voiceConfig: { moderator: { voiceId: 'en-US-Neural2-D' }, tom: { voiceId: 'en-US-Neural2-J' }, mark: { voiceId: 'en-US-Neural2-A' } } as VoiceConfig,
      assignedWorker: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      retryCount: 0,
    };

    const result = await service.execute(mockTask, workerType);

    if (result.success && result.script) {
      return result.script;
    } else {
      throw new Error(result.error || 'Text generation failed for an unknown reason.');
    }
  }

  /**
   * 执行文本生成任务
   */
  public async execute(task: PipelineTask, workerType: AIWorkerType): Promise<TextGenerationResult> {
    try {
      const result: WorkerResult = await aiWorkerPool.assignTask(task, workerType)

      if (result.success && result.script) {
        return {
          success: true,
          script: result.script,
          duration: result.duration,
          shouldRetry: false
        }
      } else {
        const currentRetryCount = task.retryCount || 0
        const shouldRetry = currentRetryCount < this.maxRetries

        return {
          success: false,
          error: result.error,
          shouldRetry,
          duration: result.duration
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const currentRetryCount = task.retryCount || 0
      const shouldRetry = currentRetryCount < this.maxRetries

      return {
        success: false,
        error: errorMessage,
        shouldRetry
      }
    }
  }

  /**
   * 检查是否应该重试
   */
  public shouldRetry(task: PipelineTask): boolean {
    const currentRetryCount = task.retryCount || 0
    return currentRetryCount < this.maxRetries
  }

  /**
   * 获取最大重试次数
   */
  public getMaxRetries(): number {
    return this.maxRetries
  }
}