/**
 * Audio Manager - 简洁版音频管理器
 * 
 * 职责：
 * 1. 作为音频播放的统一接口
 * 2. 协调各个模块的工作
 * 3. 管理状态通知
 */

import { Speaker, AudioItem, AudioPlaybackInfo } from '@/types'
import { AudioPlayer } from './audio-player'
import { AudioQueueManager } from './audio-queue-manager'

export class AudioManager {
  private audioPlayer: AudioPlayer
  private queueManager: AudioQueueManager
  private onStateChange?: (state: AudioPlaybackInfo) => void
  private onSpeakerChange?: (speaker: Speaker | null, text: string, action: 'start' | 'end') => void

  constructor() {
    this.audioPlayer = new AudioPlayer()
    this.queueManager = new AudioQueueManager()
    console.log('[AudioManager] Initialized successfully')
  }

  // 设置回调函数
  setStateChangeCallback(callback: (state: AudioPlaybackInfo) => void): void {
    this.onStateChange = callback
  }

  setSpeakerChangeCallback(callback: (speaker: Speaker | null, text: string, action: 'start' | 'end') => void): void {
    this.onSpeakerChange = callback
  }

  // 队列操作
  addAudioItem(item: AudioItem): void {
    this.queueManager.addItem(item)
    this.notifyStateChange()
    this.tryPlayNext()
  }

  setQueueAndPlay(items: AudioItem[]): void {
    console.log(`[AudioManager] Setting queue with ${items.length} items`)
    this.queueManager.setQueue(items)
    this.notifyStateChange()
    this.tryPlayNext()
  }

  // 播放控制
  async tryPlayNext(): Promise<void> {
    if (this.audioPlayer.isPlaying()) {
      console.log(`[AudioManager] ⏸️ Player already playing, skipping`)
      return
    }

    const nextItem = this.queueManager.getNextItem()
    if (!nextItem) {
      console.log(`[AudioManager] 📭 No next item in queue`)
      return
    }

    console.log(`[AudioManager] ▶️ Found next item: ${nextItem.speaker} seq:${nextItem.sequenceNumber}`)
    await this.playItem(nextItem)
  }

  private async playItem(item: AudioItem): Promise<void> {
    console.log(`[AudioManager] Playing ${item.speaker}, seq: ${item.sequenceNumber}`)
    
    this.queueManager.markAsPlaying(item.sequenceNumber)
    
    // 通知开始播放
    this.onSpeakerChange?.(item.speaker, item.text || '', 'start')
    this.notifyStateChange()

    try {
      if (item.audioBlob) {
        await this.playWithBlob(item)
      } else {
        throw new Error('No audio source')
      }
    } catch (error) {
      console.error(`[AudioManager] Playback error:`, error)
      this.onComplete(item.sequenceNumber)
    }
  }

  private async playWithBlob(item: AudioItem): Promise<void> {
    return this.audioPlayer.playBlob(item.audioBlob!, {
      onEnded: () => this.onComplete(item.sequenceNumber),
      onError: () => this.onComplete(item.sequenceNumber)
    })
  }

  private onComplete(sequenceNumber: number): void {
    const currentItem = this.queueManager.getCurrentItem()
    if (currentItem) {
      console.log(`[AudioManager] Completed ${currentItem.speaker}`)
      this.onSpeakerChange?.(currentItem.speaker, currentItem.text || '', 'end')
      this.queueManager.markAsCompleted(sequenceNumber)
    }
    
    this.notifyStateChange()
    setTimeout(() => this.tryPlayNext(), 100)
  }

  // 状态查询
  getPlaybackState(): AudioPlaybackInfo {
    const queueStatus = this.queueManager.getStatus()
    const currentItem = this.queueManager.getCurrentItem()
    const isPlaying = this.audioPlayer.isPlaying()
    
    return {
      currentSequence: queueStatus.currentSequence,
      queueLength: queueStatus.queueLength,
      isPlaying,
      currentSpeaker: isPlaying ? currentItem?.speaker : undefined
    }
  }

  // 控制操作
  stopAll(): void {
    console.log('[AudioManager] Stopping all')
    this.audioPlayer.stop()
    this.onSpeakerChange?.(null, '', 'end')
    this.notifyStateChange()
  }

  clearQueue(): void {
    this.stopAll()
    this.queueManager.clear()
    this.notifyStateChange()
  }

  // 私有方法
  private notifyStateChange(): void {
    this.onStateChange?.(this.getPlaybackState())
  }

  // 兼容性方法
  addTextAudioItem(text: string, speaker: Speaker, sequenceNumber: number, id: string, onPlaybackStart?: () => void): void {
    this.addAudioItem({
      id, speaker, sequenceNumber, text,
      state: 'ready',
      onPlaybackStart
    })
  }

  getQueueStatus(): { [key: number]: string } {
    return this.queueManager.getDebugInfo()
  }

  isSequenceCompleted(sequenceNumber: number): boolean {
    return this.queueManager.isSequenceCompleted(sequenceNumber)
  }

  getNextExpectedSequence(): number {
    return this.queueManager.getStatus().nextSequence
  }
}

// 单例模式
let instance: AudioManager | null = null

export function getAudioManager(): AudioManager {
  if (!instance) {
    instance = new AudioManager()
  }
  return instance
}

export function resetAudioManager(): void {
  if (instance) {
    instance.stopAll()
    instance = null
  }
}