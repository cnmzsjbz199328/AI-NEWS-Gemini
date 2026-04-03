import { useEffect } from 'react'

interface UseNewsAutoRotationProps {
  newsLength: number
  isDebating: boolean
  onRotateNews: () => void
  enabled?: boolean       // if false, auto-rotation is disabled
  intervalSeconds?: number // idle rotation interval in seconds (default 5)
}

export function useNewsAutoRotation({ newsLength, isDebating, onRotateNews, enabled = true, intervalSeconds = 5 }: UseNewsAutoRotationProps) {
  useEffect(() => {
    if (!enabled || newsLength === 0) return
    const interval = setInterval(onRotateNews, isDebating ? 30000 : intervalSeconds * 1000)
    return () => clearInterval(interval)
  }, [newsLength, isDebating, onRotateNews, enabled, intervalSeconds])
}