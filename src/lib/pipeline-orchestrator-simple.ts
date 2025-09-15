/**
 * 简化版流水线调度器 - 解决导入问题
 */

// 简化的类型定义
interface SimpleTask {
  id: string
  newsTopic: string
  status: 'PENDING_TEXT' | 'GENERATING_TEXT' | 'PENDING_AUDIO' | 'GENERATING_AUDIO' | 'READY_TO_PLAY' | 'PLAYING' | 'DONE'
  assignedWorker?: 'Gemini' | 'Mistral' | 'Reka' | null
  error?: string
  createdAt: number
  updatedAt: number
}

interface SimpleWorkerState {
  type: 'Gemini' | 'Mistral' | 'Reka'
  isIdle: boolean
  currentTaskId: string | null
  lastCompletedAt: number | null
  errorCount: number
}

interface SimplePipelineState {
  tasks: SimpleTask[]
  currentPlayIndex: number
  isActive: boolean
  totalTasks: number
  completedTasks: number
}

export class SimplePipelineOrchestrator {
  private static instance: SimplePipelineOrchestrator | null = null
  private tasks: SimpleTask[] = []
  private currentPlayIndex: number = 0
  private isActive: boolean = false
  private workers: Map<string, SimpleWorkerState> = new Map()

  private constructor() {
    this.initializeWorkers()
  }

  public static getInstance(): SimplePipelineOrchestrator {
    if (!SimplePipelineOrchestrator.instance) {
      SimplePipelineOrchestrator.instance = new SimplePipelineOrchestrator()
    }
    return SimplePipelineOrchestrator.instance
  }

  private initializeWorkers(): void {
    const workerTypes = ['Gemini', 'Mistral', 'Reka']
    
    workerTypes.forEach(type => {
      this.workers.set(type, {
        type: type as any,
        isIdle: true,
        currentTaskId: null,
        lastCompletedAt: null,
        errorCount: 0
      })
    })
  }

  public getState(): SimplePipelineState {
    const completedTasks = this.tasks.filter(task => task.status === 'DONE').length
    
    return {
      tasks: [...this.tasks],
      currentPlayIndex: this.currentPlayIndex,
      isActive: this.isActive,
      totalTasks: this.tasks.length,
      completedTasks
    }
  }

  public getWorkerStates(): Record<string, SimpleWorkerState> {
    const result: Record<string, SimpleWorkerState> = {}
    this.workers.forEach((value, key) => {
      result[key] = { ...value }
    })
    return result
  }

  public async startPipeline(newsTopics: string[]): Promise<void> {
    if (this.isActive) {
      throw new Error('Pipeline is already active')
    }

    this.tasks = []
    this.currentPlayIndex = 0
    this.isActive = true

    newsTopics.forEach((topic, index) => {
      const task: SimpleTask = {
        id: `task-${Date.now()}-${index}`,
        newsTopic: topic,
        status: 'PENDING_TEXT',
        assignedWorker: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      this.tasks.push(task)
    })

    console.log(`Simple pipeline started with ${this.tasks.length} tasks`)
  }

  public stopPipeline(): void {
    this.isActive = false
    this.tasks = []
    this.currentPlayIndex = 0
    
    this.workers.forEach(worker => {
      worker.isIdle = true
      worker.currentTaskId = null
    })

    console.log('Simple pipeline stopped')
  }

  public markCurrentTaskAsCompleted(): boolean {
    if (this.currentPlayIndex >= this.tasks.length) {
      return false
    }

    const task = this.tasks[this.currentPlayIndex]
    if (task.status === 'READY_TO_PLAY') {
      task.status = 'DONE'
      task.updatedAt = Date.now()
      this.currentPlayIndex++
      return true
    }

    return false
  }
}

// 导出单例实例
export const simplePipelineOrchestrator = SimplePipelineOrchestrator.getInstance()