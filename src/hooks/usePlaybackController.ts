import { useEffect, useCallback, useRef } from 'react'
import { getAudioManager } from '@/utils/audio-manager'
import { Speaker, AudioItem } from '@/types'

interface UsePlaybackControllerProps {
  pipelineStatus: any
  onSpeakerStateChange: (speaker: Speaker, state: 'speaking' | 'idle') => void
  onConversationUpdate?: (speaker: Speaker, text: string, action: 'add' | 'remove') => void
}

export function usePlaybackController({ 
  pipelineStatus, 
  onSpeakerStateChange,
  onConversationUpdate
}: UsePlaybackControllerProps) {
  const processedTasksRef = useRef(new Set<string>())
  const audioManager = useRef(getAudioManager())

  // 设置AudioManager的状态变化回调
  useEffect(() => {
    audioManager.current.setStateChangeCallback((state) => {
      console.log('[PlaybackController] AudioManager state change:', state)
      if (state.currentSpeaker) {
        onSpeakerStateChange(state.currentSpeaker, state.isPlaying ? 'speaking' : 'idle')
      }
    })

    // 设置说话人变化回调（用于字幕和动画同步）
    audioManager.current.setSpeakerChangeCallback((speaker, text, action) => {
      console.log(`[PlaybackController] Speaker change: ${speaker} - ${action} - ${text.substring(0, 50)}`)
      
      if (action === 'start' && speaker) {
        // 开始说话：设置动画状态为speaking，添加字幕
        onSpeakerStateChange(speaker, 'speaking')
        if (onConversationUpdate) {
          onConversationUpdate(speaker, text, 'add')
        }
      } else if (action === 'end') {
        if (speaker) {
          // 结束说话：设置动画状态为idle
          onSpeakerStateChange(speaker, 'idle')
        } else {
          // 重置所有说话人状态
          const speakers: Speaker[] = ['moderator', 'tom', 'mark']
          speakers.forEach(s => onSpeakerStateChange(s, 'idle'))
        }
      }
    })
  }, [onSpeakerStateChange, onConversationUpdate])

  const playTask = useCallback(async (task: any) => {
    try {
      if (task.audioPlaylist && task.script) {
        console.log(`[PlaybackController] ✅ Converting playlist to AudioManager queue for task: ${task.id}`)
        await convertPlaylistToAudioQueue(task.audioPlaylist, task.script)
        
        // 标记任务为已播放
        await fetch(`/api/pipeline/task/${task.id}/mark-played`, { method: 'POST' })
      }
    } catch (error) {
      console.error(`[PlaybackController] ❌ Failed to play task ${task.id}:`, error)
    }
  }, [])

  const convertPlaylistToAudioQueue = useCallback(async (playlist: any, script: any) => {
    let sequenceNumber = 0
    
    // 清空现有队列
    audioManager.current.clearQueue()
    
    // 1. 主持人开场
    if (playlist.moderator_intro && script.moderator_intro) {
      const audioBlob = await fetchAudioBlob(playlist.moderator_intro)
      const audioItem: AudioItem = {
        id: `intro-${Date.now()}`,
        speaker: 'moderator',
        sequenceNumber: sequenceNumber++,
        text: script.moderator_intro,
        state: 'ready',
        audioBlob,
        onPlaybackStart: () => {
          console.log('[PlaybackController] Moderator intro started')
        }
      }
      audioManager.current.addAudioItem(audioItem)
    }
    
    // 2. 对话片段 (使用 for...of 循环处理异步操作)
    if (playlist.conversation && script.conversation) {
      for (const [index, item] of playlist.conversation.entries()) {
        const scriptItem = script.conversation[index]
        if (item.audioUrl && scriptItem && item.speaker === scriptItem.speaker) {
          const audioBlob = await fetchAudioBlob(item.audioUrl)
          const audioItem: AudioItem = {
            id: `conversation-${index}-${Date.now()}`,
            speaker: item.speaker,
            sequenceNumber: sequenceNumber++,
            text: scriptItem.text,
            state: 'ready',
            audioBlob,
            onPlaybackStart: () => {
              console.log(`[PlaybackController] ${item.speaker} conversation started: ${scriptItem.text}`)
            }
          }
          audioManager.current.addAudioItem(audioItem)
        }
      }
    }
    
    // 3. 主持人结语
    if (playlist.moderator_outro && script.moderator_outro) {
      const audioBlob = await fetchAudioBlob(playlist.moderator_outro)
      const audioItem: AudioItem = {
        id: `outro-${Date.now()}`,
        speaker: 'moderator',
        sequenceNumber: sequenceNumber++,
        text: script.moderator_outro, 
        state: 'ready',
        audioBlob,
        onPlaybackStart: () => {
          console.log('[PlaybackController] Moderator outro started')
        }
      }
      audioManager.current.addAudioItem(audioItem)
    }
    
    console.log(`[PlaybackController] Added ${sequenceNumber} items to AudioManager queue`)
  }, [])

  const fetchAudioBlob = useCallback(async (audioUrl: string): Promise<Blob> => {
    const response = await fetch(audioUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch audio blob: ${response.status}`)
    }
    return await response.blob()
  }, [])

  useEffect(() => {
    if (!pipelineStatus || !pipelineStatus.tasks) return

    // 查找READY_TO_PLAY状态的任务
    const readyTasks = pipelineStatus.tasks.filter((task: any) => 
      task.status === 'READY_TO_PLAY' && 
      !processedTasksRef.current.has(task.id)
    )

    const currentPlaybackState = audioManager.current.getPlaybackState()
    if (readyTasks.length > 0 && !currentPlaybackState.isPlaying) {
      // 按创建时间排序，播放最早的任务
      const nextTask = readyTasks.sort((a: any, b: any) => a.createdAt - b.createdAt)[0]
      
      console.log(`[PlaybackController] 🎯 Found ready task: ${nextTask.id}`)
      processedTasksRef.current.add(nextTask.id)
      
      playTask(nextTask)
    }
  }, [pipelineStatus, playTask])

  // 当pipeline停止时，停止播放
  useEffect(() => {
    if (pipelineStatus && !pipelineStatus.isActive) {
      const playbackState = audioManager.current.getPlaybackState()
      if (playbackState.isPlaying) {
        console.log('[PlaybackController] ⏹️ Pipeline stopped, stopping AudioManager playback')
        audioManager.current.stopAll()
      }
    }
  }, [pipelineStatus])

  const stopPlaybackController = useCallback(() => {
    console.log('[PlaybackController] ⏹️ Stopping AudioManager playback')
    audioManager.current.stopAll()
  }, [])

  // 获取AudioManager的播放状态
  const playbackState = audioManager.current.getPlaybackState()

  return {
    isPlaying: playbackState.isPlaying,
    currentSpeaker: playbackState.currentSpeaker,
    stopPlayback: stopPlaybackController
  }
}