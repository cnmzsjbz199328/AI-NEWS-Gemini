import { useState } from 'react'
import { FileAudio, CheckCircle, Play, X } from 'lucide-react'
import { VoiceConfig } from '../../types/voice'
import { formatFileSize, formatDuration } from '../ui/formatters'
import VoicePreview from './VoicePreview'

interface VoiceCardProps {
  voice: VoiceConfig
  onDelete: (voiceId: string) => void
  onPreview: (voiceId: string, text: string, audioUrl?: string, voiceConfig?: VoiceConfig) => Promise<string | null>
  isPlaying: boolean
}

export default function VoiceCard({ 
  voice, 
  onDelete, 
  onPreview, 
  isPlaying 
}: VoiceCardProps) {
  const [showPreview, setShowPreview] = useState(false)

  const togglePreview = () => {
    setShowPreview(prev => !prev)
  }

  return (
    <div className="space-y-2">
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
            onClick={togglePreview}
            className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
            title="预览音色"
          >
            <Play className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(voice.id)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="删除音色"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* 音色预览 */}
      {showPreview && (
        <div className="ml-3">
          <VoicePreview
            voiceConfig={voice}
            onPreview={onPreview}
            isPlaying={isPlaying}
          />
        </div>
      )}
    </div>
  )
}