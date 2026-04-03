/**
 * AI工作池 - 管理并发的AI文本生成任务
 * 职责：接收完整的提示词，发送给指定的AI模型，返回结果
 * 
 * 重构说明：移除了复杂的轮流生成逻辑，改为简单的一次性调用
 */

import { AIWorkerType, PipelineTask, DebateScript, SupportedLanguage } from '@/types'
import { getAIProviderForWorker, AIProvider } from './ai-providers'
import { PromptManager } from './prompt-manager'

export interface WorkerTask {
  taskId: string
  newsTopic: string
  debateRounds: number
  workerType: AIWorkerType
  language: SupportedLanguage
  startTime: number
  retryCount: number
}

export interface WorkerResult {
  taskId: string
  success: boolean
  script?: DebateScript
  error?: string
  workerType: AIWorkerType
  duration: number
}

export class AIWorkerPool {
  private activeJobs = new Map<AIWorkerType, WorkerTask>()
  private readonly maxRetries = 3
  private readonly timeoutMs = 30000 // 30秒超时

  /**
   * 检查指定工作者是否空闲
   */
  public isWorkerIdle(workerType: AIWorkerType): boolean {
    return !this.activeJobs.has(workerType)
  }

  /**
   * 获取所有空闲的工作者
   */
  public getIdleWorkers(): AIWorkerType[] {
    const allWorkers: AIWorkerType[] = ['Gemini', 'Mistral', 'Reka']
    return allWorkers.filter(worker => this.isWorkerIdle(worker))
  }

  /**
   * 分配任务给指定的AI工作者
   * 使用一次性生成方式
   */
  public async assignTask(task: PipelineTask, workerType: AIWorkerType): Promise<WorkerResult> {
    const startTime = Date.now()
    
    // 检查工作者是否空闲
    if (!this.isWorkerIdle(workerType)) {
      return {
        taskId: task.id,
        success: false,
        error: `Worker ${workerType} is busy`,
        workerType,
        duration: Date.now() - startTime
      }
    }

    // 标记工作者为忙碌
    const workerTask: WorkerTask = {
      taskId: task.id,
      newsTopic: task.newsTopic,
      debateRounds: task.debateRounds,
      workerType,
      language: task.language,
      startTime,
      retryCount: task.retryCount || 0
    }
    
    this.activeJobs.set(workerType, workerTask)

    try {
      // 获取AI提供者
      const provider = getAIProviderForWorker(workerType)

      // 构建一次性生成的完整提示词
      const promptManager = PromptManager.getInstance()
      const fullPrompt = promptManager.buildOneShotDebatePrompt({
        newsTopic: task.newsTopic,
        debateRounds: task.debateRounds,
        language: task.language
      })

      // 调用AI进行一次性生成
      const response = await this.callAIWithTimeout(provider, fullPrompt)
      
      // 解析和验证响应
      const script = await this.parseAndValidateResponse(response, task.id)
      
      const duration = Date.now() - startTime

      return {
        taskId: task.id,
        success: true,
        script,
        workerType,
        duration
      }

    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      return {
        taskId: task.id,
        success: false,
        error: errorMessage,
        workerType,
        duration
      }
    } finally {
      // 释放工作者
      this.activeJobs.delete(workerType)
    }
  }

  /**
   * 带超时的AI调用
   */
  private async callAIWithTimeout(provider: AIProvider, prompt: string): Promise<string> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`AI call timeout after ${this.timeoutMs}ms`)), this.timeoutMs)
    })

    const aiCallPromise = provider.generateResponse('', prompt)

    return Promise.race([aiCallPromise, timeoutPromise])
  }

  /**
   * 解析和验证AI响应
   */
  private async parseAndValidateResponse(response: string, taskId: string): Promise<DebateScript> {
    try {
      // 尝试提取JSON（处理可能的额外文本）
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON object found in AI response')
      }

      const jsonText = jsonMatch[0]

      // 验证JSON格式
      const promptManager = PromptManager.getInstance()
      const validation = promptManager.validateDebateScript(jsonText)
      
      if (!validation.isValid) {
        throw new Error(`Invalid script format: ${validation.error}`)
      }

      // 解析为DebateScript对象
      const script: DebateScript = JSON.parse(jsonText)

      return script

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error'
      throw new Error(`Failed to parse AI response: ${errorMessage}`)
    }
  }

  /**
   * 取消所有活跃任务
   */
  public cancelAllTasks(): void {
    this.activeJobs.clear()
  }

  /**
   * 获取活跃任务状态
   */
  public getActiveTasksStatus(): Array<{taskId: string, workerType: AIWorkerType, duration: number}> {
    const now = Date.now()
    return Array.from(this.activeJobs.entries()).map(([workerType, task]) => ({
      taskId: task.taskId,
      workerType,
      duration: now - task.startTime
    }))
  }
}

// 导出单例实例
export const aiWorkerPool = new AIWorkerPool()