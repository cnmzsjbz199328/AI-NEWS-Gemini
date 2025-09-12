/**
 * 并发新闻处理流水线调度中心
 * 负责管理任务队列、AI工作者分配、状态更新等核心功能
 */

import { 
  PipelineTask, 
  PipelineTaskStatus, 
  AIWorkerType, 
  VoiceConfig, 
  DebateScript,
  AudioPlaylist,
  AIWorkerState,
  PipelineState
} from '@/types'
import { aiWorkerPool, WorkerResult } from './ai-worker-pool'

export class PipelineOrchestrator {
  private static instance: PipelineOrchestrator | null = null
  private tasks: PipelineTask[] = []
  private currentPlayIndex: number = 0
  private isActive: boolean = false
  private workers: Map<AIWorkerType, AIWorkerState> = new Map()

  private constructor() {
    this.initializeWorkers()
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): PipelineOrchestrator {
    if (!PipelineOrchestrator.instance) {
      PipelineOrchestrator.instance = new PipelineOrchestrator()
    }
    return PipelineOrchestrator.instance
  }

  /**
   * 初始化AI工作者状态
   */
  private initializeWorkers(): void {
    const workerTypes: AIWorkerType[] = ['Gemini', 'Mistral', 'Reka']
    
    workerTypes.forEach(type => {
      this.workers.set(type, {
        type,
        isIdle: true,
        currentTaskId: null,
        lastCompletedAt: null,
        errorCount: 0
      })
    })
  }

  /**
   * 启动流水线
   */
  public async startPipeline(
    newsTopics: string[], 
    debateRounds: number = 3,
    voiceConfig?: Partial<VoiceConfig>
  ): Promise<void> {
    if (this.isActive) {
      throw new Error('Pipeline is already active')
    }

    // 清理之前的状态
    this.tasks = []
    this.currentPlayIndex = 0
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
    newsTopics.forEach((topic, index) => {
      const task: PipelineTask = {
        id: `task-${Date.now()}-${index}`,
        newsTopic: topic,
        status: 'PENDING_TEXT',
        script: null,
        audioPlaylist: null,
        voiceConfig: finalVoiceConfig,
        assignedWorker: null,
        debateRounds,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      this.tasks.push(task)
    })

    console.log(`🚀 Pipeline started with ${this.tasks.length} tasks`)
    console.log(`📋 Tasks created:`, this.tasks.map(t => `${t.id}:${t.status}`).join(', '))
    
    // 开始处理任务
    console.log(`🔄 Starting task processing...`)
    this.processTasks()
  }

  /**
   * 停止流水线
   */
  public stopPipeline(): void {
    this.isActive = false
    
    // 取消所有活跃的AI任务
    aiWorkerPool.cancelAllTasks()
    
    this.tasks = []
    this.currentPlayIndex = 0
    
    // 重置所有工作者状态
    this.workers.forEach(worker => {
      worker.isIdle = true
      worker.currentTaskId = null
    })

    console.log('Pipeline stopped')
  }

  /**
   * 获取流水线状态
   */
  public getState(): PipelineState {
    const completedTasks = this.tasks.filter(task => task.status === 'DONE').length
    
    return {
      tasks: [...this.tasks], // 返回副本避免外部修改
      currentPlayIndex: this.currentPlayIndex,
      isActive: this.isActive,
      totalTasks: this.tasks.length,
      completedTasks
    }
  }

  /**
   * 获取下一个待播放的任务
   */
  public getNextPlayableTask(): PipelineTask | null {
    if (this.currentPlayIndex >= this.tasks.length) {
      return null
    }

    const task = this.tasks[this.currentPlayIndex]
    
    // 只有状态为 READY_TO_PLAY 的任务才能播放
    if (task.status === 'READY_TO_PLAY') {
      return task
    }

    return null
  }

  /**
   * 标记当前任务为已完成并移动到下一个
   */
  public markCurrentTaskAsCompleted(): boolean {
    if (this.currentPlayIndex >= this.tasks.length) {
      return false
    }

    const task = this.tasks[this.currentPlayIndex]
    if (task.status === 'READY_TO_PLAY') {
      this.updateTaskStatus(task.id, 'DONE')
      this.currentPlayIndex++
      return true
    }

    return false
  }

  /**
   * 更新任务状态
   */
  public updateTaskStatus(taskId: string, status: PipelineTaskStatus, error?: string): void {
    const task = this.tasks.find(t => t.id === taskId)
    if (!task) {
      console.error(`Task not found: ${taskId}`)
      return
    }

    task.status = status
    task.updatedAt = Date.now()
    
    if (error) {
      task.error = error
    }

    console.log(`Task ${taskId} status updated to: ${status}`)

    // 如果任务完成了文本生成，释放工作者
    if (status === 'PENDING_AUDIO' && task.assignedWorker) {
      this.releaseWorker(task.assignedWorker)
      task.assignedWorker = null
    }
  }

  /**
   * 设置任务脚本
   */
  public setTaskScript(taskId: string, script: DebateScript): void {
    const task = this.tasks.find(t => t.id === taskId)
    if (!task) {
      console.error(`Task not found: ${taskId}`)
      return
    }

    task.script = script
    task.updatedAt = Date.now()
    console.log(`Script set for task: ${taskId}`)
  }

  /**
   * 设置任务音频播放列表
   */
  public setTaskAudioPlaylist(taskId: string, audioPlaylist: AudioPlaylist): void {
    const task = this.tasks.find(t => t.id === taskId)
    if (!task) {
      console.error(`Task not found: ${taskId}`)
      return
    }

    task.audioPlaylist = audioPlaylist
    task.updatedAt = Date.now()
    console.log(`Audio playlist set for task: ${taskId}`)
  }

  /**
   * 获取空闲的AI工作者
   */
  private getIdleWorker(): AIWorkerType | null {
    const workerTypes: AIWorkerType[] = ['Gemini', 'Mistral', 'Reka']
    
    for (const type of workerTypes) {
      const worker = this.workers.get(type)
      if (worker && worker.isIdle) {
        return type
      }
    }
    return null
  }

  /**
   * 分配工作者给任务
   */
  private assignWorker(taskId: string, workerType: AIWorkerType): void {
    const worker = this.workers.get(workerType)
    const task = this.tasks.find(t => t.id === taskId)
    
    if (!worker || !task) {
      console.error(`Cannot assign worker ${workerType} to task ${taskId}`)
      return
    }

    worker.isIdle = false
    worker.currentTaskId = taskId
    task.assignedWorker = workerType

    console.log(`Worker ${workerType} assigned to task: ${taskId}`)
  }

  /**
   * 释放工作者
   */
  private releaseWorker(workerType: AIWorkerType): void {
    const worker = this.workers.get(workerType)
    if (!worker) {
      console.error(`Worker not found: ${workerType}`)
      return
    }

    worker.isIdle = true
    worker.currentTaskId = null
    worker.lastCompletedAt = Date.now()

    console.log(`Worker ${workerType} released`)
  }

  /**
   * 处理任务队列 - 核心调度逻辑
   */
  private async processTasks(): Promise<void> {
    console.log(`🔄 processTasks called, isActive: ${this.isActive}`)
    
    if (!this.isActive) {
      console.log(`⏹️ Pipeline not active, stopping processTasks`)
      return
    }

    // 查找待处理的文本生成任务
    const pendingTextTasks = this.tasks.filter(task => task.status === 'PENDING_TEXT')
    
    for (const task of pendingTextTasks) {
      const idleWorkers = aiWorkerPool.getIdleWorkers()
      if (idleWorkers.length > 0) {
        const selectedWorker = idleWorkers[0] // 简单的轮询策略
        
        this.assignWorker(task.id, selectedWorker)
        this.updateTaskStatus(task.id, 'GENERATING_TEXT')
        
        console.log(`🚀 Starting text generation for task: ${task.id} with worker: ${selectedWorker}`)
        
        // 异步执行AI任务（不等待完成，让它在后台运行）
        setImmediate(() => {
          this.executeAITask(task, selectedWorker).catch(error => {
            console.error(`❌ Unhandled error in AI task execution:`, error)
          })
        })
      }
    }

    // 查找待处理的音频生成任务
    const pendingAudioTasks = this.tasks.filter(task => task.status === 'PENDING_AUDIO')
    
    for (const task of pendingAudioTasks) {
      if (task.script) {
        this.updateTaskStatus(task.id, 'GENERATING_AUDIO')
        
        console.log(`🎵 Starting audio generation for task: ${task.id}`)
        
        // 异步执行TTS任务（不等待完成，让它在后台运行）
        setImmediate(() => {
          this.executeTTSTask(task).catch(error => {
            console.error(`❌ Unhandled error in TTS task execution:`, error)
          })
        })
      }
    }

    // 继续处理 - 每秒检查一次
    if (this.isActive) {
      console.log(`⏰ Scheduling next processTasks in 1 second`)
      setTimeout(() => this.processTasks(), 1000)
    } else {
      console.log(`⏹️ Pipeline inactive, not scheduling next processTasks`)
    }
  }

  /**
   * 执行AI文本生成任务
   */
  private async executeAITask(task: PipelineTask, workerType: AIWorkerType): Promise<void> {
    console.log(`🔄 Starting AI task execution for ${task.id} with ${workerType}`)
    
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
        // 任务成功完成
        console.log(`✅ Setting script for task: ${task.id}`)
        this.setTaskScript(task.id, result.script)
        this.updateTaskStatus(task.id, 'PENDING_AUDIO')
        console.log(`✅ Text generation completed for task: ${task.id}`)
      } else {
        // 任务失败
        console.log(`❌ Task failed, updating status to PENDING_TEXT for: ${task.id}`)
        this.updateTaskStatus(task.id, 'PENDING_TEXT', result.error)
        this.incrementWorkerErrorCount(workerType)
        console.error(`❌ Text generation failed for task: ${task.id}`, result.error)
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.log(`💥 Exception in AI task execution for ${task.id}:`, errorMessage)
      this.updateTaskStatus(task.id, 'PENDING_TEXT', errorMessage)
      this.incrementWorkerErrorCount(workerType)
      console.error(`❌ AI task execution failed for task: ${task.id}`, errorMessage)
    }
  }

  /**
   * 执行TTS音频生成任务（占位符，将在后续迭代中实现）
   */
  private async executeTTSTask(task: PipelineTask): Promise<void> {
    try {
      // 模拟TTS处理时间
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 创建模拟的音频播放列表
      const mockAudioPlaylist: AudioPlaylist = {
        moderator_intro: '/api/mock-audio/intro.mp3',
        conversation: task.script!.conversation.map((item, index) => ({
          speaker: item.speaker,
          audioUrl: `/api/mock-audio/${item.speaker}-${index}.mp3`,
          text: item.text
        })),
        moderator_outro: '/api/mock-audio/outro.mp3'
      }
      
      this.setTaskAudioPlaylist(task.id, mockAudioPlaylist)
      this.updateTaskStatus(task.id, 'READY_TO_PLAY')
      console.log(`🎵 Audio generation completed for task: ${task.id}`)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.updateTaskStatus(task.id, 'PENDING_AUDIO', errorMessage)
      console.error(`❌ TTS task execution failed for task: ${task.id}`, errorMessage)
    }
  }

  /**
   * 获取工作者状态
   */
  public getWorkerStates(): Record<AIWorkerType, AIWorkerState> {
    const result: Record<string, AIWorkerState> = {}
    this.workers.forEach((value, key) => {
      result[key] = { ...value }
    })
    return result as Record<AIWorkerType, AIWorkerState>
  }

  /**
   * 重置错误计数
   */
  public resetWorkerErrorCount(workerType: AIWorkerType): void {
    const worker = this.workers.get(workerType)
    if (worker) {
      worker.errorCount = 0
    }
  }

  /**
   * 增加工作者错误计数
   */
  public incrementWorkerErrorCount(workerType: AIWorkerType): void {
    const worker = this.workers.get(workerType)
    if (worker) {
      worker.errorCount++
    }
  }
}

// 导出单例实例
export const pipelineOrchestrator = PipelineOrchestrator.getInstance()