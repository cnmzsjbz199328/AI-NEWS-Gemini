/**
 * Audio Queue Manager - 专门管理音频播放队列
 * 职责：
 * 1. 队列状态管理
 * 2. 序列号控制
 * 3. 队列操作（添加、获取、标记完成）
 */

import { AudioItem, AudioPlaybackState, Speaker } from '@/types'

export interface QueueStatus {
  queueLength: number
  currentSequence: number
  nextSequence: number
}

export class AudioQueueManager {
  private audioQueue: Map<number, AudioItem> = new Map()
  private currentPlayingSequence: number = -1

  /**
   * 添加音频项目到队列
   */
  addItem(item: AudioItem): void {
    const updatedItem = { ...item, state: 'ready' as AudioPlaybackState }
    this.audioQueue.set(item.sequenceNumber, updatedItem)
  }

  /**
   * 批量设置队列
   */
  setQueue(items: AudioItem[]): void {
    this.audioQueue.clear()
    this.currentPlayingSequence = -1

    items.forEach(item => {
      const updatedItem = { ...item, state: 'ready' as AudioPlaybackState }
      this.audioQueue.set(item.sequenceNumber, updatedItem)
    })
  }

  /**
   * 获取下一个待播放项目
   */
  getNextItem(): AudioItem | null {
    const nextSequence = this.currentPlayingSequence + 1
    const nextItem = this.audioQueue.get(nextSequence)

    if (!nextItem || nextItem.state !== 'ready') {
      return null
    }

    return nextItem
  }

  /**
   * 标记项目为正在播放
   */
  markAsPlaying(sequenceNumber: number): boolean {
    const item = this.audioQueue.get(sequenceNumber)
    if (!item) {
      console.error(`[QueueManager] Item not found for sequence ${sequenceNumber}`)
      return false
    }

    item.state = 'playing'
    this.audioQueue.set(sequenceNumber, item)
    this.currentPlayingSequence = sequenceNumber
    return true
  }

  /**
   * 标记项目为已完成
   */
  markAsCompleted(sequenceNumber: number): boolean {
    const item = this.audioQueue.get(sequenceNumber)
    if (!item) {
      console.error(`[QueueManager] Item not found for sequence ${sequenceNumber}`)
      return false
    }

    item.state = 'completed'
    this.audioQueue.set(sequenceNumber, item)
    return true
  }

  /**
   * 获取当前播放项目
   */
  getCurrentItem(): AudioItem | null {
    if (this.currentPlayingSequence === -1) return null
    return this.audioQueue.get(this.currentPlayingSequence) || null
  }

  /**
   * 获取队列状态
   */
  getStatus(): QueueStatus {
    return {
      queueLength: this.audioQueue.size,
      currentSequence: this.currentPlayingSequence,
      nextSequence: this.currentPlayingSequence + 1
    }
  }

  /**
   * 检查序列是否已完成
   */
  isSequenceCompleted(sequenceNumber: number): boolean {
    const item = this.audioQueue.get(sequenceNumber)
    return item?.state === 'completed'
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.audioQueue.clear()
    this.currentPlayingSequence = -1
  }

  /**
   * 获取队列调试信息
   */
  getDebugInfo(): { [key: number]: string } {
    const status: { [key: number]: string } = {}
    this.audioQueue.forEach((item, seq) => {
      status[seq] = `${item.speaker}:${item.state}`
    })
    return status
  }

  /**
   * 检查队列是否为空
   */
  isEmpty(): boolean {
    return this.audioQueue.size === 0
  }

  /**
   * 获取所有项目（调试用）
   */
  getAllItems(): AudioItem[] {
    return Array.from(this.audioQueue.values())
  }
}