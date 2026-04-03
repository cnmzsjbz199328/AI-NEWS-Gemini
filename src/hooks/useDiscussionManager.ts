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
  }, [updateStatus])

  const waitForPipelineCompletion = useCallback(async (): Promise<void> => {
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
          
          // Check if we have any READY_TO_PLAY tasks (this means generation is complete)
          const readyTasks = status.tasks?.filter((task: any) => task.status === 'READY_TO_PLAY') || [];
          
          if (readyTasks.length > 0) {
            clearInterval(pollIntervalId)
            resolve()
            return
          }
          
          // Also check traditional progress percentage for backwards compatibility
          if (status.progressPercentage === 100) {
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
        // Wait for pipeline to complete for new content
        await waitForPipelineCompletion()
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