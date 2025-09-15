/**
 * 工作者管理器 - 负责AI工作者的状态管理和分配策略
 */

import { AIWorkerType, AIWorkerState } from '@/types'

export class WorkerManager {
  private workers: Map<AIWorkerType, AIWorkerState> = new Map()

  constructor() {
    this.initializeWorkers()
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
   * 获取空闲的AI工作者
   */
  public getIdleWorker(): AIWorkerType | null {
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
   * 获取所有空闲工作者
   */
  public getIdleWorkers(): AIWorkerType[] {
    const idleWorkers: AIWorkerType[] = []
    
    this.workers.forEach((worker, type) => {
      if (worker.isIdle) {
        idleWorkers.push(type)
      }
    })
    
    return idleWorkers
  }

  /**
   * 分配工作者给任务
   */
  public assignWorker(taskId: string, workerType: AIWorkerType): boolean {
    const worker = this.workers.get(workerType)
    
    if (!worker) {
      console.error(`Worker not found: ${workerType}`)
      return false
    }

    if (!worker.isIdle) {
      console.error(`Worker ${workerType} is not idle`)
      return false
    }

    worker.isIdle = false
    worker.currentTaskId = taskId

    console.log(`Worker ${workerType} assigned to task: ${taskId}`)
    return true
  }

  /**
   * 释放工作者
   */
  public releaseWorker(workerType: AIWorkerType): boolean {
    const worker = this.workers.get(workerType)
    if (!worker) {
      console.error(`Worker not found: ${workerType}`)
      return false
    }

    worker.isIdle = true
    worker.currentTaskId = null
    worker.lastCompletedAt = Date.now()

    console.log(`Worker ${workerType} released`)
    return true
  }

  /**
   * 获取工作者状态
   */
  public getWorkerState(workerType: AIWorkerType): AIWorkerState | null {
    const worker = this.workers.get(workerType)
    return worker ? { ...worker } : null
  }

  /**
   * 获取所有工作者状态
   */
  public getAllWorkerStates(): Record<AIWorkerType, AIWorkerState> {
    const result: Record<string, AIWorkerState> = {}
    this.workers.forEach((value, key) => {
      result[key] = { ...value }
    })
    return result as Record<AIWorkerType, AIWorkerState>
  }

  /**
   * 重置工作者错误计数
   */
  public resetWorkerErrorCount(workerType: AIWorkerType): boolean {
    const worker = this.workers.get(workerType)
    if (!worker) {
      console.error(`Worker not found: ${workerType}`)
      return false
    }

    worker.errorCount = 0
    console.log(`Worker ${workerType} error count reset`)
    return true
  }

  /**
   * 增加工作者错误计数
   */
  public incrementWorkerErrorCount(workerType: AIWorkerType): boolean {
    const worker = this.workers.get(workerType)
    if (!worker) {
      console.error(`Worker not found: ${workerType}`)
      return false
    }

    worker.errorCount++
    console.log(`Worker ${workerType} error count incremented to: ${worker.errorCount}`)
    return true
  }

  /**
   * 重置所有工作者状态
   */
  public resetAllWorkers(): void {
    this.workers.forEach(worker => {
      worker.isIdle = true
      worker.currentTaskId = null
      worker.errorCount = 0
    })
    console.log('All workers reset')
  }

  /**
   * 检查是否有可用工作者
   */
  public hasIdleWorkers(): boolean {
    return this.getIdleWorkers().length > 0
  }

  /**
   * 获取工作者统计信息
   */
  public getWorkerStats() {
    const totalWorkers = this.workers.size
    const idleWorkers = this.getIdleWorkers().length
    const busyWorkers = totalWorkers - idleWorkers
    
    return {
      totalWorkers,
      idleWorkers,
      busyWorkers
    }
  }
}