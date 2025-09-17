/**
 * 任务管理器 - 负责任务状态的管理和操作
 * 作为任务状态的唯一真实来源
 */

import { 
  PipelineTask, 
  PipelineTaskStatus, 
  VoiceConfig, 
  DebateScript,
  AudioPlaylist,
  SupportedLanguage
} from '@/types'

export class TaskManager {
  private tasks: PipelineTask[] = []
  private currentPlayIndex: number = 0

  /**
   * 创建新任务
   */
  public createTasks(
    newsTopics: string[], 
    debateRounds: number = 1,
    voiceConfig: VoiceConfig,
    language: SupportedLanguage = 'zh-CN'
  ): void {
    this.tasks = []
    this.currentPlayIndex = 0

    newsTopics.forEach((topic, index) => {
      const task: PipelineTask = {
        id: `task-${Date.now()}-${index}`,
        newsTopic: topic,
        status: 'PENDING_TEXT',
        script: null,
        audioPlaylist: null,
        voiceConfig,
        assignedWorker: null,
        debateRounds,
        language,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        retryCount: 0
      }
      this.tasks.push(task)
    })
  }

  /**
   * 根据状态获取任务列表
   */
  public getTasksByStatus(status: PipelineTaskStatus): PipelineTask[] {
    return this.tasks.filter(task => task.status === status)
  }

  /**
   * 根据ID获取任务
   */
  public getTaskById(taskId: string): PipelineTask | undefined {
    return this.tasks.find(t => t.id === taskId)
  }

  /**
   * 获取所有任务
   */
  public getAllTasks(): PipelineTask[] {
    return [...this.tasks] // 返回副本避免外部修改
  }

  /**
   * 更新任务状态
   */
  public updateTask(taskId: string, updates: Partial<PipelineTask>): boolean {
    const task = this.tasks.find(t => t.id === taskId)
    if (!task) {
      console.error(`Task not found: ${taskId}`)
      return false
    }

    Object.assign(task, updates)
    task.updatedAt = Date.now()
    
    console.log(`Task ${taskId} updated:`, updates)
    return true
  }

  /**
   * 更新任务状态（简化接口）
   */
  public updateTaskStatus(taskId: string, status: PipelineTaskStatus, error?: string): boolean {
    const updates: Partial<PipelineTask> = { status }
    if (error) {
      updates.error = error
    }
    return this.updateTask(taskId, updates)
  }

  /**
   * 更新任务重试次数
   */
  public updateTaskRetryCount(taskId: string, retryCount: number): boolean {
    return this.updateTask(taskId, { retryCount })
  }

  /**
   * 设置任务脚本
   */
  public setTaskScript(taskId: string, script: DebateScript): boolean {
    return this.updateTask(taskId, { script })
  }

  /**
   * 设置任务音频播放列表
   */
  public setTaskAudioPlaylist(taskId: string, audioPlaylist: AudioPlaylist): boolean {
    return this.updateTask(taskId, { audioPlaylist })
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
   * 标记指定任务为已完成
   */
  public markTaskAsCompleted(taskId: string): boolean {
    const task = this.tasks.find(t => t.id === taskId)
    if (task) {
      if (task.status !== 'DONE') {
        this.updateTaskStatus(taskId, 'DONE')
      }
      return true // 只要找到任务就返回成功
    }
    return false // 仅当任务不存在时返回失败
  }

  /**
   * 获取当前播放索引
   */
  public getCurrentPlayIndex(): number {
    return this.currentPlayIndex
  }

  /**
   * 获取任务统计信息
   */
  public getTaskStats() {
    const completedTasks = this.tasks.filter(task => task.status === 'DONE').length
    return {
      totalTasks: this.tasks.length,
      completedTasks,
      currentPlayIndex: this.currentPlayIndex
    }
  }

  /**
   * 清空所有任务
   */
  public clearTasks(): void {
    this.tasks = []
    this.currentPlayIndex = 0
  }
}