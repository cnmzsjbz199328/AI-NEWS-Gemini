import { useEffect, useCallback, useRef, useState } from 'react'
import { getAudioManager } from '@/utils/audio-manager'
import { Speaker, AudioItem } from '@/types'

interface UsePlaybackControllerProps {
  pipelineStatus: any
  onSpeakerStateChange: (speaker: Speaker, state: 'speaking' | 'idle') => void
  onConversationUpdate?: (speaker: Speaker, text: string, action: 'add' | 'remove') => void
  onPlaybackComplete?: () => void
}

export function usePlaybackController({
  pipelineStatus,
  onSpeakerStateChange,
  onConversationUpdate,
  onPlaybackComplete
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
      console.log(`[PlaybackController] 🚀 Starting to play task: ${task.id}`)
      console.log(`[PlaybackController] 📋 Task details:`, {
        id: task.id,
        status: task.status,
        hasScript: !!task.script,
        hasAudioPlaylist: !!task.audioPlaylist,
        newsTopic: task.newsTopic?.substring(0, 50) + '...'
      })

      // 立即标记任务为已播放，防止重复处理
      try {
        console.log(`[PlaybackController] 🔖 Immediately marking task ${task.id} as played to prevent duplication`)
        await fetch(`/api/pipeline/task/${task.id}/mark-played`, { method: 'POST' })
        console.log(`[PlaybackController] ✅ Task ${task.id} successfully marked as played`)
      } catch (markError) {
        console.error(`[PlaybackController] ❌ CRITICAL: Failed to mark task as played:`, markError)
        // 如果无法标记为已播放，不继续播放以避免重复
        return
      }

      if (task.audioPlaylist && task.script) {
        console.log(`[PlaybackController] ✅ Preparing audio queue for task: ${task.id}`)
        const audioItems = await createAudioQueue(task.audioPlaylist, task.script)
        
        console.log(`[PlaybackController] 🎵 Created ${audioItems.length} audio items`)
        
        if (audioItems.length > 0) {
          console.log(`[PlaybackController] 🎬 Setting queue and starting playback...`)
          audioManager.current.setQueueAndPlay(audioItems)
        } else {
          console.warn(`[PlaybackController] ⚠️ No audio items created for task ${task.id}`)
        }
      } else {
        console.error(`[PlaybackController] ❌ Task ${task.id} missing required data:`, {
          hasAudioPlaylist: !!task.audioPlaylist,
          hasScript: !!task.script
        })
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

    console.log(`[PlaybackController] 🎵 Created ${items.length} audio items from playlist`)
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
      console.error(`[PlaybackController] Failed to fetch audio from ${audioUrl}:`, error)
      return null
    }
  }, [])

  // 检查任务并播放 - 改为异步函数
  const checkTasksAndPlay = useCallback(async () => {
    if (!pipelineStatus || !pipelineStatus.tasks || pipelineStatus.tasks.length === 0) {
      console.log('[PlaybackController] No pipeline status or tasks available')
      return
    }

    console.log(`[PlaybackController] 🔍 Pipeline check - Active: ${pipelineStatus.isActive}, Tasks: ${pipelineStatus.tasks.length}`)
    
    // 打印所有任务状态用于调试
    pipelineStatus.tasks.forEach((task: any, index: number) => {
      console.log(`[PlaybackController] Task ${index}: ID=${task.id}, Status=${task.status}, Processed=${processedTasksRef.current.has(task.id)}`)
    })

    // 优先查找READY_TO_PLAY状态的任务（排除已处理的任务）
    const readyTasks = pipelineStatus.tasks.filter((task: any) => 
      task.status === 'READY_TO_PLAY' && 
      !processedTasksRef.current.has(task.id) &&
      task.audioPlaylist &&
      task.script
    )

    // 检查当前播放状态
    const playbackState = audioManager.current.getPlaybackState()
    console.log(`[PlaybackController] 🎵 Current playback state: isPlaying=${playbackState.isPlaying}, speaker=${playbackState.currentSpeaker}`)

    if (readyTasks.length > 0) {
      console.log(`[PlaybackController] 🎵 Found ${readyTasks.length} ready tasks`)
      
      // 如果已经在播放，跳过新任务
      if (playbackState.isPlaying) {
        console.log(`[PlaybackController] 🎵 Already playing audio, skipping new ready tasks`)
        return
      }
      
      // 只播放第一个任务，避免重叠
      const taskToPlay = readyTasks[0]
      console.log(`[PlaybackController] 🚀 Starting ready task: ${taskToPlay.id}`)
      
      // 立即标记为已处理，防止重复播放（双重保护）
      processedTasksRef.current.add(taskToPlay.id)
      
      await playTask(taskToPlay)
      return // 处理完任务后直接返回
    }

    // 只有在没有READY_TO_PLAY任务时，才考虑重播已完成的任务
    const completedTasks = pipelineStatus.tasks.filter((task: any) => 
      task.status === 'DONE' && 
      task.audioPlaylist && 
      task.script &&
      !processedTasksRef.current.has(`replay-${task.id}`)
    )

    console.log(`[PlaybackController] 📋 Found ${readyTasks.length} ready tasks, ${completedTasks.length} completed tasks for replay`)

    // 只处理已完成任务的重播
    const taskToReplay = completedTasks[0]

    if (taskToReplay && !playbackState.isPlaying) {
      const replayKey = `replay-${taskToReplay.id}`
      
      console.log(`[PlaybackController] 🔄 Found completed task for replay: ${taskToReplay.id}`)
      console.log(`[PlaybackController] 📝 Task script available: ${!!taskToReplay.script}`)
      console.log(`[PlaybackController] 🎧 Task audioPlaylist available: ${!!taskToReplay.audioPlaylist}`)
      
      console.log(`[PlaybackController] 🔄 Auto-replaying completed task: ${taskToReplay.id}`)
      
      processedTasksRef.current.add(replayKey)
      await playTask(taskToReplay)
      
    } else if (!taskToReplay) {
      console.log(`[PlaybackController] ⏳ No tasks available for playback`)
      
      // 如果没有准备好的任务，并且AudioManager认为还在播放，重置其状态
      if (playbackState.isPlaying) {
        console.log(`[PlaybackController] 🔄 No tasks but AudioManager thinks it's playing. Stopping all.`)
        audioManager.current.stopAll()
      }
    } else {
      console.log(`[PlaybackController] 🎵 Audio already playing, skipping new tasks`)
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
    console.log('[PlaybackController] ⏹️ Stopping AudioManager playback')
    audioManager.current.stopAll()
  }, [])

  const replayLastTask = useCallback(async () => {
    console.log('[PlaybackController] 🔄 Replay button clicked!')
    
    if (!pipelineStatus || !pipelineStatus.tasks) {
      console.log('[PlaybackController] No tasks available for replay')
      return
    }

    console.log(`[PlaybackController] Found ${pipelineStatus.tasks.length} total tasks`)

    // 找到最后一个已完成的任务
    const completedTasks = pipelineStatus.tasks
      .filter((task: any) => task.status === 'DONE' && task.audioPlaylist && task.script)
      .sort((a: any, b: any) => b.createdAt - a.createdAt) // 按时间倒序

    console.log(`[PlaybackController] Found ${completedTasks.length} completed tasks`)

    if (completedTasks.length === 0) {
      console.log('[PlaybackController] No completed tasks found for replay')
      return
    }

    const taskToReplay = completedTasks[0]
    console.log(`[PlaybackController] 🔄 Manually replaying task: ${taskToReplay.id}`)

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
    console.log('[PlaybackController] 🛑 Stopping all playback and clearing processed tasks')
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