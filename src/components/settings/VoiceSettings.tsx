import { useState, useEffect } from 'react'
import { Mic, Play, Pause, Upload } from 'lucide-react'
import Select from '../ui/Select'
import Button from '../ui/Button'
import VoiceUpload from '../voice/VoiceUpload'
import { VoiceConfig } from '../../types/voice'
import { Speaker } from '@/types'
import { TTS_SERVICE_OPTIONS } from '../ui/constants'
import { getVoiceConfigManager, PresetVoiceId } from '../../lib/voice-config-manager'

// 角色显示配置
const ROLE_DISPLAY = {
  moderator: { 
    name: '主持人', 
    icon: Mic,
    color: 'bg-blue-100 text-blue-700'
  },
  tom: { 
    name: 'Tom', 
    icon: () => <span>👨</span>,
    color: 'bg-green-100 text-green-700'
  },
  mark: { 
    name: 'Mark', 
    icon: () => <span>👨‍💼</span>,
    color: 'bg-purple-100 text-purple-700'
  }
} as const

// 角色音色选择组件
interface RoleVoiceSelectorProps {
  role: Speaker
  currentVoice: VoiceConfig | undefined
  availableVoices: VoiceConfig[]
  onVoiceChange: (role: Speaker, voiceId: string) => void
  onVoicePreview: (voiceId: string) => void
  isPlaying: string | null
}

const RoleVoiceSelector: React.FC<RoleVoiceSelectorProps> = ({
  role,
  currentVoice,
  availableVoices,
  onVoiceChange,
  onVoicePreview,
  isPlaying
}) => {
  const roleInfo = ROLE_DISPLAY[role]
  const RoleIcon = roleInfo.icon
  
  // 为每个音色添加性别标识，如果没有gender字段则显示为未知
  const voiceOptions = availableVoices.map(voice => ({
    value: voice.id,
    label: `${voice.name}${voice.gender ? ` (${voice.gender === 'male' ? '男性' : '女性'})` : ''}`
  }))

  // 如果没有可用音色，显示占位选项
  if (voiceOptions.length === 0) {
    voiceOptions.push({ value: '', label: '暂无可用音色' })
  }

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${roleInfo.color}`}>
          <RoleIcon className="w-4 h-4" />
        </div>
        <span className="font-medium text-gray-900">{roleInfo.name}</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <Select
          value={currentVoice?.id || ''}
          onChange={(voiceId) => onVoiceChange(role, voiceId)}
          options={voiceOptions}
          placeholder="选择音色"
          className="min-w-[140px]"
          disabled={availableVoices.length === 0}
        />
        
        {/* 预览按钮 - 只在选择了音色时显示 */}
        {currentVoice && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onVoicePreview(currentVoice.id)}
            className="p-2"
            disabled={!currentVoice.id || availableVoices.length === 0}
          >
            {isPlaying === currentVoice.id ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

// 文件上传区域组件
interface FileUploadAreaProps {
  onFileUpload: (file: File) => void
  disabled?: boolean
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({ onFileUpload, disabled = false }) => {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return
    
    const files = Array.from(e.dataTransfer.files)
    const audioFile = files.find(file => file.type.startsWith('audio/'))
    
    if (audioFile) {
      onFileUpload(audioFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileUpload(file)
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragOver
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && document.getElementById('audioFileInput')?.click()}
    >
      <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
        <Upload className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-900">拖拽音频文件到此处，或点击选择文件</p>
      <p className="text-xs text-gray-500 mt-1">支持格式：wav, mp3, ogg, m4a, aac | 最大10MB</p>
      
      <input
        id="audioFileInput"
        type="file"
        accept="audio/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </div>
  )
}

interface VoiceSettingsProps {
  ttsService: 'googleTTS'
  onTtsServiceChange: (service: 'googleTTS') => void
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
  const [selectedRole, setSelectedRole] = useState<Speaker>('moderator')
  const [customVoiceName, setCustomVoiceName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [voiceManager, setVoiceManager] = useState(getVoiceConfigManager())

  const ttsServiceOptions = Object.entries(TTS_SERVICE_OPTIONS).map(([value, label]) => ({ value, label }))

  // 获取当前角色音色映射
  const currentMapping = voiceManager.getCurrentMapping()
  
  // 为每个角色创建音色映射
  const voiceMapping: Record<Speaker, VoiceConfig | undefined> = {
    moderator: voices.find(v => v.id === currentMapping.moderator),
    tom: voices.find(v => v.id === currentMapping.tom),
    mark: voices.find(v => v.id === currentMapping.mark)
  }

  // 处理音色更改
  const handleVoiceChange = (role: Speaker, voiceId: string) => {
    try {
      // 如果选择的是预设音色，直接使用ID
      if (voices.find(v => v.id === voiceId && v.isDefault)) {
        voiceManager.setVoiceForRole(role, voiceId as PresetVoiceId)
      } else {
        // Custom voice not yet supported
      }
    } catch (error) {
      console.error('Failed to update voice mapping:', error)
    }
  }

  // 预览音色
  const handleVoicePreview = async (voiceId: string) => {
    if (isPlaying === voiceId) {
      // 如果正在播放同一个音色，则停止播放
      setIsPlaying(null)
      return
    }

    try {
      setIsPlaying(voiceId)

      // 查找音色配置
      const voice = voices.find(v => v.id === voiceId)
      if (voice && voice.audioUrl) {
        // 创建音频元素并播放预览
        const audio = new Audio(voice.audioUrl)
        audio.onended = () => setIsPlaying(null)
        audio.onerror = () => {
          setIsPlaying(null)
          console.error('Failed to play voice preview')
        }
        
        await audio.play()
      } else {
        console.warn(`Voice URL not found for voice: ${voiceId}`)
        setIsPlaying(null)
      }
    } catch (error) {
      console.error('Failed to preview voice:', error)
      setIsPlaying(null)
    }
  }

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    if (!customVoiceName.trim()) {
      alert('请先输入音色名称')
      return
    }

    try {
      setIsUploading(true)
      
      // 创建VoiceConfig对象
      const voiceConfig: VoiceConfig = {
        id: `custom_${Date.now()}`,
        name: customVoiceName,
        description: `${ROLE_DISPLAY[selectedRole].name}的自定义音色`,
        character: selectedRole,
        gender: 'male', // 默认值，实际应该从文件分析
        language: 'zh',
        fileSize: file.size,
        audioUrl: URL.createObjectURL(file),
        isDefault: false,
        uploadedAt: new Date().toISOString()
      }
      
      // 调用上传回调
      onVoiceUpload(voiceConfig)
      
      // 重置表单
      setCustomVoiceName('')
      alert('音色上传成功！')
      
    } catch (error) {
      console.error('Upload error:', error)
      alert('上传失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  // 获取第一个可用音色作为预设音色
  const presetVoice = voices[0]

  return (
    <div className="space-y-6">
      {/* 说明文字 */}
      <div className="text-sm text-gray-600">
        为每个角色配置专属的声音。选择音色后可点击预览按钮试听效果。
      </div>

      {/* 角色音色选择 */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">角色音色配置</h4>
        {(Object.keys(ROLE_DISPLAY) as Speaker[]).map((role) => (
          <RoleVoiceSelector
            key={role}
            role={role}
            currentVoice={voiceMapping[role]}
            availableVoices={voices}
            onVoiceChange={handleVoiceChange}
            onVoicePreview={handleVoicePreview}
            isPlaying={isPlaying}
          />
        ))}
      </div>

      {/* 自定义音色上传 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">自定义音色上传</h4>
        
        {/* 选择角色 */}
        <div>
          <label className="block text-sm text-gray-700 mb-2">选择角色</label>
          <Select
            value={selectedRole}
            onChange={(role) => setSelectedRole(role as Speaker)}
            options={[
              { value: 'moderator', label: '主持人' },
              { value: 'tom', label: 'Tom' },
              { value: 'mark', label: 'Mark' }
            ]}
            placeholder="选择要配置的角色"
          />
        </div>

        {/* 音色名称 */}
        <div>
          <label className="block text-sm text-gray-700 mb-2">音色名称</label>
          <input
            type="text"
            value={customVoiceName}
            onChange={(e) => setCustomVoiceName(e.target.value)}
            placeholder={`${ROLE_DISPLAY[selectedRole].name}的音色`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 文件上传区 */}
        <FileUploadArea
          onFileUpload={handleFileUpload}
          disabled={isUploading}
        />
      </div>

      {/* TTS服务选择 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">TTS服务偏好</h3>
        <Select
          value={ttsService}
          onChange={(value) => onTtsServiceChange(value as 'googleTTS')}
          options={ttsServiceOptions}
        />
        <p className="text-xs text-gray-500">
          系统会根据选择的服务优先级自动降级到可用的服务
        </p>
      </div>
    </div>
  )
}