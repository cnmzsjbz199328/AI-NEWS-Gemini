import { useRef, useCallback } from 'react'
import { Upload, FileAudio } from 'lucide-react'
import ProgressBar from '../ui/ProgressBar'
import { ACCEPTED_AUDIO_FORMATS, MAX_FILE_SIZE_MB } from '../ui/constants'

interface FileUploadAreaProps {
  onFileSelect: (file: File) => void
  isUploading: boolean
  uploadProgress: number
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  maxFileSize?: number
  acceptedFormats?: string[]
}

export default function FileUploadArea({
  onFileSelect,
  isUploading,
  uploadProgress,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  maxFileSize = MAX_FILE_SIZE_MB,
  acceptedFormats = ACCEPTED_AUDIO_FORMATS
}: FileUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileSelect(files[0])
    }
  }, [onFileSelect])

  const handleClick = useCallback(() => {
    if (!isUploading) {
      fileInputRef.current?.click()
    }
  }, [isUploading])

  return (
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
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={isUploading}
      />

      <div className="text-center">
        {isUploading ? (
          <div className="space-y-2">
            <FileAudio className="w-8 h-8 text-blue-500 mx-auto animate-pulse" />
            <p className="text-sm text-gray-600">上传中...</p>
            <ProgressBar 
              progress={uploadProgress} 
              showPercentage 
              className="max-w-xs mx-auto" 
            />
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
  )
}