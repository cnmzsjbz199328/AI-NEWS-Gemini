/**
 * 流水线状态管理Store
 * 使用Zustand进行状态管理，支持WebSocket实时更新
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// 流水线任务状态
export interface PipelineTask {
  id: string
  newsTopic: string
  status: 'PENDING_TEXT' | 'GENERATING_TEXT' | 'PENDING_AUDIO' | 'GENERATING_AUDIO' | 'READY_TO_PLAY' | 'PLAYING' | 'DONE'
  assignedWorker?: 'Gemini' | 'Mistral' | 'Reka' | null
  hasScript: boolean
  hasAudio: boolean
  error?: string
  updatedAt: number
}

// AI工作者状态
export interface WorkerState {
  type: 'Gemini' | 'Mistral' | 'Reka'
  isIdle: boolean
  currentTaskId: string | null
  lastCompletedAt: number | null
  errorCount: number
}

// 流水线整体状态
export interface PipelineState {
  // 流水线状态
  isActive: boolean
  totalTasks: number
  completedTasks: number
  currentPlayIndex: number
  
  // 任务和工作者
  tasks: PipelineTask[]
  workers: Record<string, WorkerState>
  
  // WebSocket连接状态
  wsConnected: boolean
  wsReconnecting: boolean
  lastUpdateTime: number
  
  // 用户界面状态
  selectedTaskId: string | null
  showMonitorPanel: boolean
  
  // Actions
  startPipeline: (newsTopics: string[], debateRounds?: number, voiceConfig?: any, language?: string) => Promise<boolean>
  stopPipeline: () => Promise<boolean>
  nextTask: () => Promise<boolean>
  retryTask: (taskId?: string, retryType?: 'text' | 'audio' | 'all') => Promise<boolean>
  
  // WebSocket管理
  connectWebSocket: () => void
  disconnectWebSocket: () => void
  
  // UI Actions
  setSelectedTask: (taskId: string | null) => void
  toggleMonitorPanel: () => void
  
  // 内部状态更新
  updateFromWebSocket: (data: any) => void
  updateTaskFromWebSocket: (taskData: any) => void
}

// WebSocket连接管理
class WebSocketConnection {
  private ws: WebSocket | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  
  constructor(
    private onMessage: (data: any) => void,
    private onConnectionChange: (connected: boolean, reconnecting: boolean) => void
  ) {}
  
  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return // Already connected
    }
    
    try {
      // 在生产环境中，这里应该使用正确的WebSocket URL
      // 由于Next.js API Routes不直接支持WebSocket，我们使用轮询作为备选
      this.startPolling()
    } catch (error) {
      console.error('WebSocket connection failed:', error)
      this.scheduleReconnect()
    }
  }
  
  private startPolling(): void {
    // 使用HTTP轮询作为WebSocket的备选方案
    const poll = async () => {
      try {
        const response = await fetch('/api/pipeline/status')
        if (response.ok) {
          const data = await response.json()
          this.onMessage({
            type: 'pipeline_status',
            data
          })
          this.onConnectionChange(true, false)
          this.reconnectAttempts = 0
        }
      } catch (error) {
        console.error('Polling error:', error)
        this.onConnectionChange(false, true)
        this.scheduleReconnect()
      }
    }
    
    // 立即执行一次
    poll()
    
    // 每3秒轮询一次
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer)
    }
    this.reconnectTimer = setInterval(poll, 3000)
    
    this.onConnectionChange(true, false)
  }
  
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      this.onConnectionChange(false, false)
      return
    }
    
    this.reconnectAttempts++
    this.onConnectionChange(false, true)
    
    setTimeout(() => {
      console.log(`Reconnection attempt ${this.reconnectAttempts}`)
      this.connect()
    }, this.reconnectDelay * this.reconnectAttempts)
  }
  
  disconnect(): void {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    this.onConnectionChange(false, false)
  }
  
  send(data: any): void {
    // 在轮询模式下，我们不需要发送消息
    console.log('WebSocket send (polling mode):', data)
  }
}

// 创建Zustand store
export const usePipelineStore = create<PipelineState>()(
  subscribeWithSelector((set, get) => {
    let wsConnection: WebSocketConnection | null = null
    
    return {
      // 初始状态
      isActive: false,
      totalTasks: 0,
      completedTasks: 0,
      currentPlayIndex: 0,
      tasks: [],
      workers: {},
      wsConnected: false,
      wsReconnecting: false,
      lastUpdateTime: 0,
      selectedTaskId: null,
      showMonitorPanel: false,
      
      // 启动流水线
      startPipeline: async (newsTopics, debateRounds = 1, voiceConfig, language = 'zh-CN') => {
        try {
          const response = await fetch('/api/pipeline/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              newsTopics,
              debateRounds,
              voiceConfig,
              language
            })
          })
          
          if (response.ok) {
            const result = await response.json()
            console.log('Pipeline started:', result)
            
            // 启动WebSocket连接
            get().connectWebSocket()
            
            return true
          } else {
            const error = await response.json()
            console.error('Failed to start pipeline:', error)
            return false
          }
        } catch (error) {
          console.error('Pipeline start error:', error)
          return false
        }
      },
      
      // 停止流水线
      stopPipeline: async () => {
        try {
          const response = await fetch('/api/pipeline/stop', {
            method: 'POST'
          })
          
          if (response.ok) {
            get().disconnectWebSocket()
            set({
              isActive: false,
              tasks: [],
              currentPlayIndex: 0
            })
            return true
          }
          return false
        } catch (error) {
          console.error('Pipeline stop error:', error)
          return false
        }
      },
      
      // 下一个任务
      nextTask: async () => {
        try {
          const response = await fetch('/api/pipeline/next', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          })
          
          return response.ok
        } catch (error) {
          console.error('Next task error:', error)
          return false
        }
      },
      
      // 重试任务
      retryTask: async (taskId, retryType = 'all') => {
        try {
          const response = await fetch('/api/pipeline/retry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId, retryType })
          })
          
          return response.ok
        } catch (error) {
          console.error('Retry task error:', error)
          return false
        }
      },
      
      // WebSocket连接管理
      connectWebSocket: () => {
        if (wsConnection) {
          wsConnection.disconnect()
        }
        
        wsConnection = new WebSocketConnection(
          (data) => {
            if (data.type === 'pipeline_status') {
              get().updateFromWebSocket(data.data)
            } else if (data.type === 'task_update') {
              get().updateTaskFromWebSocket(data.data)
            }
          },
          (connected, reconnecting) => {
            set({ wsConnected: connected, wsReconnecting: reconnecting })
          }
        )
        
        wsConnection.connect()
      },
      
      disconnectWebSocket: () => {
        if (wsConnection) {
          wsConnection.disconnect()
          wsConnection = null
        }
        set({ wsConnected: false, wsReconnecting: false })
      },
      
      // UI Actions
      setSelectedTask: (taskId) => {
        set({ selectedTaskId: taskId })
      },
      
      toggleMonitorPanel: () => {
        set(state => ({ showMonitorPanel: !state.showMonitorPanel }))
      },
      
      // WebSocket数据更新
      updateFromWebSocket: (data) => {
        set({
          isActive: data.isActive,
          totalTasks: data.totalTasks,
          completedTasks: data.completedTasks,
          currentPlayIndex: data.currentPlayIndex,
          tasks: data.tasks || [],
          workers: data.workers || {},
          lastUpdateTime: Date.now()
        })
      },
      
      updateTaskFromWebSocket: (taskData) => {
        set(state => ({
          tasks: state.tasks.map(task =>
            task.id === taskData.taskId
              ? { ...task, ...taskData }
              : task
          ),
          lastUpdateTime: Date.now()
        }))
      }
    }
  })
)

// 导出便捷的选择器hooks
export const usePipelineStatus = () => usePipelineStore(state => ({
  isActive: state.isActive,
  totalTasks: state.totalTasks,
  completedTasks: state.completedTasks,
  currentPlayIndex: state.currentPlayIndex
}))

export const usePipelineTasks = () => usePipelineStore(state => state.tasks)

export const usePipelineWorkers = () => usePipelineStore(state => state.workers)

export const usePipelineConnection = () => usePipelineStore(state => ({
  wsConnected: state.wsConnected,
  wsReconnecting: state.wsReconnecting,
  lastUpdateTime: state.lastUpdateTime
}))

export const usePipelineActions = () => usePipelineStore(state => ({
  startPipeline: state.startPipeline,
  stopPipeline: state.stopPipeline,
  nextTask: state.nextTask,
  retryTask: state.retryTask,
  connectWebSocket: state.connectWebSocket,
  disconnectWebSocket: state.disconnectWebSocket
}))