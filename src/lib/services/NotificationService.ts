/**
 * 通知服务 - 使用发布/订阅模式处理WebSocket等外部通知
 * 与核心逻辑解耦
 */

export type EventType = 'task:updated' | 'task:created' | 'task:completed' | 'task:failed'

export interface TaskEvent {
  type: EventType
  taskId: string
  timestamp: number
  data?: any
}

export type EventListener = (event: TaskEvent) => void | Promise<void>

export class NotificationService {
  private listeners: Map<EventType, EventListener[]> = new Map()

  /**
   * 订阅事件
   */
  public subscribe(eventType: EventType, listener: EventListener): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }
    
    this.listeners.get(eventType)!.push(listener)
    console.log(`Subscribed to event: ${eventType}`)
  }

  /**
   * 取消订阅事件
   */
  public unsubscribe(eventType: EventType, listener: EventListener): void {
    const eventListeners = this.listeners.get(eventType)
    if (!eventListeners) {
      return
    }

    const index = eventListeners.indexOf(listener)
    if (index > -1) {
      eventListeners.splice(index, 1)
      console.log(`Unsubscribed from event: ${eventType}`)
    }
  }

  /**
   * 发布事件
   */
  public async publish(event: TaskEvent): Promise<void> {
    const eventListeners = this.listeners.get(event.type)
    if (!eventListeners || eventListeners.length === 0) {
      return
    }

    console.log(`Publishing event: ${event.type} for task: ${event.taskId}`)

    // 并行执行所有监听器
    const promises = eventListeners.map(async (listener) => {
      try {
        await listener(event)
      } catch (error) {
        console.error(`Error in event listener for ${event.type}:`, error)
      }
    })

    await Promise.allSettled(promises)
  }

  /**
   * 发布任务更新事件（便捷方法）
   */
  public async publishTaskUpdate(taskId: string, data?: any): Promise<void> {
    await this.publish({
      type: 'task:updated',
      taskId,
      timestamp: Date.now(),
      data
    })
  }

  /**
   * 发布任务创建事件（便捷方法）
   */
  public async publishTaskCreated(taskId: string, data?: any): Promise<void> {
    await this.publish({
      type: 'task:created',
      taskId,
      timestamp: Date.now(),
      data
    })
  }

  /**
   * 发布任务完成事件（便捷方法）
   */
  public async publishTaskCompleted(taskId: string, data?: any): Promise<void> {
    await this.publish({
      type: 'task:completed',
      taskId,
      timestamp: Date.now(),
      data
    })
  }

  /**
   * 发布任务失败事件（便捷方法）
   */
  public async publishTaskFailed(taskId: string, data?: any): Promise<void> {
    await this.publish({
      type: 'task:failed',
      taskId,
      timestamp: Date.now(),
      data
    })
  }

  /**
   * 清除所有监听器
   */
  public clearAllListeners(): void {
    this.listeners.clear()
    console.log('All event listeners cleared')
  }

  /**
   * 获取监听器统计信息
   */
  public getListenerStats(): Record<EventType, number> {
    const stats: Record<string, number> = {}
    
    this.listeners.forEach((listeners, eventType) => {
      stats[eventType] = listeners.length
    })
    
    return stats as Record<EventType, number>
  }
}

// WebSocket广播功能 - 简化实现，避免循环依赖
const broadcastToWebSocket = async (taskId: string): Promise<void> => {
  // 这里可以实现简单的广播逻辑
  // 暂时使用console.log作为占位符
  console.log(`[WebSocket] Task ${taskId} updated`)
}

/**
 * 创建默认的WebSocket通知监听器
 */
export function createWebSocketListener(): EventListener {
  return async (event: TaskEvent) => {
    try {
      await broadcastToWebSocket(event.taskId)
    } catch (error) {
      console.warn('Failed to broadcast task update via WebSocket:', error)
    }
  }
}