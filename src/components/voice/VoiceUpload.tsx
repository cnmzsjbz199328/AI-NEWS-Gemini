'use client'

import { useState, useCallback } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { VoiceConfig, VoiceUploadProps } from '../../types/voice'
import { CHARACTER_LABELS } from '../ui/constants'
import { useFileUpload } from '../../hooks/useFileUpload'
import { useVoicePreview } from '../../hooks/useVoicePreview'
import Select from '../ui/Select'
import FileUploadArea from './FileUploadArea'
import VoiceList from './VoiceList'
import PresetVoices from './PresetVoices'

export default function VoiceUpload({
  onVoiceUpload,
  onVoiceDelete,
  existingVoices,
  maxFileSize,
  acceptedFormats
}: VoiceUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<'moderator' | 'tom' | 'mark'>('moderator')
  const [voiceName, setVoiceName] = useState('')

  const {
    isUploading,
    uploadProgress,
    error: uploadError,
    handleFileUpload,
    clearError: clearUploadError
  } = useFileUpload({
    onUploadSuccess: (voiceConfig) => {
      onVoiceUpload(voiceConfig)
      setVoiceName('')
    },
    existingVoices,
    maxFileSize,
    acceptedFormats
  })

  const {
    previewingVoice,
    error: previewError,
    handleVoicePreview,
    clearError: clearPreviewError
  } = useVoicePreview()

  const error = uploadError || previewError
  const clearError = () => {
    clearUploadError()
    clearPreviewError()
  }

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
      handleFileUpload(files[0], selectedCharacter, voiceName)
    }
  }, [handleFileUpload, selectedCharacter, voiceName])

  // 文件选择处理
  const handleFileSelect = useCallback((file: File) => {
    handleFileUpload(file, selectedCharacter, voiceName)
  }, [handleFileUpload, selectedCharacter, voiceName])

  // 预设音色选择处理
  const handlePresetSelect = (voiceConfig: VoiceConfig) => {
    onVoiceUpload(voiceConfig)
  }

  const characterOptions = Object.entries(CHARACTER_LABELS).map(([value, label]) => ({ value, label }))

  return (
    <div className="space-y-4">
      {/* 预设音色选择 */}
      <PresetVoices 
        onSelectPreset={handlePresetSelect}
        existingVoices={existingVoices}
      />

      {/* 自定义音色上传 */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">自定义音色上传</h4>
        
        {/* 角色选择 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">选择角色</label>
          <Select
            value={selectedCharacter}
            onChange={(value) => setSelectedCharacter(value as 'moderator' | 'tom' | 'mark')}
            options={characterOptions}
            disabled={isUploading}
          />
        </div>

        {/* 音色名称 */}
        <div className="space-y-2 mt-3">
          <label className="text-sm font-medium text-gray-700">音色名称</label>
          <input
            type="text"
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            placeholder={`${CHARACTER_LABELS[selectedCharacter]}的音色`}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isUploading}
          />
        </div>

        {/* 文件上传区域 */}
        <div className="mt-3">
          <FileUploadArea
            onFileSelect={handleFileSelect}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            isDragOver={isDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            maxFileSize={maxFileSize}
            acceptedFormats={acceptedFormats}
          />
        </div>
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={clearError}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 已上传的音色列表 */}
      <VoiceList
        voices={existingVoices}
        onVoiceDelete={onVoiceDelete}
        onVoicePreview={handleVoicePreview}
        previewingVoice={previewingVoice}
      />
    </div>
  )
}