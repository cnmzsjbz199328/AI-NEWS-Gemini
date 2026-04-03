import { Mic } from 'lucide-react'
import Select from '../ui/Select'
import { VoiceConfig } from '../../types'
import { Speaker } from '@/types'
import { GOOGLE_TTS_VOICES } from '../ui/constants'

const ROLE_DISPLAY: Record<Speaker, { name: string; color: string }> = {
  moderator: { name: '主持人', color: 'bg-blue-900/40 text-blue-300' },
  tom:       { name: 'Tom',   color: 'bg-green-900/40 text-green-300' },
  mark:      { name: 'Mark',  color: 'bg-purple-900/40 text-purple-300' },
}

const voiceSelectOptions = GOOGLE_TTS_VOICES.map(v => ({ value: v.value, label: v.label }))

interface RoleVoiceConfigProps {
  role: Speaker
  config: VoiceConfig[Speaker]
  onChange: (updated: VoiceConfig[Speaker]) => void
}

function RoleVoiceConfig({ role, config, onChange }: RoleVoiceConfigProps) {
  const roleInfo = ROLE_DISPLAY[role]

  return (
    <div className="space-y-3 p-3 bg-gray-800/50 rounded-lg border border-white/5">
      <div className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-medium ${roleInfo.color}`}>
        <Mic className="w-3 h-3" />
        {roleInfo.name}
      </div>

      {/* 语音名称 */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400">语音</label>
        <Select
          value={config.voiceId}
          onChange={(voiceId) => {
            const matched = GOOGLE_TTS_VOICES.find(v => v.value === voiceId)
            onChange({ ...config, voiceId, ssmlGender: matched?.gender ?? config.ssmlGender })
          }}
          options={voiceSelectOptions}
        />
      </div>

      {/* 语速 */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>语速</span>
          <span className="text-gray-300">{config.speed?.toFixed(2) ?? '1.00'}x</span>
        </div>
        <input
          type="range"
          min={0.25}
          max={4.0}
          step={0.05}
          value={config.speed ?? 1.0}
          onChange={(e) => onChange({ ...config, speed: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0.25x</span>
          <span>4.0x</span>
        </div>
      </div>

      {/* 音调 */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>音调</span>
          <span className="text-gray-300">{(config.pitch ?? 0) >= 0 ? '+' : ''}{config.pitch?.toFixed(1) ?? '0.0'}</span>
        </div>
        <input
          type="range"
          min={-20}
          max={20}
          step={0.5}
          value={config.pitch ?? 0}
          onChange={(e) => onChange({ ...config, pitch: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>-20</span>
          <span>+20</span>
        </div>
      </div>
    </div>
  )
}

interface VoiceSettingsProps {
  ttsVoiceConfig: VoiceConfig
  onTtsVoiceConfigChange: (config: VoiceConfig) => void
}

export default function VoiceSettings({ ttsVoiceConfig, onTtsVoiceConfigChange }: VoiceSettingsProps) {
  const updateRoleConfig = (role: Speaker, updated: VoiceConfig[Speaker]) => {
    onTtsVoiceConfigChange({ ...ttsVoiceConfig, [role]: updated })
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">
        配置 Google Cloud TTS 语音参数。更改将在下次生成时生效。
      </p>

      {(Object.keys(ROLE_DISPLAY) as Speaker[]).map((role) => (
        <RoleVoiceConfig
          key={role}
          role={role}
          config={ttsVoiceConfig[role]}
          onChange={(updated) => updateRoleConfig(role, updated)}
        />
      ))}
    </div>
  )
}
