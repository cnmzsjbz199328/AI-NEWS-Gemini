import { useState, useCallback } from 'react'

export function useVoicePreview() {
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 处理音色预览
  const handleVoicePreview = useCallback(async (voiceId: string, text: string): Promise<void> => {
    try {
      setPreviewingVoice(voiceId)
      setError(null)
      
      // 调用预览API生成音频
      const response = await fetch('/api/voice/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceId,
          emotion: 'neutral',
          speed: 1.0,
          pitch: 1.0
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate preview')
      }

      // 获取音频数据
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      // 播放生成的音频
      const audio = new Audio(audioUrl)
      
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl)
      })

      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e)
        URL.revokeObjectURL(audioUrl)
      })

      await audio.play()
      
    } catch (error) {
      console.error('Voice preview error:', error)
      setError(`预览失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setPreviewingVoice(null)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    previewingVoice,
    error,
    handleVoicePreview,
    clearError
  }
}