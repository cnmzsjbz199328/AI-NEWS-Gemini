/**
 * 文本生成服务 - 封装文本生成的完整逻辑
 * 包括调用AI、处理结果和重试机制
 */

import { PipelineTask, AIWorkerType, DebateScript } from '@/types'
import { aiWorkerPool, WorkerResult } from '../ai-worker-pool'

export interface TextGenerationResult {
  success: boolean
  script?: DebateScript
  error?: string
  shouldRetry: boolean
  duration?: number
}

export class TextGenerationService {
  private readonly maxRetries: number = 3

  /**
   * 执行文本生成任务
   */
  public async execute(task: PipelineTask, workerType: AIWorkerType): Promise<TextGenerationResult> {
    console.log(`🔄 Starting text generation for ${task.id} with ${workerType} (retry: ${task.retryCount || 0})`)
    
    try {
      console.log(`📞 Calling aiWorkerPool.assignTask for ${task.id}`)
      const result: WorkerResult = await aiWorkerPool.assignTask(task, workerType)
      
      console.log(`📋 AI task result for ${task.id}:`, {
        success: result.success,
        hasScript: !!result.script,
        error: result.error,
        duration: result.duration
      })
      
      if (result.success && result.script) {
        console.log(`✅ Text generation completed for task: ${task.id}`)
        return {
          success: true,
          script: result.script,
          duration: result.duration,
          shouldRetry: false
        }
      } else {
        const currentRetryCount = task.retryCount || 0
        const shouldRetry = currentRetryCount < this.maxRetries
        
        console.log(`❌ Text generation failed for task: ${task.id}`, result.error)
        
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
      
      console.log(`💥 Exception in text generation for ${task.id}:`, errorMessage)
      
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