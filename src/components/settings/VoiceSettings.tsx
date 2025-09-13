import { Mic } from 'lucide-react'
import Select from '../ui/Select'
import VoiceUpload from '../voice/VoiceUpload'
import { VoiceConfig } from '../../types/voice'
import { TTS_SERVICE_OPTIONS } from '../ui/constants'

interface VoiceSettingsProps {
  ttsService: 'indexTTS' | 'cosyVoice' | 'webSpeech'
  onTtsServiceChange: (service: 'indexTTS' | 'cosyVoice' | 'webSpeech') => void
  voices: VoiceConfig[]
  onVoiceUpload: (voiceConfig: VoiceConfig) => void
  onVoiceDelete: (voiceId: string) => void
}

export default function VoiceSettings({
  ttsService,
  onTtsServiceChange,
  voices,
  onVoiceUpload,
  onVoiceDelete
}: VoiceSettingsProps) {
  const ttsServiceOptions = Object.entries(TTS_SERVICE_OPTIONS).map(([value, label]) => ({ value, label }))

  return (
    <div className="space-y-6">
      {/* 音色克隆设置 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Mic className="w-4 h-4" />
          音色克隆配置
        </h3>
        <p className="text-xs text-gray-500">
          为每个角色上传音频文件来定制他们的声音。支持 WAV、MP3、OGG 等格式。
        </p>
        
        <VoiceUpload
          onVoiceUpload={onVoiceUpload}
          onVoiceDelete={onVoiceDelete}
          existingVoices={voices}
        />
      </div>

      {/* TTS服务选择 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">TTS服务偏好</h3>
        <Select
          value={ttsService}
          onChange={(value) => onTtsServiceChange(value as 'indexTTS' | 'cosyVoice' | 'webSpeech')}
          options={ttsServiceOptions}
        />
        <p className="text-xs text-gray-500">
          系统会根据选择的服务优先级自动降级到可用的服务
        </p>
      </div>
    </div>
  )
}