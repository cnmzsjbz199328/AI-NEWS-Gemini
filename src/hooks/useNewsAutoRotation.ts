import { useEffect } from 'react'

interface UseNewsAutoRotationProps {
  newsLength: number
  isDebating: boolean
  onRotateNews: () => void
}

export function useNewsAutoRotation({ newsLength, isDebating, onRotateNews }: UseNewsAutoRotationProps) {
  useEffect(() => {
    if (newsLength > 0) {
      const interval = setInterval(onRotateNews, isDebating ? 30000 : 5000)
      return () => clearInterval(interval)
    }
  }, [newsLength, isDebating, onRotateNews])
}