/**
 * AI工作池 - 管理并发的AI文本生成任务
 * 负责任务分配、错误处理、重试机制等
 */

import { AIWorkerType, PipelineTask, DebateScript, Speaker } from '@/types'
import { getAIProviderForSpeaker, AIProvider } from './ai-providers'
import { PromptManager, DebateContext } from './prompt-manager'

export interface WorkerTask {
  taskId: string
  newsTopic: string
  debateRounds: number
  workerType: AIWorkerType
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
   * 分配任务给指定工作者
   */
  public async assignTask(
    task: PipelineTask,
    workerType: AIWorkerType
  ): Promise<WorkerResult> {
    if (!this.isWorkerIdle(workerType)) {
      throw new Error(`Worker ${workerType} is not idle`)
    }

    const workerTask: WorkerTask = {
      taskId: task.id,
      newsTopic: task.newsTopic,
      debateRounds: task.debateRounds,
      workerType,
      startTime: Date.now(),
      retryCount: 0
    }

    this.activeJobs.set(workerType, workerTask)

    try {
      const result = await this.executeTask(workerTask)
      this.activeJobs.delete(workerType)
      return result
    } catch (error) {
      this.activeJobs.delete(workerType)
      throw error
    }
  }

  /**
   * 执行AI文本生成任务
   */
  private async executeTask(workerTask: WorkerTask): Promise<WorkerResult> {
    const startTime = Date.now()

    try {
      // 根据工作者类型获取对应的AI Provider
      const provider = this.getProviderForWorker(workerTask.workerType)
      
      // 生成辩论脚本
      const script = await this.generateDebateScript(
        provider,
        workerTask.newsTopic,
        workerTask.debateRounds
      )

      const duration = Date.now() - startTime

      console.log(`✅ Worker ${workerTask.workerType} completed task ${workerTask.taskId} in ${duration}ms`)

      return {
        taskId: workerTask.taskId,
        success: true,
        script,
        workerType: workerTask.workerType,
        duration
      }

    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      console.error(`❌ Worker ${workerTask.workerType} failed task ${workerTask.taskId}:`, errorMessage)

      // 检查是否需要重试
      if (workerTask.retryCount < this.maxRetries) {
        console.log(`🔄 Retrying task ${workerTask.taskId} (attempt ${workerTask.retryCount + 1}/${this.maxRetries})`)
        
        workerTask.retryCount++
        workerTask.startTime = Date.now()
        
        // 递归重试
        return await this.executeTask(workerTask)
      }

      return {
        taskId: workerTask.taskId,
        success: false,
        error: errorMessage,
        workerType: workerTask.workerType,
        duration
      }
    }
  }

  /**
   * 根据工作者类型获取AI Provider
   */
  private getProviderForWorker(workerType: AIWorkerType): AIProvider {
    // 映射工作者类型到角色
    const workerToSpeaker = {
      'Gemini': 'moderator',
      'Mistral': 'tom', 
      'Reka': 'mark'
    }

    const speaker = workerToSpeaker[workerType]
    return getAIProviderForSpeaker(speaker)
  }

  /**
   * 生成辩论脚本
   */
  private async generateDebateScript(
    provider: AIProvider,
    newsTopic: string,
    debateRounds: number
  ): Promise<DebateScript> {
    const promptManager = PromptManager.getInstance()
    const conversation: Array<{speaker: Speaker, text: string}> = []
    
    // 1. 生成主持人开场白
    const moderatorIntro = await this.generateSpeakerResponse(
      'moderator',
      `Please introduce a debate about: ${newsTopic}`,
      newsTopic,
      []
    )

    // 2. 生成辩论对话
    for (let round = 0; round < debateRounds; round++) {
      // Tom发言
      const tomPrompt = round === 0 
        ? `Present your initial perspective on: ${newsTopic}`
        : `Continue the debate and respond to previous points about: ${newsTopic}`
      
      const tomResponse = await this.generateSpeakerResponse(
        'tom',
        tomPrompt,
        newsTopic,
        conversation
      )
      
      conversation.push({ speaker: 'tom', text: tomResponse })

      // Mark回应
      const markPrompt = `Respond to Tom's points and present your perspective on: ${newsTopic}`
      
      const markResponse = await this.generateSpeakerResponse(
        'mark',
        markPrompt,
        newsTopic,
        conversation
      )
      
      conversation.push({ speaker: 'mark', text: markResponse })
    }

    // 3. 生成主持人结束语
    const moderatorOutro = await this.generateSpeakerResponse(
      'moderator',
      `Please conclude the debate about: ${newsTopic}`,
      newsTopic,
      conversation
    )

    return {
      moderator_intro: moderatorIntro,
      conversation,
      moderator_outro: moderatorOutro
    }
  }

  /**
   * 为特定角色生成回应
   */
  private async generateSpeakerResponse(
    speaker: Speaker,
    prompt: string,
    topic: string,
    conversation: Array<{speaker: Speaker, text: string}>
  ): Promise<string> {
    const promptManager = PromptManager.getInstance()
    const provider = getAIProviderForSpeaker(speaker)
    
    // 获取系统指令
    const systemInstruction = promptManager.getSystemInstruction(speaker)
    
    // 构建上下文
    const context: DebateContext = {
      topic,
      currentTurn: conversation.length,
      history: conversation
    }
    
    // 构建上下文化的提示词
    const contextualPrompt = promptManager.buildContextualPrompt(speaker, prompt, context)
    
    // 添加严格限制
    const finalPrompt = promptManager.addStrictLimitPrefix(contextualPrompt)
    
    // 生成回应
    const response = await provider.generateResponse(systemInstruction, finalPrompt)
    
    // 验证回应
    const validation = promptManager.validateResponse(response, speaker)
    
    return validation.processedResponse || response.trim()
  }



  /**
   * 获取当前活跃任务信息
   */
  public getActiveJobs(): Map<AIWorkerType, WorkerTask> {
    return new Map(this.activeJobs)
  }

  /**
   * 取消指定工作者的任务
   */
  public cancelTask(workerType: AIWorkerType): boolean {
    if (this.activeJobs.has(workerType)) {
      this.activeJobs.delete(workerType)
      console.log(`🚫 Cancelled task for worker: ${workerType}`)
      return true
    }
    return false
  }

  /**
   * 取消所有活跃任务
   */
  public cancelAllTasks(): void {
    const cancelledWorkers = Array.from(this.activeJobs.keys())
    this.activeJobs.clear()
    console.log(`🚫 Cancelled all tasks for workers: ${cancelledWorkers.join(', ')}`)
  }

  /**
   * 获取工作池统计信息
   */
  public getStats() {
    const totalWorkers = 3
    const activeWorkers = this.activeJobs.size
    const idleWorkers = totalWorkers - activeWorkers

    return {
      totalWorkers,
      activeWorkers,
      idleWorkers,
      utilizationRate: (activeWorkers / totalWorkers) * 100
    }
  }
}

// 导出单例实例
export const aiWorkerPool = new AIWorkerPool()