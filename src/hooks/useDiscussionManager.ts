import { useState, useCallback } from 'react'
import { AppState, NewsItem } from '@/types'

interface UseDiscussionManagerProps {
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
  news: NewsItem[]
  activeNewsIndex: number
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
  activeNewsIndex
}: UseDiscussionManagerProps): UseDiscussionManagerReturn {
  
  const updateStatus = useCallback((msg: string) => {
    setState((prev: AppState) => ({ ...prev, status: msg }))
  }, [setState])

  const updateError = useCallback((msg: string) => {
    setState((prev: AppState) => ({ ...prev, error: msg }))
  }, [setState])

  const startPipelineAPI = useCallback(async (title: string, description: string, forceNew: boolean = false) => {
    console.log('[UI] Starting unified script pipeline for:', title, { forceNew })
    
    const newsTopic = `Title: ${title}. Summary: ${description}`
    
    const requestBody = {
      newsTopic, // Changed from newsTopics array to single topic
      debateRounds: 1,
      voiceConfig: {
        tom: { voiceId: 'cosy-en-male-energetic' },
        mark: { voiceId: 'cosy-en-female-calm' },
        moderator: { voiceId: 'cosy-en-neutral-professional' }
      },
      language: 'en-US',
      forceNew // Add forceNew parameter
    }
    
    console.log('[UI] Sending request to pipeline API:', requestBody)
    
    const response = await fetch('/api/pipeline/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    console.log('[UI] Pipeline API response status:', response.status)
    
    if (!response.ok) {
      const error = await response.json()
      console.error('[UI] Pipeline API error:', error)
      throw new Error(`Pipeline API error: ${error.error}`)
    }

    const result = await response.json()
    console.log('[UI] Pipeline started successfully:', result)
    
    // Handle reused vs new tasks
    if (result.reused) {
      updateStatus('Found existing discussion - replaying content...')
    } else {
      updateStatus('Pipeline started - generating unified script...')
    }
    
    return result // Return result to access reused flag
  }, [updateStatus])

  const waitForPipelineCompletion = useCallback(async (): Promise<void> => {
    console.log('[UI] Waiting for pipeline completion...')
    
    const pollInterval = 2000 // 2 seconds
    const maxWaitTime = 300000 // 5 minutes max wait
    const startTime = Date.now()
    
    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const response = await fetch('/api/pipeline/status')
          if (!response.ok) {
            console.warn('[UI] Failed to fetch pipeline status:', response.status)
            return
          }
          
          const status = await response.json()
          console.log('[UI] Pipeline status check:', {
            isActive: status.isActive,
            completedTasks: status.completedTasks,
            totalTasks: status.totalTasks,
            progressPercentage: status.progressPercentage,
            tasksCount: status.tasks?.length || 0
          })
          
          // Update status with progress
          if (status.totalTasks > 0) {
            updateStatus(`Processing discussion... ${status.progressPercentage}% complete (${status.completedTasks}/${status.totalTasks} tasks)`)
          }
          
          // Check if we have any READY_TO_PLAY tasks (this means generation is complete)
          const readyTasks = status.tasks?.filter((task: any) => task.status === 'READY_TO_PLAY') || [];
          
          if (readyTasks.length > 0) {
            console.log('[UI] Found READY_TO_PLAY tasks, pipeline processing completed!', readyTasks.map((t: any) => t.id));
            clearInterval(pollIntervalId)
            resolve()
            return
          }
          
          // Also check traditional progress percentage for backwards compatibility
          if (status.progressPercentage === 100) {
            console.log('[UI] Pipeline processing completed (100%)!')
            clearInterval(pollIntervalId)
            resolve()
            return
          }
          
          // Check for timeout
          if (Date.now() - startTime > maxWaitTime) {
            console.warn('[UI] Pipeline wait timeout after 5 minutes')
            clearInterval(pollIntervalId)
            reject(new Error('Pipeline completion timeout'))
            return
          }
          
        } catch (error) {
          console.error('[UI] Error checking pipeline status:', error)
        }
      }
      
      // Start polling
      const pollIntervalId = setInterval(checkStatus, pollInterval)
      
      // Initial check
      checkStatus()
    })
  }, [updateStatus])

  const startDiscussion = useCallback(async (forceNew: boolean = false) => {
    console.log('[UI] startDiscussion called!', { forceNew })
    if (state.isDebating || news.length === 0) {
      console.log('[UI] Early return - isDebating:', state.isDebating, 'news.length:', news.length)
      return
    }

    console.log('[UI] Starting discussion...', { forceNew })

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      await audioContext.resume()
      console.log('[UI] Audio context enabled successfully')
    } catch (error) {
      console.warn('[UI] Failed to enable audio context:', error)
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
        console.log('[UI] Content was reused, playback should start immediately')
        updateStatus('Discussion ready. Playback starting...')
      } else {
        // Wait for pipeline to complete for new content
        await waitForPipelineCompletion()
        updateStatus('Discussion ready. Playback will start automatically.')
      }
      
    } catch (e: any) {
      console.error('[UI] Discussion error:', e)
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