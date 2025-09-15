'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileAudio, AlertCircle, CheckCircle, Play } from 'lucide-react'
import { VoiceConfig, VoiceUploadProps } from '../types/voice'
import VoicePreview from './VoicePreview'

const ACCEPTED_FORMATS = ['audio/wav', 'audio/mp3', 'audio/ogg', 'audio/m4a', 'audio/aac']
const MAX_FILE_SIZE = 10 // MB
const PREVIEW_TEXT = "你好，这是音色预览测试。Hello, this is a voice preview test."

export default function VoiceUpload({
  onVoiceUpload,
  onVoiceDelete,
  existingVoices,
  maxFileSize = MAX_FILE_SIZE,
  acceptedFormats = ACCEPTED_FORMATS
}: VoiceUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<'moderator' | 'tom' | 'mark'>('moderator')
  const [voiceName, setVoiceName] = useState('')
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState<{ [key: string]: boolean }>({})
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 文件验证
  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `不支持的文件格式。请上传：${acceptedFormats.join(', ')}`
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `文件大小超过限制（${maxFileSize}MB）`
    }
    
    return null
  }

  // 获取音频时长
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio()
      const url = URL.createObjectURL(file)
      
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration)
        URL.revokeObjectURL(url)
      })
      
      audio.addEventListener('error', () => {
        resolve(0)
        URL.revokeObjectURL(url)
      })
      
      audio.src = url
    })
  }

  // 模拟上传进度
  const simulateUpload = (): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 30
        if (progress >= 100) {
          setUploadProgress(100)
          clearInterval(interval)
          setTimeout(resolve, 200)
        } else {
          setUploadProgress(progress)
        }
      }, 100)
    })
  }

  // 处理文件上传
  const handleFileUpload = useCallback(async (file: File) => {
    setError(null)
    
    // 验证文件
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    // 检查是否已有相同角色的音色
    const existingVoice = existingVoices.find(v => v.character === selectedCharacter)
    if (existingVoice) {
      setError(`${selectedCharacter} 角色已有音色配置，请先删除现有配置`)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // 获取音频时长
      const duration = await getAudioDuration(file)
      
      // 模拟上传过程
      await simulateUpload()
      
      // 创建音色配置
      const voiceConfig: VoiceConfig = {
        id: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: voiceName || `${selectedCharacter}的音色`,
        character: selectedCharacter,
        audioFile: file,
        audioUrl: URL.createObjectURL(file),
        isDefault: false,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size,
        duration
      }

      // 调用上传回调
      onVoiceUpload(voiceConfig)
      
      // 重置表单
      setVoiceName('')
      setUploadProgress(0)
      
    } catch (error) {
      setError('上传失败，请重试')
      console.error('Voice upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }, [selectedCharacter, voiceName, existingVoices, onVoiceUpload, maxFileSize, acceptedFormats])

  // 拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])

  // 文件选择处理
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 处理音色预览
  const handleVoicePreview = async (voiceId: string, text: string, audioUrl?: string, voiceConfig?: VoiceConfig): Promise<string | null> => {
    try {
      setPreviewingVoice(voiceId)
      
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
      
      return audioUrl  // 返回生成的音频URL
      
    } catch (error) {
      console.error('Voice preview error:', error)
      setError(`预览失败: ${error instanceof Error ? error.message : '未知错误'}`)
      return null  // 出错时返回null
    } finally {
      setPreviewingVoice(null)
    }
  }

  // 切换预览显示
  const togglePreview = (voiceId: string) => {
    setShowPreview(prev => ({
      ...prev,
      [voiceId]: !prev[voiceId]
    }))
  }

  // 格式化时长
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      {/* 角色选择 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">选择角色</label>
        <select
          value={selectedCharacter}
          onChange={(e) => setSelectedCharacter(e.target.value as 'moderator' | 'tom' | 'mark')}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isUploading}
        >
          <option value="moderator">主持人</option>
          <option value="tom">Tom (正方)</option>
          <option value="mark">Mark (反方)</option>
        </select>
      </div>

      {/* 音色名称 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">音色名称</label>
        <input
          type="text"
          value={voiceName}
          onChange={(e) => setVoiceName(e.target.value)}
          placeholder={`${selectedCharacter}的音色`}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isUploading}
        />
      </div>

      {/* 文件上传区域 */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6
          transition-colors duration-200
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        <div className="text-center">
          {isUploading ? (
            <div className="space-y-2">
              <FileAudio className="w-8 h-8 text-blue-500 mx-auto animate-pulse" />
              <p className="text-sm text-gray-600">上传中...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{Math.round(uploadProgress)}%</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-sm text-gray-600">
                拖拽音频文件到此处，或点击选择文件
              </p>
              <p className="text-xs text-gray-500">
                支持格式：{acceptedFormats.map(f => f.split('/')[1]).join(', ')} | 最大 {maxFileSize}MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 已上传的音色列表 */}
      {existingVoices.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">已配置的音色</h4>
          <div className="space-y-2">
            {existingVoices.map((voice) => (
              <div key={voice.id} className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-3">
                    <FileAudio className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{voice.name}</p>
                      <p className="text-xs text-gray-500">
                        {voice.character} | {formatFileSize(voice.fileSize)}
                        {voice.duration && ` | ${formatDuration(voice.duration)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <button
                      onClick={() => togglePreview(voice.id)}
                      className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                      title="预览音色"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onVoiceDelete(voice.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="删除音色"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* 音色预览 */}
                {showPreview[voice.id] && (
                  <div className="ml-3">
                    <VoicePreview
                      voiceConfig={voice}
                      onPreview={handleVoicePreview}
                      isPlaying={previewingVoice === voice.id}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}