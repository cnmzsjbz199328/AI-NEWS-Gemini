'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Square, Volume2, Loader2 } from 'lucide-react'
import { VoicePreviewProps } from '../../types/voice'

const DEFAULT_PREVIEW_TEXT = "你好，这是音色预览测试。Hello, this is a voice preview test."

export default function VoicePreview({
  voiceConfig,
  onPreview,
  isPlaying,
  previewText = DEFAULT_PREVIEW_TEXT
}: VoicePreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [playbackProgress, setPlaybackProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [customText, setCustomText] = useState(previewText)
  const [showCustomText, setShowCustomText] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 清理音频和进度监听
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.src = ''
      }
    }
  }, [currentAudio])

  // 更新播放进度
  const updateProgress = () => {
    if (currentAudio && duration > 0) {
      const progress = (currentAudio.currentTime / duration) * 100
      setPlaybackProgress(progress)
    }
  }

  // 开始进度监听
  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }
    progressIntervalRef.current = setInterval(updateProgress, 100)
  }

  // 停止进度监听
  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }

  // 处理音频播放
  const handlePlay = async () => {
    if (isPlaying && currentAudio) {
      // 暂停当前播放
      currentAudio.pause()
      stopProgressTracking()
      return
    }

    try {
      setIsGenerating(true)
      
      // 使用自定义文本或默认文本
      const textToSpeak = showCustomText ? customText : previewText
      
      // 调用音色预览生成 - 传递整个voiceConfig对象
      await onPreview(voiceConfig.id, textToSpeak, voiceConfig.audioUrl, voiceConfig)
      
      // 这里应该从API获得生成的音频URL，暂时使用原始音频文件作为演示
      if (voiceConfig.audioUrl) {
        const audio = new Audio(voiceConfig.audioUrl)
        setCurrentAudio(audio)
        audioRef.current = audio

        // 设置音频事件监听
        audio.addEventListener('loadedmetadata', () => {
          setDuration(audio.duration)
        })

        audio.addEventListener('play', () => {
          startProgressTracking()
        })

        audio.addEventListener('pause', () => {
          stopProgressTracking()
        })

        audio.addEventListener('ended', () => {
          stopProgressTracking()
          setPlaybackProgress(0)
          setCurrentAudio(null)
        })

        audio.addEventListener('error', (e) => {
          console.error('Audio playback error:', e)
          stopProgressTracking()
          setCurrentAudio(null)
        })

        // 开始播放
        await audio.play()
      }
    } catch (error) {
      console.error('Voice preview error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // 停止播放
  const handleStop = () => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      stopProgressTracking()
      setPlaybackProgress(0)
      setCurrentAudio(null)
    }
  }

  // 格式化时间
  const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 获取当前时间
  const getCurrentTime = (): number => {
    return currentAudio ? currentAudio.currentTime : 0
  }

  return (
    <div className="space-y-3 p-3 bg-gray-50 rounded-md">
      {/* 音色信息 */}
      <div className="flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium text-gray-800">{voiceConfig.name}</span>
        <span className="text-xs text-gray-500">({voiceConfig.character})</span>
      </div>

      {/* 自定义预览文本 */}
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showCustomText}
            onChange={(e) => setShowCustomText(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">自定义预览文本</span>
        </label>
        
        {showCustomText && (
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="输入要预览的文本..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
        )}
      </div>

      {/* 播放控制 */}
      <div className="flex items-center gap-3">
        {/* 播放/暂停按钮 */}
        <button
          onClick={handlePlay}
          disabled={isGenerating}
          className="flex items-center justify-center w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-full transition-colors"
          title={isPlaying ? "暂停" : "播放"}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4 text-white" />
          ) : (
            <Play className="w-4 h-4 text-white ml-0.5" />
          )}
        </button>

        {/* 停止按钮 */}
        <button
          onClick={handleStop}
          disabled={!currentAudio}
          className="flex items-center justify-center w-8 h-8 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 rounded-full transition-colors"
          title="停止"
        >
          <Square className="w-4 h-4 text-white" />
        </button>

        {/* 进度条 */}
        <div className="flex-1 space-y-1">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-100"
              style={{ width: `${playbackProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatTime(getCurrentTime())}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* 状态信息 */}
      {isGenerating && (
        <div className="text-xs text-blue-600 flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          正在生成音色预览...
        </div>
      )}
    </div>
  )
}