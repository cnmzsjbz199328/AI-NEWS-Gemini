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
  onPlay?: () => void
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

    console.log(`[AudioPlayer] 🎵 Starting blob playback, size: ${audioBlob.size} bytes, type: ${audioBlob.type}`)

    const audioUrl = URL.createObjectURL(audioBlob)
    this.currentBlobUrl = audioUrl
    
    const audio = new Audio(audioUrl)
    this.audio = audio

    return new Promise((resolve, reject) => {
      // 设置事件监听器
      audio.onloadstart = () => {
        console.log(`[AudioPlayer] 📡 Audio loading started`)
        events.onLoadStart?.()
      }

      audio.onloadeddata = () => {
        console.log(`[AudioPlayer] 📊 Audio data loaded, duration: ${audio.duration}s`)
        events.onLoadedData?.(audio.duration)
      }

      audio.oncanplaythrough = () => {
        console.log(`[AudioPlayer] ✅ Audio can play through`)
        events.onCanPlayThrough?.()
      }

      audio.onplay = () => {
        console.log(`[AudioPlayer] ▶️ Audio play started, duration: ${audio.duration}s, currentTime: ${audio.currentTime}s`)
        events.onPlay?.()
        
        // 添加时间更新监听来跟踪播放进度
        const timeUpdateListener = () => {
          console.log(`[AudioPlayer] ⏱️ Playing: ${audio.currentTime.toFixed(1)}s / ${audio.duration.toFixed(1)}s`)
        }
        audio.addEventListener('timeupdate', timeUpdateListener)
        
        // 当音频结束时清除监听器
        const originalOnEnded = audio.onended
        audio.onended = (event) => {
          audio.removeEventListener('timeupdate', timeUpdateListener)
          if (originalOnEnded) originalOnEnded.call(audio, event)
        }
      }

      audio.onended = () => {
        console.log(`[AudioPlayer] 🏁 Audio playback completed`)
        this.cleanup()
        events.onEnded?.()
        resolve()
      }

      audio.onerror = () => {
        const errorDetails = {
          error: audio.error,
          code: audio.error?.code,
          message: audio.error?.message,
          networkState: audio.networkState,
          readyState: audio.readyState
        }
        console.error(`[AudioPlayer] ❌ Audio playback error:`, errorDetails)
        this.cleanup()
        events.onError?.(audio.error)
        reject(audio.error || new Error('Unknown audio error'))
      }

      // 等待音频加载完成再播放
      this.waitForReadyAndPlay(audio, reject)
    })
  }

  /**
   * 等待音频准备就绪并开始播放
   */
  private waitForReadyAndPlay(audio: HTMLAudioElement, reject: (reason?: any) => void): void {
    console.log(`[AudioPlayer] ⏳ Waiting for audio to be ready...`)

    // 超时保护
    const timeout = setTimeout(() => {
      console.error(`[AudioPlayer] ⏰ Audio load timeout`)
      this.cleanup()
      reject(new Error('Audio load timeout'))
    }, 10000)

    const checkReady = () => {
      if (audio.readyState >= 4) { // HAVE_ENOUGH_DATA
        clearTimeout(timeout)
        console.log(`[AudioPlayer] ✅ Audio ready, starting playback`)
        
        audio.play().catch(error => {
          console.error(`[AudioPlayer] ❌ audio.play() rejected:`, error)
          this.cleanup()
          reject(error)
        })
      } else {
        console.log(`[AudioPlayer] ⏳ Audio not ready yet (readyState: ${audio.readyState}), waiting...`)
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

  /**
   * 获取播放时间
   */
  getCurrentTime(): number {
    return this.audio?.currentTime || 0
  }

  /**
   * 获取音频时长
   */
  getDuration(): number {
    return this.audio?.duration || 0
  }

  /**
   * 检查是否正在播放
   */
  isPlaying(): boolean {
    return this.audio !== null && 
           !this.audio.paused && 
           !this.audio.ended
  }

  /**
   * 清理资源
   */
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