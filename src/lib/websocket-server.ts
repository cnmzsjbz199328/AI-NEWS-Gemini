/**
 * 简单的WebSocket服务器用于实时状态推送
 * 这是一个独立的服务器，可以在不同端口运行
 */

import { WebSocketServer } from 'ws'
import { pipelineScheduler } from './PipelineScheduler'

export class PipelineWebSocketServer {
  private wss: WebSocketServer | null = null
  private port: number
  private statusInterval: NodeJS.Timeout | null = null

  constructor(port: number = 3001) {
    this.port = port
  }

  public start(): void {
    try {
      this.wss = new WebSocketServer({ port: this.port })
      
      console.log(`WebSocket server started on port ${this.port}`)
      
      this.wss.on('connection', (ws) => {
        console.log('New WebSocket connection established')
        
        // 立即发送当前状态
        this.sendStatusToClient(ws)
        
        // 处理客户端消息
        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message.toString())
            this.handleClientMessage(ws, data)
          } catch (error) {
            console.error('Invalid WebSocket message:', error)
          }
        })
        
        // 处理连接关闭
        ws.on('close', () => {
          console.log('WebSocket connection closed')
        })
        
        // 处理错误
        ws.on('error', (error) => {
          console.error('WebSocket error:', error)
        })
      })
      
      // 启动定期状态广播
      this.startStatusBroadcast()
      
    } catch (error) {
      console.error('Failed to start WebSocket server:', error)
    }
  }

  public stop(): void {
    if (this.statusInterval) {
      clearInterval(this.statusInterval)
      this.statusInterval = null
    }
    
    if (this.wss) {
      this.wss.close()
      this.wss = null
      console.log('WebSocket server stopped')
    }
  }

  private sendStatusToClient(ws: any): void {
    if (ws.readyState === 1) { // WebSocket.OPEN
      try {
        const state = pipelineScheduler.getState()
        const workerStates = pipelineScheduler.getWorkerStates()
        
        const statusUpdate = {
          type: 'pipeline_status',
          timestamp: Date.now(),
          data: {
            isActive: state.isActive,
            totalTasks: state.totalTasks,
            completedTasks: state.completedTasks,
            currentPlayIndex: state.currentPlayIndex,
            tasks: state.tasks.map(task => ({
              id: task.id,
              newsTopic: task.newsTopic.length > 100 
                ? task.newsTopic.substring(0, 100) + '...' 
                : task.newsTopic,
              status: task.status,
              assignedWorker: task.assignedWorker,
              hasScript: !!task.script,
              hasAudio: !!task.audioPlaylist,
              error: task.error,
              updatedAt: task.updatedAt
            })),
            workers: workerStates
          }
        }
        
        ws.send(JSON.stringify(statusUpdate))
      } catch (error) {
        console.error('Error sending status to WebSocket client:', error)
      }
    }
  }

  private handleClientMessage(ws: any, data: any): void {
    switch (data.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
        break
        
      case 'request_status':
        this.sendStatusToClient(ws)
        break
        
      case 'subscribe_task':
        // 客户端可以订阅特定任务的更新
        // 这里可以实现更细粒度的订阅逻辑
        ws.send(JSON.stringify({ 
          type: 'subscription_confirmed', 
          taskId: data.taskId 
        }))
        break
        
      default:
        console.warn('Unknown WebSocket message type:', data.type)
    }
  }

  private startStatusBroadcast(): void {
    if (this.statusInterval) {
      clearInterval(this.statusInterval)
    }
    
    // 每3秒广播一次状态给所有连接的客户端
    this.statusInterval = setInterval(() => {
      if (this.wss) {
        this.wss.clients.forEach((ws) => {
          this.sendStatusToClient(ws)
        })
      }
    }, 3000)
  }

  public broadcastTaskUpdate(taskId: string): void {
    if (!this.wss) return
    
    const state = pipelineScheduler.getState()
    const task = state.tasks.find(t => t.id === taskId)
    
    if (task) {
      const update = {
        type: 'task_update',
        timestamp: Date.now(),
        data: {
          taskId: task.id,
          status: task.status,
          assignedWorker: task.assignedWorker,
          hasScript: !!task.script,
          hasAudio: !!task.audioPlaylist,
          error: task.error,
          updatedAt: task.updatedAt
        }
      }
      
      this.wss.clients.forEach((ws) => {
        if (ws.readyState === 1) { // WebSocket.OPEN
          try {
            ws.send(JSON.stringify(update))
          } catch (error) {
            console.error('Error broadcasting task update:', error)
          }
        }
      })
    }
  }
}

// 创建全局WebSocket服务器实例
let wsServer: PipelineWebSocketServer | null = null

export const startWebSocketServer = (port: number = 3001): PipelineWebSocketServer => {
  if (!wsServer) {
    wsServer = new PipelineWebSocketServer(port)
    wsServer.start()
  }
  return wsServer
}

export const stopWebSocketServer = (): void => {
  if (wsServer) {
    wsServer.stop()
    wsServer = null
  }
}

export const getWebSocketServer = (): PipelineWebSocketServer | null => {
  return wsServer
}