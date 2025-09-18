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
      console.log(`[LOG-CHAIN] 1. AudioManager fired onSpeakerChange. Speaker: ${speaker}, Action: ${action}`)
      
      if (action === 'start' && speaker) {
        console.log(`[LOG-CHAIN] 2. PlaybackController is calling onSpeakerStateChange with 'speaking'.`);
        onSpeakerStateChange(speaker, 'speaking')
        if (onConversationUpdate) {
          console.log(`[LOG-CHAIN] 2b. PlaybackController is calling onConversationUpdate.`);
          onConversationUpdate(speaker, text, 'add')
        }
      } else if (action === 'end') {
        if (speaker) {
          console.log(`[LOG-CHAIN] 2. PlaybackController is calling onSpeakerStateChange with 'idle'.`);
          onSpeakerStateChange(speaker, 'idle')
        } else {
          const speakers: Speaker[] = ['moderator', 'tom', 'mark']
          console.log(`[LOG-CHAIN] 2. PlaybackController is resetting all speakers to 'idle'.`);
          speakers.forEach(s => onSpeakerStateChange(s, 'idle'))
        }
      }
    })
  }, [onSpeakerStateChange, onConversationUpdate])

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

      if (task.audioPlaylist && task.script) {
        console.log(`[PlaybackController] ✅ Preparing audio queue for task: ${task.id}`)
        const audioItems = await createAudioQueue(task.audioPlaylist, task.script)
        
        console.log(`[PlaybackController] 🎵 Created ${audioItems.length} audio items`)
        
        if (audioItems.length > 0) {
          console.log(`[PlaybackController] 🎬 Setting queue and starting playback...`)
          audioManager.current.setQueueAndPlay(audioItems)
          
          // 标记任务为已播放
          try {
            await fetch(`/api/pipeline/task/${task.id}/mark-played`, { method: 'POST' })
            console.log(`[PlaybackController] ✅ Task ${task.id} marked as played`)
          } catch (markError) {
            console.warn(`[PlaybackController] ⚠️ Failed to mark task as played:`, markError)
          }
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
      items.push({
        id: `intro-${Date.now()}`,
        speaker: 'moderator',
        sequenceNumber: sequenceNumber++,
        text: script.moderator_intro,
        state: 'ready',
        audioBlob,
        onPlaybackStart: () => console.log('[PlaybackController] Moderator intro started')
      })
    }
    
    // 2. 对话片段
    if (playlist.conversation && script.conversation) {
      for (const [index, item] of playlist.conversation.entries()) {
        const scriptItem = script.conversation[index]
        if (item.audioUrl && scriptItem && item.speaker === scriptItem.speaker) {
          const audioBlob = await fetchAudioBlob(item.audioUrl)
          items.push({
            id: `conversation-${index}-${Date.now()}`,
            speaker: item.speaker,
            sequenceNumber: sequenceNumber++,
            text: scriptItem.text,
            state: 'ready',
            audioBlob,
            onPlaybackStart: () => console.log(`[PlaybackController] ${item.speaker} conversation started: ${scriptItem.text}`)
          })
        }
      }
    }
    
    // 3. 主持人结语
    if (playlist.moderator_outro && script.moderator_outro) {
      const audioBlob = await fetchAudioBlob(playlist.moderator_outro)
      items.push({
        id: `outro-${Date.now()}`,
        speaker: 'moderator',
        sequenceNumber: sequenceNumber++,
        text: script.moderator_outro, 
        state: 'ready',
        audioBlob,
        onPlaybackStart: () => console.log('[PlaybackController] Moderator outro started')
      })
    }
    
    console.log(`[PlaybackController] Created queue with ${items.length} audio items.`)
    return items
  }, [])

  const fetchAudioBlob = useCallback(async (audioUrl: string): Promise<Blob> => {
    try {
      // 将Hugging Face URL重写为使用我们的API代理
      const proxyUrl = `/api/audio/${audioUrl}`;
      console.log(`[PlaybackController] 🎵 Fetching audio via proxy: ${proxyUrl}`)

      const response = await fetch(proxyUrl)
      console.log(`[PlaybackController] 📡 Audio fetch response: status=${response.status}, ok=${response.ok}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[PlaybackController] ❌ Audio fetch failed: ${response.status} - ${errorText}`)
        throw new Error(`Failed to fetch audio blob: ${response.status} - ${errorText}`)
      }
      
      const blob = await response.blob()
      console.log(`[PlaybackController] 🎵 Audio blob received: size=${blob.size} bytes, type=${blob.type}`)
      
      if (blob.size === 0) {
        throw new Error('Received empty audio blob')
      }
      
      return blob
    } catch (error) {
      console.error(`[PlaybackController] ❌ fetchAudioBlob error:`, error)
      throw error
    }
  }, [])

  useEffect(() => {
    if (!pipelineStatus || !pipelineStatus.tasks) {
      console.log('[PlaybackController] No pipeline status or tasks available')
      return
    }

    console.log(`[PlaybackController] 🔍 Pipeline check - Active: ${pipelineStatus.isActive}, Tasks: ${pipelineStatus.tasks.length}`)
    
    // 打印所有任务状态用于调试
    pipelineStatus.tasks.forEach((task: any, index: number) => {
      console.log(`[PlaybackController] Task ${index}: ID=${task.id}, Status=${task.status}, Processed=${processedTasksRef.current.has(task.id)}`)
    })

    // 优先查找READY_TO_PLAY状态的任务
    const readyTasks = pipelineStatus.tasks.filter((task: any) => 
      task.status === 'READY_TO_PLAY' && 
      !processedTasksRef.current.has(task.id)
    )

    if (readyTasks.length > 0) {
      console.log(`[PlaybackController] 🎵 Found ${readyTasks.length} ready tasks`)
      for (const task of readyTasks) {
        console.log(`[PlaybackController] 🚀 Starting ready task: ${task.id}`)
        playTask(task) // 不需要await，playTask内部会处理异步
      }
      return // 处理完READY_TO_PLAY任务后直接返回，不处理重播
    }

    // 只有在没有READY_TO_PLAY任务时，才考虑重播已完成的任务
    const completedTasks = pipelineStatus.tasks.filter((task: any) => 
      task.status === 'DONE' && 
      task.audioPlaylist && 
      task.script &&
      !processedTasksRef.current.has(`replay-${task.id}`)
    )

    console.log(`[PlaybackController] 📋 Found 0 ready tasks (already processed), ${completedTasks.length} completed tasks for replay`)

    const currentPlaybackState = audioManager.current.getPlaybackState()
    console.log(`[PlaybackController] 🎵 Current playback state: isPlaying=${currentPlaybackState.isPlaying}, speaker=${currentPlaybackState.currentSpeaker}`)

    // 只处理已完成任务的重播
    const taskToReplay = completedTasks[0]

    if (taskToReplay && !currentPlaybackState.isPlaying) {
      const replayKey = `replay-${taskToReplay.id}`
      
      console.log(`[PlaybackController] 🔄 Found completed task for replay: ${taskToReplay.id}`)
      console.log(`[PlaybackController] 📝 Task script available: ${!!taskToReplay.script}`)
      console.log(`[PlaybackController] 🎧 Task audioPlaylist available: ${!!taskToReplay.audioPlaylist}`)
      
      console.log(`[PlaybackController] 🔄 Auto-replaying completed task: ${taskToReplay.id}`)
      
      processedTasksRef.current.add(replayKey)
      playTask(taskToReplay)
      
    } else if (!taskToReplay) {
      console.log(`[PlaybackController] ⏳ No tasks available for playback`)
      
      // 如果没有准备好的任务，并且AudioManager认为还在播放，重置其状态
      if (currentPlaybackState.isPlaying) {
        console.log(`[PlaybackController] 🔄 No tasks but AudioManager thinks it's playing. Stopping all.`)
        audioManager.current.stopAll()
      }
    } else {
      console.log(`[PlaybackController] 🎵 Audio already playing, skipping new tasks`)
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

  const replayLastTask = useCallback(() => {
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
    setTimeout(() => playTask(taskToReplay), 100)
  }, [pipelineStatus, playTask])

  // 获取AudioManager的播放状态
  const playbackState = audioManager.current.getPlaybackState()

  return {
    isPlaying: playbackState.isPlaying,
    currentSpeaker: playbackState.currentSpeaker,
    stopPlayback: stopPlaybackController,
    replayLastTask
  }
}