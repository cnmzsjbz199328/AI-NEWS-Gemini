import { VoiceConfig } from '../../types/voice'
import VoiceCard from './VoiceCard'

interface VoiceListProps {
  voices: VoiceConfig[]
  onVoiceDelete: (voiceId: string) => void
  onVoicePreview: (voiceId: string, text: string, audioUrl?: string, voiceConfig?: VoiceConfig) => Promise<void>
  previewingVoice: string | null
}

export default function VoiceList({ 
  voices, 
  onVoiceDelete, 
  onVoicePreview, 
  previewingVoice 
}: VoiceListProps) {
  if (voices.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">已配置的音色</h4>
      <div className="space-y-2">
        {voices.map((voice) => (
          <VoiceCard
            key={voice.id}
            voice={voice}
            onDelete={onVoiceDelete}
            onPreview={onVoicePreview}
            isPlaying={previewingVoice === voice.id}
          />
        ))}
      </div>
    </div>
  )
}