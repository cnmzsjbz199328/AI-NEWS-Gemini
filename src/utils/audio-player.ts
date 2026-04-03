/**
 * Audio Player - 专门负责音频播放的核心模块
 * 职责：
 * 1. HTML Audio API 封装
 * 2. 音频加载和播放控制
 * 3. 播放事件管理
 */

import { AudioItem, Speaker } from '@/types'

export interface AudioPlayerEvents {
  onLoadStart?: () => void
  onLoadedData?: (duration: number) => void
  onCanPlayThrough?: () => void
  onPlayStart?: () => void  // fires when audio.play() actually resolves (audio.onplay)
  onEnded?: () => void
  onError?: (error: MediaError | null) => void
}

export class AudioPlayer {
  private audio: HTMLAudioElement | null = null
  private currentBlobUrl: string | null = null

  /**
   * 播放音频 Blob
   */
  async playBlob(audioBlob: Blob, events: AudioPlayerEvents): Promise<void> {
    this.cleanup()

    const audioUrl = URL.createObjectURL(audioBlob)
    this.currentBlobUrl = audioUrl

    const audio = new Audio(audioUrl)
    this.audio = audio

    return new Promise((resolve, reject) => {
      audio.onloadstart = () => events.onLoadStart?.()
      audio.onloadeddata = () => events.onLoadedData?.(audio.duration)
      audio.oncanplaythrough = () => events.onCanPlayThrough?.()

      audio.onplay = () => {
        events.onPlayStart?.()  // fires at actual playback start
      }

      audio.onended = () => {
        this.cleanup()
        events.onEnded?.()
        resolve()
      }

      audio.onerror = () => {
        console.error(`[AudioPlayer] Playback error: code=${audio.error?.code} networkState=${audio.networkState}`)
        this.cleanup()
        events.onError?.(audio.error)
        reject(audio.error || new Error('Unknown audio error'))
      }

      this.waitForReadyAndPlay(audio, reject)
    })
  }

  /**
   * 等待音频准备就绪并开始播放
   */
  private waitForReadyAndPlay(audio: HTMLAudioElement, reject: (reason?: any) => void): void {
    const timeout = setTimeout(() => {
      console.error(`[AudioPlayer] Audio load timeout`)
      this.cleanup()
      reject(new Error('Audio load timeout'))
    }, 10000)

    const checkReady = () => {
      if (audio.readyState >= 4) {
        clearTimeout(timeout)
        audio.play().catch(error => {
          console.error(`[AudioPlayer] audio.play() rejected:`, error)
          this.cleanup()
          reject(error)
        })
      } else {
        setTimeout(checkReady, 100)
      }
    }

    checkReady()
  }

  /**
   * 停止播放
   */
  stop(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = 0
    }
    this.cleanup()
  }

  getCurrentTime(): number {
    return this.audio?.currentTime || 0
  }

  getDuration(): number {
    return this.audio?.duration || 0
  }

  isPlaying(): boolean {
    return this.audio !== null &&
           !this.audio.paused &&
           !this.audio.ended
  }

  private cleanup(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio.onloadstart = null
      this.audio.onloadeddata = null
      this.audio.oncanplaythrough = null
      this.audio.onplay = null
      this.audio.onended = null
      this.audio.onerror = null
      this.audio = null
    }

    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl)
      this.currentBlobUrl = null
    }
  }
}
