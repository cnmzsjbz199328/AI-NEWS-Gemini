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
      await startPipelineAPI(currentNews.title, currentNews.description)
    } catch (e: any) {
      updateError(`An error occurred: ${e.message}`)
    } finally {
      setState((prev: AppState) => ({ 
        ...prev, 
        isDebating: false
      }))
      updateStatus('Discussion finished. Click Start to begin again.')
    }
  }, [state.isDebating, news, activeNewsIndex, setState, updateStatus, updateError, startPipelineAPI])

  return {
    startDiscussion,
    startPipelineAPI,
    updateStatus,
    updateError
  }
}