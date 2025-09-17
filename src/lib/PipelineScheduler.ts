/**
 * 流水线调度器 - 新的协调者，驱动整个流程
 * 将具体实现委托给其他模块，遵循单一职责原则
 */

import { 
  PipelineTask, 
  PipelineTaskStatus, 
  AIWorkerType, 
  VoiceConfig, 
  PipelineState,
  SupportedLanguage
} from '@/types'
import { aiWorkerPool } from './ai-worker-pool'
import { TaskManager } from './managers/TaskManager'
import { WorkerManager } from './managers/WorkerManager'
import { TextGenerationService } from './services/TextGenerationService'
import { AudioGenerationService } from './services/AudioGenerationService'
import { NotificationService, createWebSocketListener } from './services/NotificationService'


// 在开发模式下，为了防止热更新重置单例状态，我们将实例挂载到全局对象上
declare const global: typeof globalThis & {
  pipelineSchedulerInstance?: PipelineScheduler
}

export class PipelineScheduler {
  private static instance: PipelineScheduler | null = null
  private isActive: boolean = false

  // ... (rest of the class is the same)

  private constructor() {
    this.taskManager = new TaskManager()
    this.workerManager = new WorkerManager()
    this.textGenerationService = new TextGenerationService()
    this.audioGenerationService = new AudioGenerationService()
    this.notificationService = new NotificationService()

    // 设置WebSocket通知监听器
    this.setupNotificationListeners()
  }

  /**
   * 获取单例实例（兼容开发模式的热更新）
   */
  public static getInstance(): PipelineScheduler {
    if (process.env.NODE_ENV === 'production') {
      // 生产环境下使用标准单例
      if (!PipelineScheduler.instance) {
        PipelineScheduler.instance = new PipelineScheduler()
      }
      return PipelineScheduler.instance
    } else {
      // 开发环境下使用全局对象，防止热更新丢失状态
      if (!global.pipelineSchedulerInstance) {
        console.log('Initializing global PipelineScheduler instance for development.')
        global.pipelineSchedulerInstance = new PipelineScheduler()
      }
      return global.pipelineSchedulerInstance
    }
  }

  /**
   * 设置通知监听器
   */
  private setupNotificationListeners(): void {
    const webSocketListener = createWebSocketListener()
    this.notificationService.subscribe('task:updated', webSocketListener)
    this.notificationService.subscribe('task:created', webSocketListener)
    this.notificationService.subscribe('task:completed', webSocketListener)
    this.notificationService.subscribe('task:failed', webSocketListener)
  }

  /**
   * 启动流水线
   */
  public async startPipeline(
    newsTopics: string[], 
    debateRounds: number = 1,
    voiceConfig?: Partial<VoiceConfig>,
    language: SupportedLanguage = 'zh-CN'
  ): Promise<void> {
    if (this.isActive) {
      throw new Error('Pipeline is already active')
    }

    this.isActive = true

    // 创建默认音色配置
    const defaultVoiceConfig: VoiceConfig = {
      moderator: {
        voiceId: 'cosy-zh-female-1',
        style: 'professional',
        speed: 1.0,
        pitch: 0.0
      },
      tom: {
        voiceId: 'cosy-en-male-1',
        style: 'energetic',
        speed: 1.1,
        pitch: 2.0
      },
      mark: {
        voiceId: 'cosy-en-male-2',
        style: 'calm',
        speed: 0.9,
        pitch: -1.0
      }
    }

    // 合并用户配置
    const finalVoiceConfig: VoiceConfig = {
      moderator: { ...defaultVoiceConfig.moderator, ...voiceConfig?.moderator },
      tom: { ...defaultVoiceConfig.tom, ...voiceConfig?.tom },
      mark: { ...defaultVoiceConfig.mark, ...voiceConfig?.mark }
    }

    // 创建任务
    this.taskManager.createTasks(newsTopics, debateRounds, finalVoiceConfig, language)
    
    const tasks = this.taskManager.getAllTasks()
    console.log(`🚀 Pipeline started with ${tasks.length} tasks`)
    console.log(`📋 Tasks created:`, tasks.map(t => `${t.id}:${t.status}:${t.language}`).join(', '))
    
    // 发布任务创建事件
    for (const task of tasks) {
      await this.notificationService.publishTaskCreated(task.id, { status: task.status })
    }

    // 开始处理任务
    console.log(`🔄 Starting task processing...`)
    try {
      this.processTasks()
      console.log(`✅ processTasks() called successfully`)
    } catch (error) {
      console.error(`❌ Error in processTasks():`, error)
      throw error
    }
  }

  /**
   * 停止流水线
   */
  public stopPipeline(): void {
    this.isActive = false
    
    // 取消所有活跃的AI任务
    aiWorkerPool.cancelAllTasks()
    
    // 清理状态
    this.taskManager.clearTasks()
    this.workerManager.resetAllWorkers()

    console.log('Pipeline stopped')
  }

  /**
   * 获取流水线状态
   */
  public getState(): PipelineState {
    const stats = this.taskManager.getTaskStats()
    
    return {
      tasks: this.taskManager.getAllTasks(),
      currentPlayIndex: stats.currentPlayIndex,
      isActive: this.isActive,
      totalTasks: stats.totalTasks,
      completedTasks: stats.completedTasks
    }
  }

  /**
   * 获取下一个待播放的任务
   */
  public getNextPlayableTask(): PipelineTask | null {
    return this.taskManager.getNextPlayableTask()
  }

  /**
   * 标记当前任务为已完成并移动到下一个
   */
  public markCurrentTaskAsCompleted(): boolean {
    return this.taskManager.markCurrentTaskAsCompleted()
  }

  /**
   * 标记指定任务为已完成
   */
  public markTaskAsCompleted(taskId: string): boolean {
    return this.taskManager.markTaskAsCompleted(taskId)
  }

  /**
   * 获取工作者状态
   */
  public getWorkerStates() {
    return this.workerManager.getAllWorkerStates()
  }

  /**
   * 处理任务队列 - 核心调度逻辑（简化版）
   */
  private async processTasks(): Promise<void> {
    //console.log(`🔄 processTasks called, isActive: ${this.isActive}`)
    
    if (!this.isActive) {
      //console.log(`⏹️ Pipeline not active, stopping processTasks`)
      return
    }

    const allTasks = this.taskManager.getAllTasks()
    if (allTasks.length === 0) {
      console.log(`📭 No tasks to process`)
      return
    }

    // 处理文本生成任务
    await this.processTextTasks()

    // 处理音频生成任务
    await this.processAudioTasks()

    // 继续处理 - 每秒检查一次
    if (this.isActive) {
      setTimeout(() => this.processTasks(), 1000)
    } else {
      console.log(`⏹️ Pipeline inactive, not scheduling next processTasks`)
    }
  }

  /**
   * 处理文本生成任务
   */
  private async processTextTasks(): Promise<void> {
    const pendingTextTasks = this.taskManager.getTasksByStatus('PENDING_TEXT')
    //console.log(`📝 Found ${pendingTextTasks.length} pending text tasks`)
    
    for (const task of pendingTextTasks) {
      const idleWorker = this.workerManager.getIdleWorker()
      
      if (idleWorker) {
        console.log(`🎯 Assigning task ${task.id} to worker ${idleWorker}`)
        
        // 分配工作者并更新状态
        this.workerManager.assignWorker(task.id, idleWorker)
        this.taskManager.updateTaskStatus(task.id, 'GENERATING_TEXT')
        await this.notificationService.publishTaskUpdate(task.id, { status: 'GENERATING_TEXT' })
        
        console.log(`🚀 Starting text generation for task: ${task.id} with worker: ${idleWorker}`)
        
        // 异步执行文本生成任务
        setImmediate(() => {
          this.executeTextGeneration(task, idleWorker).catch(error => {
            console.error(`❌ Unhandled error in text generation:`, error)
          })
        })
      } else {
        console.log(`⏳ No idle workers available for task ${task.id}`)
      }
    }
  }

  /**
   * 处理音频生成任务
   */
  private async processAudioTasks(): Promise<void> {
    const pendingAudioTasks = this.taskManager.getTasksByStatus('PENDING_AUDIO')
    
    for (const task of pendingAudioTasks) {
      if (task.script) {
        this.taskManager.updateTaskStatus(task.id, 'GENERATING_AUDIO')
        await this.notificationService.publishTaskUpdate(task.id, { status: 'GENERATING_AUDIO' })
        
        console.log(`🎵 Starting audio generation for task: ${task.id}`)
        
        // 异步执行音频生成任务
        setImmediate(() => {
          this.executeAudioGeneration(task).catch(error => {
            console.error(`❌ Unhandled error in audio generation:`, error)
          })
        })
      }
    }
  }

  /**
   * 执行文本生成
   */
  private async executeTextGeneration(task: PipelineTask, workerType: AIWorkerType): Promise<void> {
    try {
      const result = await this.textGenerationService.execute(task, workerType)
      
      if (result.success && result.script) {
        // 成功完成
        this.taskManager.setTaskScript(task.id, result.script)
        this.taskManager.updateTaskStatus(task.id, 'PENDING_AUDIO')
        await this.notificationService.publishTaskUpdate(task.id, { status: 'PENDING_AUDIO' })
        console.log(`✅ Text generation completed for task: ${task.id}`)
      } else {
        // 处理失败和重试
        await this.handleTextGenerationFailure(task, result.error || 'Unknown error', result.shouldRetry)
      }
      
      // 释放工作者
      this.workerManager.releaseWorker(workerType)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await this.handleTextGenerationFailure(task, errorMessage, true)
      this.workerManager.releaseWorker(workerType)
    }
  }

  /**
   * 执行音频生成
   */
  private async executeAudioGeneration(task: PipelineTask): Promise<void> {
    try {
      const result = await this.audioGenerationService.execute(task)
      
      if (result.success && result.audioPlaylist) {
        // 成功完成
        this.taskManager.setTaskAudioPlaylist(task.id, result.audioPlaylist)
        this.taskManager.updateTaskStatus(task.id, 'READY_TO_PLAY')
        await this.notificationService.publishTaskCompleted(task.id, { status: 'READY_TO_PLAY' })
        console.log(`✅ Audio generation completed for task: ${task.id}`)
      } else {
        // 处理失败 - 直接标记为失败，不重试
        this.taskManager.updateTaskStatus(task.id, 'FAILED', result.error)
        await this.notificationService.publishTaskFailed(task.id, { status: 'FAILED', error: result.error })
        console.error(`❌ Audio generation failed for task: ${task.id}`, result.error)
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.taskManager.updateTaskStatus(task.id, 'FAILED', errorMessage)
      await this.notificationService.publishTaskFailed(task.id, { status: 'FAILED', error: errorMessage })
      console.error(`❌ Audio generation failed for task: ${task.id}`, errorMessage)
    }
  }

  /**
   * 处理文本生成失败
   */
  private async handleTextGenerationFailure(task: PipelineTask, error: string, shouldRetry: boolean): Promise<void> {
    const currentRetryCount = task.retryCount || 0
    const maxRetries = this.textGenerationService.getMaxRetries()
    
    if (shouldRetry && currentRetryCount < maxRetries) {
      // 重试
      console.log(`🔄 Task ${task.id} failed, retry ${currentRetryCount + 1}/${maxRetries}`)
      this.taskManager.updateTaskRetryCount(task.id, currentRetryCount + 1)
      this.taskManager.updateTaskStatus(task.id, 'PENDING_TEXT', `Retry ${currentRetryCount + 1}/${maxRetries}: ${error}`)
      await this.notificationService.publishTaskUpdate(task.id, { 
        status: 'PENDING_TEXT', 
        error: `Retry ${currentRetryCount + 1}/${maxRetries}: ${error}` 
      })
    } else {
      // 标记为失败
      console.log(`❌ Task ${task.id} failed after ${maxRetries} attempts, marking as FAILED`)
      this.taskManager.updateTaskStatus(task.id, 'FAILED', `Failed after ${maxRetries} attempts: ${error}`)
      await this.notificationService.publishTaskFailed(task.id, { 
        status: 'FAILED', 
        error: `Failed after ${maxRetries} attempts: ${error}` 
      })
    }
  }
}

// 导出单例实例
export const pipelineScheduler = PipelineScheduler.getInstance()