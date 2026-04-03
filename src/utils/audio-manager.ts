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
  private onQueueComplete?: () => void
  private _isLoading = false  // mutex: true from playItem() entry until onComplete() entry

  constructor() {
    this.audioPlayer = new AudioPlayer()
    this.queueManager = new AudioQueueManager()
  }

  setStateChangeCallback(callback: (state: AudioPlaybackInfo) => void): void {
    this.onStateChange = callback
  }

  setSpeakerChangeCallback(callback: (speaker: Speaker | null, text: string, action: 'start' | 'end') => void): void {
    this.onSpeakerChange = callback
  }

  setQueueCompleteCallback(callback: () => void): void {
    this.onQueueComplete = callback
  }

  addAudioItem(item: AudioItem): void {
    this.queueManager.addItem(item)
    this.notifyStateChange()
    this.tryPlayNext()
  }

  setQueueAndPlay(items: AudioItem[]): void {
    this.queueManager.setQueue(items)
    this.notifyStateChange()
    this.tryPlayNext()
  }

  async tryPlayNext(): Promise<void> {
    if (this.audioPlayer.isPlaying() || this._isLoading) return

    const nextItem = this.queueManager.getNextItem()
    if (!nextItem) return

    await this.playItem(nextItem)
  }

  private async playItem(item: AudioItem): Promise<void> {
    this._isLoading = true
    this.queueManager.markAsPlaying(item.sequenceNumber)
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
      onPlayStart: () => {
        // fire speaker-start only when audio actually begins — Phase 1 sync fix
        this.onSpeakerChange?.(item.speaker, item.text || '', 'start')
        this.notifyStateChange()
      },
      onEnded: () => this.onComplete(item.sequenceNumber),
      onError: () => this.onComplete(item.sequenceNumber)
    })
  }

  private onComplete(sequenceNumber: number): void {
    this._isLoading = false  // release mutex
    const currentItem = this.queueManager.getCurrentItem()
    if (currentItem) {
      this.onSpeakerChange?.(currentItem.speaker, currentItem.text || '', 'end')
      this.queueManager.markAsCompleted(sequenceNumber)
    }

    this.notifyStateChange()
    setTimeout(() => {
      this.tryPlayNext()
      if (!this.queueManager.getNextItem() && !this.audioPlayer.isPlaying()) {
        this.onQueueComplete?.()
      }
    }, 100)
  }

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

  stopAll(): void {
    this._isLoading = false
    this.audioPlayer.stop()
    this.onSpeakerChange?.(null, '', 'end')
    this.notifyStateChange()
  }

  clearQueue(): void {
    this.stopAll()
    this.queueManager.clear()
    this.notifyStateChange()
  }

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
