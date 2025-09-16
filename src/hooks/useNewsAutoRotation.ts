import { useEffect } from 'react'

interface UseNewsAutoRotationProps {
  newsLength: number
  isDebating: boolean
  onRotateNews: () => void
}

export function useNewsAutoRotation({ newsLength, isDebating, onRotateNews }: UseNewsAutoRotationProps) {
  useEffect(() => {
    if (newsLength > 0 && !isDebating) {
      const interval = setInterval(onRotateNews, 5000) // 每5秒切换一个新闻
      return () => clearInterval(interval)
    }
  }, [newsLength, isDebating, onRotateNews])
}