import { useState, useCallback } from 'react'
import { AppState, NewsItem, VoiceConfig, SupportedLanguage } from '@/types'
import { DEFAULT_TTS_VOICE_CONFIG } from '@/components/ui/constants'

const DEBATE_ROUNDS: Record<'slow' | 'normal' | 'fast', number> = {
  slow: 1,
  normal: 2,
  fast: 3,
}

interface UseDiscussionManagerProps {
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
  news: NewsItem[]
  activeNewsIndex: number
  ttsVoiceConfig?: VoiceConfig
  language?: SupportedLanguage
  debateSpeed?: 'slow' | 'normal' | 'fast'
}

interface UseDiscussionManagerReturn {
  startDiscussion: (forceNew?: boolean) => Promise<void>
  startPipelineAPI: (title: string, description: string, forceNew?: boolean) => Promise<void>
  updateStatus: (msg: string) => void
  updateError: (msg: string) => void
}

export function useDiscussionManager({
  state,
  setState,
  news,
  activeNewsIndex,
  ttsVoiceConfig,
  language = 'en-US',
  debateSpeed = 'normal',
}: UseDiscussionManagerProps): UseDiscussionManagerReturn {
  
  const updateStatus = useCallback((msg: string) => {
    setState((prev: AppState) => ({ ...prev, status: msg }))
  }, [setState])

  const updateError = useCallback((msg: string) => {
    setState((prev: AppState) => ({ ...prev, error: msg }))
  }, [setState])

  const startPipelineAPI = useCallback(async (title: string, description: string, forceNew: boolean = false) => {
    const newsTopic = `Title: ${title}. Summary: ${description}`

    const requestBody = {
      newsTopic,
      debateRounds: DEBATE_ROUNDS[debateSpeed],
      voiceConfig: ttsVoiceConfig ?? DEFAULT_TTS_VOICE_CONFIG,
      language,
      forceNew
    }
    
    const response = await fetch('/api/pipeline/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Pipeline API error: ${error.error}`)
    }

    const result = await response.json()

    // Handle reused vs new tasks
    if (result.reused) {
      updateStatus('Found existing discussion - replaying content...')
    } else {
      updateStatus('Pipeline started - generating unified script...')
    }
    
    return result // Return result to access reused flag
  }, [updateStatus, ttsVoiceConfig, language, debateSpeed])

  const waitForPipelineCompletion = useCallback(async (taskId?: string): Promise<void> => {
    const pollInterval = 2000 // 2 seconds
    const maxWaitTime = 300000 // 5 minutes max wait
    const startTime = Date.now()

    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const response = await fetch('/api/pipeline/status')
          if (!response.ok) {
            return
          }

          const status = await response.json()

          // Update status with progress
          if (status.totalTasks > 0) {
            updateStatus(`Processing discussion... ${status.progressPercentage}% complete (${status.completedTasks}/${status.totalTasks} tasks)`)
          }

          // Check if the specific task is READY_TO_PLAY (or any task if no ID provided)
          const readyTasks = (status.tasks ?? []).filter((task: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
            task.status === 'READY_TO_PLAY' && (!taskId || task.id === taskId)
          )

          if (readyTasks.length > 0) {
            clearInterval(pollIntervalId)
            resolve()
            return
          }

          // Check for timeout
          if (Date.now() - startTime > maxWaitTime) {
            clearInterval(pollIntervalId)
            reject(new Error('Pipeline completion timeout'))
            return
          }

        } catch (error) {
          // continue polling
        }
      }

      // Start polling
      const pollIntervalId = setInterval(checkStatus, pollInterval)

      // Initial check
      checkStatus()
    })
  }, [updateStatus])

  const startDiscussion = useCallback(async (forceNew: boolean = false) => {
    if (state.isDebating || news.length === 0) {
      return
    }

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      await audioContext.resume()
    } catch (error) {
      // audio context may already be running
    }

    const currentNews = news[activeNewsIndex]

    setState((prev: AppState) => ({ 
      ...prev, 
      isDebating: true,
      currentMessage: null,
      error: '',
      conversation: []
    }))
    
    if (forceNew) {
      updateStatus('Generating new discussion...')
    } else {
      updateStatus('The discussion is starting...')
    }

    try {
      // Start the pipeline with forceNew parameter
      const result = await startPipelineAPI(currentNews.title, currentNews.description, forceNew)

      // If content was reused, skip waiting for pipeline completion
      if (result && result.reused) {
        updateStatus('Discussion ready. Playback starting...')
      } else {
        // Wait for this specific task to be READY_TO_PLAY
        await waitForPipelineCompletion(result?.taskId)
        updateStatus('Discussion ready. Playback will start automatically.')
      }
      
    } catch (e: any) {
      updateError(`An error occurred: ${e.message}`)
      // Set isDebating to false on error to allow retry
      setState((prev: AppState) => ({ 
        ...prev, 
        isDebating: false
      }))
    }
  }, [state.isDebating, news, activeNewsIndex, setState, updateStatus, updateError, startPipelineAPI, waitForPipelineCompletion])

  return {
    startDiscussion,
    startPipelineAPI,
    updateStatus,
    updateError
  }
}