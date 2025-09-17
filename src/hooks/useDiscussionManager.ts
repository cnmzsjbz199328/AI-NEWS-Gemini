import { useState, useCallback } from 'react'
import { AppState, NewsItem } from '@/types'

interface UseDiscussionManagerProps {
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
  news: NewsItem[]
  activeNewsIndex: number
}

interface UseDiscussionManagerReturn {
  startDiscussion: () => Promise<void>
  startPipelineAPI: (title: string, description: string) => Promise<void>
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

  const startPipelineAPI = useCallback(async (title: string, description: string) => {
    console.log('[UI] Starting unified script pipeline for:', title)
    
    const newsTopic = `Title: ${title}. Summary: ${description}`
    
    const requestBody = {
      newsTopics: [newsTopic],
      debateRounds: 1,
      voiceConfig: {
        tom: 'cosy-en-male-energetic',
        mark: 'cosy-en-female-calm', 
        moderator: 'cosy-en-neutral-professional'
      },
      language: 'en-US'
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
    
    updateStatus('Pipeline started - generating unified script...')
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
            progressPercentage: status.progressPercentage
          })
          
          // Update status with progress
          if (status.totalTasks > 0) {
            updateStatus(`Processing discussion... ${status.progressPercentage}% complete (${status.completedTasks}/${status.totalTasks} tasks)`)
          }
          
          // Pipeline is complete when it's no longer active and all tasks are done
          if (!status.isActive && status.totalTasks > 0 && status.completedTasks === status.totalTasks) {
            console.log('[UI] Pipeline completed successfully!')
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

  const startDiscussion = useCallback(async () => {
    console.log('[UI] startDiscussion called!')
    if (state.isDebating || news.length === 0) {
      console.log('[UI] Early return - isDebating:', state.isDebating, 'news.length:', news.length)
      return
    }

    console.log('[UI] Starting discussion...')

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
    updateStatus('The discussion is starting...')

    try {
      // Start the pipeline
      await startPipelineAPI(currentNews.title, currentNews.description)
      
      // Wait for pipeline to complete
      await waitForPipelineCompletion()
      
      // Pipeline completed successfully
      updateStatus('Discussion finished. Click Start to begin again.')
      
    } catch (e: any) {
      console.error('[UI] Discussion error:', e)
      updateError(`An error occurred: ${e.message}`)
    } finally {
      // Always set isDebating to false when done
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