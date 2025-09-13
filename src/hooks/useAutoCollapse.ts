import { useState, useEffect, useCallback } from 'react'
import { SETTINGS_PANEL } from '../components/ui/constants'

interface UseAutoCollapseOptions {
  isVisible: boolean
  autoCollapse?: boolean
  autoCollapseDelay?: number
  userInteractionResetDelay?: number
  onCollapse: () => void
}

export function useAutoCollapse({
  isVisible,
  autoCollapse = true,
  autoCollapseDelay = SETTINGS_PANEL.AUTO_COLLAPSE_DELAY,
  userInteractionResetDelay = SETTINGS_PANEL.USER_INTERACTION_RESET_DELAY,
  onCollapse
}: UseAutoCollapseOptions) {
  const [isUserInteracting, setIsUserInteracting] = useState(false)
  const [autoCollapseTimer, setAutoCollapseTimer] = useState<NodeJS.Timeout | null>(null)

  // 自动折叠逻辑
  useEffect(() => {
    if (!autoCollapse || !isVisible) {
      return
    }

    // 清除现有定时器
    if (autoCollapseTimer) {
      clearTimeout(autoCollapseTimer)
    }

    // 如果用户没有交互，设置新的定时器
    if (!isUserInteracting) {
      const timer = setTimeout(() => {
        onCollapse()
      }, autoCollapseDelay)
      
      setAutoCollapseTimer(timer)
    }

    // 清理函数
    return () => {
      if (autoCollapseTimer) {
        clearTimeout(autoCollapseTimer)
      }
    }
  }, [isVisible, isUserInteracting, autoCollapse, autoCollapseDelay, onCollapse])

  // 处理用户交互
  const handleUserInteraction = useCallback(() => {
    setIsUserInteracting(true)
    
    // 清除现有定时器
    if (autoCollapseTimer) {
      clearTimeout(autoCollapseTimer)
      setAutoCollapseTimer(null)
    }

    // 延迟后重置交互状态，重新开始自动折叠倒计时
    setTimeout(() => {
      setIsUserInteracting(false)
    }, userInteractionResetDelay)
  }, [autoCollapseTimer, userInteractionResetDelay])

  return {
    isUserInteracting,
    handleUserInteraction
  }
}