/**
 * Audio Manager - 语音播放管理器
 * 
 * 职责：
 * 1. 管理语音播放队列
 * 2. 保证音频严格按序号播放
 * 3. 与角色状态管理器同步
 * 4. 处理播放错误和恢复
 */

import { Speaker, AudioItem, AudioPlaybackState, AudioPlaybackInfo } from '@/types'
import { SpeakerStateManager } from './speaker-state-manager'

export class AudioManager {
  private audioQueue: Map<number, AudioItem> = new Map()
  private currentPlayingSequence: number = -1
  private currentAudio: HTMLAudioElement | null = null
  private speakerStateManager: SpeakerStateManager
  private onStateChange?: (state: AudioPlaybackInfo) => void

  constructor(speakerStateManager: SpeakerStateManager) {
    this.speakerStateManager = speakerStateManager
  }

  /**
   * 设置状态变化回调
   */
  setStateChangeCallback(callback: (state: AudioPlaybackInfo) => void): void {
    this.onStateChange = callback
  }

  /**
   * 通知状态变化
   */
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getPlaybackState())
    }
  }

  /**
   * 添加语音到队列
   */
  addAudioItem(item: AudioItem): void {
    console.log(`[AudioManager] Adding audio item for ${item.speaker}, sequence: ${item.sequenceNumber}`)
    
    // 更新状态为已准备
    const updatedItem = { ...item, state: 'ready' as AudioPlaybackState }
    this.audioQueue.set(item.sequenceNumber, updatedItem)
    
    this.notifyStateChange()
    
    // 尝试播放下一个
    this.tryPlayNext()
  }

  /**
   * 检查并播放下一个语音
   */
  async tryPlayNext(): Promise<void> {
    // 如果当前正在播放，不处理
    if (this.currentAudio && !this.currentAudio.ended) {
      return
    }

    // 查找下一个要播放的序号
    const nextSequence = this.currentPlayingSequence + 1
    const nextItem = this.audioQueue.get(nextSequence)

    if (!nextItem || nextItem.state !== 'ready') {
      console.log(`[AudioManager] No ready audio for sequence ${nextSequence}`)
      return
    }

    if (!nextItem.audioBlob) {
      console.warn(`[AudioManager] No audio blob for sequence ${nextSequence}`)
      this.markAsCompleted(nextSequence)
      return
    }

    await this.playAudio(nextItem)
  }

  /**
   * 播放指定的语音项目
   */
  private async playAudio(audioItem: AudioItem): Promise<void> {
    try {
      console.log(`[AudioManager] Starting playback for ${audioItem.speaker}, sequence: ${audioItem.sequenceNumber}`)
      
      // 更新状态为正在播放
      audioItem.state = 'playing'
      this.audioQueue.set(audioItem.sequenceNumber, audioItem)
      this.currentPlayingSequence = audioItem.sequenceNumber

      // 设置角色为发言状态
      this.speakerStateManager.setSpeaking(audioItem.speaker, audioItem.id)

      // 创建音频元素
      const audioUrl = URL.createObjectURL(audioItem.audioBlob!)
      this.currentAudio = new Audio(audioUrl)

      // 设置播放结束回调
      this.currentAudio.onended = () => {
        console.log(`[AudioManager] Playback completed for ${audioItem.speaker}`)
        this.onAudioComplete(audioItem.sequenceNumber)
        
        // 清理资源
        URL.revokeObjectURL(audioUrl)
      }

      // 设置错误处理
      this.currentAudio.onerror = () => {
        console.error(`[AudioManager] Playback error for ${audioItem.speaker}`)
        this.onAudioComplete(audioItem.sequenceNumber)
        URL.revokeObjectURL(audioUrl)
      }

      this.notifyStateChange()

      // 开始播放
      await this.currentAudio.play()

    } catch (error) {
      console.error(`[AudioManager] Error playing audio for ${audioItem.speaker}:`, error)
      this.onAudioComplete(audioItem.sequenceNumber)
    }
  }

  /**
   * 语音播放完成回调
   */
  private onAudioComplete(sequenceNumber: number): void {
    console.log(`[AudioManager] Audio completed for sequence ${sequenceNumber}`)
    
    const audioItem = this.audioQueue.get(sequenceNumber)
    if (audioItem) {
      // 设置角色为静态状态
      this.speakerStateManager.setStatic(audioItem.speaker)
      
      // 标记为已完成
      this.markAsCompleted(sequenceNumber)
    }

    // 清理当前播放
    this.currentAudio = null
    this.notifyStateChange()

    // 尝试播放下一个
    setTimeout(() => this.tryPlayNext(), 100)
  }

  /**
   * 标记音频为已完成
   */
  private markAsCompleted(sequenceNumber: number): void {
    const audioItem = this.audioQueue.get(sequenceNumber)
    if (audioItem) {
      audioItem.state = 'completed'
      this.audioQueue.set(sequenceNumber, audioItem)
    }
  }

  /**
   * 获取当前播放状态
   */
  getPlaybackState(): AudioPlaybackInfo {
    const currentItem = this.audioQueue.get(this.currentPlayingSequence)
    
    return {
      currentSequence: this.currentPlayingSequence,
      queueLength: this.audioQueue.size,
      isPlaying: this.currentAudio !== null && !this.currentAudio.ended,
      currentSpeaker: currentItem?.speaker
    }
  }

  /**
   * 停止所有播放
   */
  stopAll(): void {
    console.log('[AudioManager] Stopping all audio playback')
    
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio = null
    }

    // 重置所有角色状态
    this.speakerStateManager.resetAllStates()
    this.notifyStateChange()
  }

  /**
   * 清空队列
   */
  clearQueue(): void {
    console.log('[AudioManager] Clearing audio queue')
    
    this.stopAll()
    this.audioQueue.clear()
    this.currentPlayingSequence = -1
    this.notifyStateChange()
  }

  /**
   * 获取队列状态（用于调试）
   */
  getQueueStatus(): { [key: number]: string } {
    const status: { [key: number]: string } = {}
    
    this.audioQueue.forEach((item, seq) => {
      status[seq] = `${item.speaker}:${item.state}`
    })
    
    return status
  }

  /**
   * 检查特定序号是否已完成
   */
  isSequenceCompleted(sequenceNumber: number): boolean {
    const item = this.audioQueue.get(sequenceNumber)
    return item?.state === 'completed'
  }

  /**
   * 获取下一个期望的序号
   */
  getNextExpectedSequence(): number {
    return this.currentPlayingSequence + 1
  }
}

// 单例实例
let instance: AudioManager | null = null

export function getAudioManager(speakerStateManager?: SpeakerStateManager): AudioManager {
  if (!instance && speakerStateManager) {
    instance = new AudioManager(speakerStateManager)
  }
  if (!instance) {
    throw new Error('AudioManager not initialized. Please provide SpeakerStateManager.')
  }
  return instance
}

export function resetAudioManager(): void {
  if (instance) {
    instance.stopAll()
    instance = null
  }
}
