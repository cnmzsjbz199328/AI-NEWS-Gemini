import { useEffect, useCallback, useRef, useState } from 'react'
import { getAudioManager } from '@/utils/audio-manager'
import { Speaker, AudioItem } from '@/types'

interface UsePlaybackControllerProps {
  pipelineStatus: any
  onSpeakerStateChange: (speaker: Speaker, state: 'speaking' | 'idle') => void
  onConversationUpdate?: (speaker: Speaker, text: string, action: 'add' | 'remove') => void
  onPlaybackComplete?: () => void
  audioEnabled?: boolean  // if false, pipeline is processed but audio is not played
}

export function usePlaybackController({
  pipelineStatus,
  onSpeakerStateChange,
  onConversationUpdate,
  onPlaybackComplete,
  audioEnabled = true,
}: UsePlaybackControllerProps) {
  const processedTasksRef = useRef(new Set<string>())
  const audioManager = useRef(getAudioManager())
  const [isPlayingState, setIsPlayingState] = useState(false)

  // Wire AudioManager callbacks
  useEffect(() => {
    audioManager.current.setStateChangeCallback((state) => {
      setIsPlayingState(state.isPlaying)
    })

    audioManager.current.setSpeakerChangeCallback((speaker, text, action) => {
      if (action === 'start' && speaker) {
        onSpeakerStateChange(speaker, 'speaking')
        onConversationUpdate?.(speaker, text, 'add')
      } else if (action === 'end') {
        if (speaker) {
          onSpeakerStateChange(speaker, 'idle')
        } else {
          const speakers: Speaker[] = ['moderator', 'tom', 'mark']
          speakers.forEach(s => onSpeakerStateChange(s, 'idle'))
        }
      }
    })

    audioManager.current.setQueueCompleteCallback(() => {
      onPlaybackComplete?.()
    })
  }, [onSpeakerStateChange, onConversationUpdate, onPlaybackComplete])

  const playTask = useCallback(async (task: any) => {
    try {
      // 立即标记任务为已播放，防止重复处理
      try {
        await fetch(`/api/pipeline/task/${task.id}/mark-played`, { method: 'POST' })
      } catch (markError) {
        // 如果无法标记为已播放，不继续播放以避免重复
        return
      }

      if (task.audioPlaylist && task.script) {
        const audioItems = await createAudioQueue(task.audioPlaylist, task.script)
        if (audioItems.length > 0 && audioEnabled) {
          audioManager.current.setQueueAndPlay(audioItems)
        }
      }
    } catch (error) {
      console.error(`[PlaybackController] ❌ Failed to play task ${task.id}:`, error)
    }
  }, [])

  const createAudioQueue = useCallback(async (playlist: any, script: any): Promise<AudioItem[]> => {
    const items: AudioItem[] = []
    let sequenceNumber = 0
    
    // 1. 主持人开场
    if (playlist.moderator_intro && script.moderator_intro) {
      const audioBlob = await fetchAudioBlob(playlist.moderator_intro)
      if (audioBlob) {
        items.push({
          id: `moderator-intro-${sequenceNumber}`,
          speaker: 'moderator',
          text: script.moderator_intro,
          audioBlob,
          sequenceNumber: sequenceNumber++,
          state: 'ready',
          timestamp: Date.now()
        })
      }
    }

    // 2. 辩论轮次
    if (playlist.conversation && script.conversation) {
      for (let i = 0; i < playlist.conversation.length; i++) {
        const audioUrl = playlist.conversation[i].audioUrl  // 修复：使用audioUrl而不是audio
        const scriptEntry = script.conversation[i]
        
        if (audioUrl && scriptEntry) {
          const audioBlob = await fetchAudioBlob(audioUrl)
          if (audioBlob) {
            items.push({
              id: `${scriptEntry.speaker}-${i}-${sequenceNumber}`,
              speaker: scriptEntry.speaker as Speaker,
              text: scriptEntry.text,  // 修复：使用text而不是content
              audioBlob,
              sequenceNumber: sequenceNumber++,
              state: 'ready',
              timestamp: Date.now()
            })
          }
        }
      }
    }

    // 3. 主持人结语
    if (playlist.moderator_outro && script.moderator_outro) {
      const audioBlob = await fetchAudioBlob(playlist.moderator_outro)
      if (audioBlob) {
        items.push({
          id: `moderator-outro-${sequenceNumber}`,
          speaker: 'moderator',
          text: script.moderator_outro,
          audioBlob,
          sequenceNumber: sequenceNumber++,
          state: 'ready',
          timestamp: Date.now()
        })
      }
    }

    return items
  }, [])

  const fetchAudioBlob = useCallback(async (audioUrl: string): Promise<Blob | null> => {
    try {
      const response = await fetch(audioUrl)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return await response.blob()
    } catch (error) {
      console.error(`[PC] fetchAudioBlob failed for ${String(audioUrl).substring(0, 60)}:`, error)
      return null
    }
  }, [])

  // 检查任务并播放 - 改为异步函数
  const checkTasksAndPlay = useCallback(async () => {
    if (!pipelineStatus || !pipelineStatus.tasks || pipelineStatus.tasks.length === 0) {
      return
    }

    // 优先查找READY_TO_PLAY状态的任务（排除已处理的任务）
    const readyTasks = pipelineStatus.tasks.filter((task: any) => 
      task.status === 'READY_TO_PLAY' && 
      !processedTasksRef.current.has(task.id) &&
      task.audioPlaylist &&
      task.script
    )

    // 检查当前播放状态
    const playbackState = audioManager.current.getPlaybackState()

    if (readyTasks.length > 0) {
      // 如果已经在播放，跳过新任务
      if (playbackState.isPlaying) {
        return
      }

      // 只播放第一个任务，避免重叠
      const taskToPlay = readyTasks[0]

      // Mark both the task and its replay key to prevent any double-triggering
      processedTasksRef.current.add(taskToPlay.id)
      processedTasksRef.current.add(`replay-${taskToPlay.id}`)

      await playTask(taskToPlay)
      return
    }

    // 只有在没有READY_TO_PLAY任务时，才考虑重播已完成的任务
    const completedTasks = pipelineStatus.tasks.filter((task: any) => 
      task.status === 'DONE' && 
      task.audioPlaylist && 
      task.script &&
      !processedTasksRef.current.has(`replay-${task.id}`)
    )

    // 只处理已完成任务的重播
    const taskToReplay = completedTasks[0]

    if (taskToReplay && !playbackState.isPlaying) {
      const replayKey = `replay-${taskToReplay.id}`

      processedTasksRef.current.add(replayKey)
      await playTask(taskToReplay)

    }
  }, [pipelineStatus, playTask])

  // 监听pipeline状态变化
  useEffect(() => {
    if (pipelineStatus) {
      // 使用异步IIFE来调用异步函数
      (async () => {
        await checkTasksAndPlay()
      })()
    }
  }, [pipelineStatus, checkTasksAndPlay])


  const stopPlaybackController = useCallback(() => {
    audioManager.current.stopAll()
  }, [])

  const replayLastTask = useCallback(async () => {
    if (!pipelineStatus || !pipelineStatus.tasks) {
      return
    }

    // 找到最后一个已完成的任务
    const completedTasks = pipelineStatus.tasks
      .filter((task: any) => task.status === 'DONE' && task.audioPlaylist && task.script)
      .sort((a: any, b: any) => b.createdAt - a.createdAt) // 按时间倒序

    if (completedTasks.length === 0) {
      return
    }

    const taskToReplay = completedTasks[0]

    // 停止当前播放
    audioManager.current.stopAll()
    
    // 清除重播标记以允许重新播放
    const replayKey = `replay-${taskToReplay.id}`
    processedTasksRef.current.delete(replayKey)
    
    // 播放任务
    setTimeout(async () => {
      await playTask(taskToReplay)
    }, 100)
  }, [pipelineStatus, playTask])

  const stopAllPlayback = useCallback(() => {
    audioManager.current.stopAll()
    // 清除所有已处理的任务标记，允许重新播放
    processedTasksRef.current.clear()
  }, [])

  return {
    isPlaying: isPlayingState,
    currentSpeaker: audioManager.current.getPlaybackState().currentSpeaker,
    queueLength: audioManager.current.getPlaybackState().queueLength,
    stopPlaybackController,
    replayLastTask,
    stopAllPlayback
  }
}