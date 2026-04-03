import { useState } from 'react'
import { Download, Play } from 'lucide-react'
import { VoiceConfig } from '../../types/voice'

interface PresetVoice {
  id: string
  name: string
  character: 'moderator' | 'tom' | 'mark'
  audioUrl: string
  description: string
}

// 预设音色数据
const PRESET_VOICES: PresetVoice[] = [
  {
    id: 'tom_default',
    name: 'Tom 男声',
    character: 'tom',
    audioUrl: 'https://pub-b436254f85684e9e95bebad4567b11ff.r2.dev/voice/Tom.m4a',
    description: '成熟稳重的男性声音，适合辩论场景'
  }
  // 可以添加更多预设音色
]

interface PresetVoicesProps {
  onSelectPreset: (voiceConfig: VoiceConfig) => void
  existingVoices: VoiceConfig[]
}

export default function PresetVoices({ onSelectPreset, existingVoices }: PresetVoicesProps) {
  const [downloading, setDownloading] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState<string | null>(null)

    const handleUse = async (preset: PresetVoice) => {
    // 检查是否已存在相同的预设音色
    const existing = existingVoices.find(v => v.id === `preset_${preset.id}_*` || v.name === preset.name)
    if (existing) {
      alert('该预设音色已存在')
      return
    }

    setDownloading(preset.id)
    try {
      // 通过API代理下载音频文件
      const response = await fetch(`/api/voice/preset?id=${preset.id}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const blob = await response.blob()
      const file = new File([blob], `${preset.name}.m4a`, { type: 'audio/m4a' })

      // 创建音色配置
      const voiceConfig: VoiceConfig = {
        id: `preset_${preset.id}_${Date.now()}`,
        name: preset.name,
        character: preset.character,
        audioFile: file,
        audioUrl: URL.createObjectURL(blob),
        isDefault: true,
        uploadedAt: new Date().toISOString(),
        fileSize: blob.size,
        duration: 0 // 可以后续获取
      }

      onSelectPreset(voiceConfig)
    } catch (error) {
      alert('下载预设音色失败，请重试')
    } finally {
      setDownloading(null)
    }
  }

  const handlePreview = async (preset: PresetVoice) => {
    setPreviewing(preset.id)
    try {
      const audio = new Audio(preset.audioUrl)
      audio.addEventListener('ended', () => setPreviewing(null))
      audio.addEventListener('error', () => setPreviewing(null))
      await audio.play()
    } catch (error) {
      setPreviewing(null)
    }
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">预设音色</h4>
      <div className="space-y-2">
        {PRESET_VOICES.map((preset) => {
          const isDownloading = downloading === preset.id
          const isPreviewing = previewing === preset.id
          const hasExistingVoice = existingVoices.some(v => v.character === preset.character)

          return (
            <div key={preset.id} className="p-3 border border-gray-200 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{preset.name}</p>
                  <p className="text-xs text-gray-500">{preset.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePreview(preset)}
                    disabled={isPreviewing}
                    className="p-1 text-blue-500 hover:text-blue-700 transition-colors disabled:opacity-50"
                    title="试听"
                  >
                    <Play className={`w-4 h-4 ${isPreviewing ? 'animate-pulse' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleUse(preset)}
                    disabled={isDownloading || hasExistingVoice}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={hasExistingVoice ? `${preset.character} 角色已有音色配置` : '使用此音色'}
                  >
                    <Download className="w-3 h-3" />
                    {isDownloading ? '下载中...' : '使用'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}