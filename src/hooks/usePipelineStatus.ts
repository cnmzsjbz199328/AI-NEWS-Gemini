import { useState, useEffect, useCallback } from 'react'

interface UsePipelineStatusReturn {
  pipelineStatus: any
  pollPipelineStatus: () => Promise<void>
}

export function usePipelineStatus(isDebating: boolean): UsePipelineStatusReturn {
  const [pipelineStatus, setPipelineStatus] = useState<any>(null)
  
  const pollPipelineStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/pipeline/status')
      if (response.ok) {
        const status = await response.json()
        setPipelineStatus(status)
      }
    } catch (error) {
      console.warn('[UI] Failed to poll pipeline status:', error)
    }
  }, [])

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null
    
    if (isDebating) {
      pollPipelineStatus()
      pollInterval = setInterval(pollPipelineStatus, 2000)
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [isDebating, pollPipelineStatus])

  return {
    pipelineStatus,
    pollPipelineStatus
  }
}