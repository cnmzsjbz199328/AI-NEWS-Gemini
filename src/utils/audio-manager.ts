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
import { FallbackTTS } from './fallback-tts'

export class AudioManager {
  private audioQueue: Map<number, AudioItem> = new Map()
  private currentPlayingSequence: number = -1
  private currentAudio: HTMLAudioElement | null = null
  private onStateChange?: (state: AudioPlaybackInfo) => void
  private onSpeakerChange?: (speaker: Speaker | null, text: string, action: 'start' | 'end') => void
  private fallbackTTS: FallbackTTS | null = null
  private useFallbackTTS: boolean = false

  constructor() {
    // 初始化备用 TTS
    if (typeof window !== 'undefined') {
      try {
        this.fallbackTTS = new FallbackTTS()
        console.log('[AudioManager] Fallback TTS initialized successfully')
      } catch (error) {
        console.warn('[AudioManager] Fallback TTS not available:', error)
      }
    }
  }

  /**
   * 设置状态变化回调
   */
  setStateChangeCallback(callback: (state: AudioPlaybackInfo) => void): void {
    this.onStateChange = callback
  }

  /**
   * 设置说话人变化回调（用于字幕和动画同步）
   */
  setSpeakerChangeCallback(callback: (speaker: Speaker | null, text: string, action: 'start' | 'end') => void): void {
    this.onSpeakerChange = callback
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
   * 添加文本语音项目（使用备用 TTS）
   */
  addTextAudioItem(text: string, speaker: Speaker, sequenceNumber: number, id: string, onPlaybackStart?: () => void): void {
    console.log(`[AudioManager] Adding text audio item for ${speaker}, sequence: ${sequenceNumber}`)
    
    const audioItem: AudioItem = {
      id,
      speaker,
      sequenceNumber,
      text,
      state: 'ready',
      onPlaybackStart,
      useFallbackTTS: true
    }
    
    this.audioQueue.set(sequenceNumber, audioItem)
    this.notifyStateChange()
    this.tryPlayNext()
  }

  /**
   * 设置新队列并开始播放
   * @param items - 要播放的完整音频项目列表
   */
  setQueueAndPlay(items: AudioItem[]): void {
    console.log(`[AudioManager] Setting new queue with ${items.length} items and starting playback.`)
    this.clearQueue()

    items.forEach(item => {
      const updatedItem = { ...item, state: 'ready' as AudioPlaybackState }
      this.audioQueue.set(item.sequenceNumber, updatedItem)
    })

    this.notifyStateChange()
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

    if (!nextItem.audioBlob && !nextItem.useFallbackTTS) {
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

      // 调用播放开始回调（更新对话记录）
      if (audioItem.onPlaybackStart) {
        console.log(`[AudioManager] Calling onPlaybackStart for ${audioItem.speaker}`)
        audioItem.onPlaybackStart()
      }

      // 设置角色为发言状态 - 通过回调通知外部系统
      console.log(`[AudioManager] Setting ${audioItem.speaker} to speaking state`)
      if (this.onSpeakerChange) {
        this.onSpeakerChange(audioItem.speaker, audioItem.text || '', 'start')
      }

      this.notifyStateChange()

      // 判断使用哪种播放方式
      if (audioItem.useFallbackTTS && audioItem.text && this.fallbackTTS) {
        console.log(`[AudioManager] Using fallback TTS for ${audioItem.speaker}`)
        await this.playWithFallbackTTS(audioItem)
      } else if (audioItem.audioBlob) {
        console.log(`[AudioManager] Using audio blob for ${audioItem.speaker}`)
        await this.playWithAudioBlob(audioItem)
      } else {
        throw new Error('No audio source available')
      }

    } catch (error) {
      console.error(`[AudioManager] Error playing audio for ${audioItem.speaker}:`, error)
      this.onAudioComplete(audioItem.sequenceNumber)
    }
  }

  /**
   * 使用备用 TTS 播放
   */
  private async playWithFallbackTTS(audioItem: AudioItem): Promise<void> {
    if (!this.fallbackTTS || !audioItem.text) {
      throw new Error('Fallback TTS not available or no text provided')
    }

    try {
      await this.fallbackTTS.speak(audioItem.text, audioItem.speaker)
      console.log(`[AudioManager] Fallback TTS playback completed for ${audioItem.speaker}`)
      this.onAudioComplete(audioItem.sequenceNumber)
    } catch (error) {
      console.error(`[AudioManager] Fallback TTS error for ${audioItem.speaker}:`, error)
      this.onAudioComplete(audioItem.sequenceNumber)
    }
  }

  /**
   * 使用音频 Blob 播放
   */
  private async playWithAudioBlob(audioItem: AudioItem): Promise<void> {
    if (!audioItem.audioBlob) {
      throw new Error('No audio blob provided')
    }

    console.log(`[AudioManager] Playing audio blob for ${audioItem.speaker}`)
    console.log(`[AudioManager] Blob type: ${audioItem.audioBlob.type}`)
    console.log(`[AudioManager] Blob size: ${audioItem.audioBlob.size} bytes`)

    const audioUrl = URL.createObjectURL(audioItem.audioBlob)
    console.log(`[AudioManager] Created blob URL: ${audioUrl}`)
    
    this.currentAudio = new Audio(audioUrl)

    // 设置播放结束回调
    this.currentAudio.onended = () => {
      console.log(`[AudioManager] Audio blob playback completed for ${audioItem.speaker}`)
      this.onAudioComplete(audioItem.sequenceNumber)
      URL.revokeObjectURL(audioUrl)
    }

    // 设置错误处理
    this.currentAudio.onerror = (event) => {
      console.error(`[AudioManager] Audio blob playback error for ${audioItem.speaker}:`, event)
      console.error(`[AudioManager] Audio element error code:`, this.currentAudio?.error?.code)
      console.error(`[AudioManager] Audio element error message:`, this.currentAudio?.error?.message)
      this.onAudioComplete(audioItem.sequenceNumber)
      URL.revokeObjectURL(audioUrl)
    }

    // 添加加载事件处理
    this.currentAudio.onloadstart = () => {
      console.log(`[AudioManager] Audio loading started for ${audioItem.speaker}`)
    }

    this.currentAudio.oncanplay = () => {
      console.log(`[AudioManager] Audio can play for ${audioItem.speaker}`)
    }

    this.currentAudio.onloadeddata = () => {
      console.log(`[AudioManager] Audio data loaded for ${audioItem.speaker}`)
    }

    // 开始播放
    await this.currentAudio.play()
  }

  /**
   * 语音播放完成回调
   */
  private onAudioComplete(sequenceNumber: number): void {
    console.log(`[AudioManager] Audio completed for sequence ${sequenceNumber}`)
    
    const audioItem = this.audioQueue.get(sequenceNumber)
    if (audioItem) {
      console.log(`[AudioManager] Setting ${audioItem.speaker} back to static after audio completion`)
      // 设置角色为静态状态 - 通过回调通知外部系统
      if (this.onSpeakerChange) {
        this.onSpeakerChange(audioItem.speaker, audioItem.text || '', 'end')
      }
      
      // 标记为已完成
      this.markAsCompleted(sequenceNumber)
    }

    // 清理当前播放
    this.currentAudio = null
    console.log(`[AudioManager] Cleared current audio, notifying state change`)
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

    // 重置所有角色状态 - 通过回调通知外部系统
    console.log('[AudioManager] Resetting all speaker states')
    if (this.onSpeakerChange) {
      this.onSpeakerChange(null, '', 'end')
    }
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
