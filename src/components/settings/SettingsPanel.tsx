'use client'

import { useState, useEffect } from 'react'
import { Settings, X } from 'lucide-react'
import { VoiceConfig } from '../../types/voice'
import { VoiceStorageManager } from '../../storage/voice-storage'
import { getVoiceConfigManager, VoiceConfig as PresetVoiceConfig } from '../../lib/voice-config-manager'
import { useAutoCollapse } from '../../hooks/useAutoCollapse'
import SettingsTabs from './SettingsTabs'
import GeneralSettings from './GeneralSettings'
import VoiceSettings from './VoiceSettings'
import AdvancedSettings from './AdvancedSettings'

interface SettingsPanelProps {
  isVisible: boolean
  onToggle: () => void
  autoCollapse?: boolean
  autoCollapseDelay?: number
}

interface AppSettings {
  audioEnabled: boolean
  autoRotateNews: boolean
  rotationInterval: number
  theme: 'light' | 'dark' | 'auto'
  language: 'en' | 'zh' | 'auto'
  debateSpeed: 'slow' | 'normal' | 'fast'
  showDebugInfo: boolean
  ttsService: 'googleTTS'
}

const DEFAULT_SETTINGS: AppSettings = {
  audioEnabled: true,
  autoRotateNews: true,
  rotationInterval: 5,
  theme: 'auto',
  language: 'auto',
  debateSpeed: 'normal',
  showDebugInfo: false,
  ttsService: 'googleTTS'
}

export default function SettingsPanel({ 
  isVisible, 
  onToggle, 
  autoCollapse = true, 
  autoCollapseDelay = 5000 
}: SettingsPanelProps) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [voices, setVoices] = useState<VoiceConfig[]>([])
  const [presetVoices, setPresetVoices] = useState<PresetVoiceConfig[]>([])
  const [activeTab, setActiveTab] = useState<'general' | 'voice' | 'advanced'>('general')

  const { handleUserInteraction } = useAutoCollapse({
    isVisible,
    autoCollapse,
    autoCollapseDelay,
    onCollapse: onToggle
  })

  // 初始化音色数据
  useEffect(() => {
    // 加载用户上传的音色
    const userVoices = VoiceStorageManager.getVoiceConfigs()
    setVoices(userVoices)
    
    // 加载预设音色
    const voiceManager = getVoiceConfigManager()
    const presets = voiceManager.getAllPresetVoices()
    setPresetVoices(presets)
    
    console.log('Loaded preset voices:', presets)
    console.log('Loaded user voices:', userVoices)
  }, [])

  // 合并预设音色和用户音色供组件使用
  const allVoices: VoiceConfig[] = [
    // 将预设音色转换为VoiceConfig格式
    ...presetVoices.map(preset => ({
      id: preset.id,
      name: preset.name,
      description: preset.description,
      character: 'moderator' as const, // 预设音色可以被任何角色使用
      gender: preset.gender as 'male' | 'female',
      language: preset.language,
      audioUrl: preset.url,
      isDefault: true,
      uploadedAt: new Date().toISOString(),
      fileSize: 0,
    })),
    // 用户上传的音色
    ...voices
  ]

  // 更新设置
  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // 音色上传处理
  const handleVoiceUpload = (voiceConfig: VoiceConfig) => {
    const success = VoiceStorageManager.saveVoiceConfig(voiceConfig)
    if (success) {
      setVoices(prev => [...prev.filter(v => v.character !== voiceConfig.character), voiceConfig])
    }
  }

  // 音色删除处理
  const handleVoiceDelete = (voiceId: string) => {
    const success = VoiceStorageManager.deleteVoiceConfig(voiceId)
    if (success) {
      setVoices(prev => prev.filter(v => v.id !== voiceId))
    }
  }

  // 重置设置
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
  }

  return (
    <div className="flex">
      {/* 设置面板 */}
      <div
        className={`
          flex-shrink-0
          overflow-hidden
          transition-all
          duration-500
          ease-in-out
          bg-white
          border-r
          border-gray-200
          shadow-lg
          ${isVisible ? 'w-80' : 'w-0'}
        `}
        onMouseEnter={handleUserInteraction}
        onMouseMove={handleUserInteraction}
        onClick={handleUserInteraction}
        onKeyDown={handleUserInteraction}
      >
        <div className="w-80 h-full flex flex-col">
          {/* 面板头部 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              设置
            </h2>
            <button
              onClick={onToggle}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* 标签页导航 */}
          <SettingsTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onUserInteraction={handleUserInteraction}
          />

          {/* 设置内容 */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'general' && (
              <GeneralSettings
                settings={{
                  audioEnabled: settings.audioEnabled,
                  autoRotateNews: settings.autoRotateNews,
                  rotationInterval: settings.rotationInterval,
                  theme: settings.theme,
                  language: settings.language,
                  debateSpeed: settings.debateSpeed
                }}
                onUpdateSetting={(key, value) => updateSetting(key as keyof AppSettings, value as any)}
              />
            )}

            {activeTab === 'voice' && (
              <VoiceSettings
                ttsService={settings.ttsService}
                onTtsServiceChange={(service) => updateSetting('ttsService', service)}
                voices={allVoices}
                onVoiceUpload={handleVoiceUpload}
                onVoiceDelete={handleVoiceDelete}
              />
            )}

            {activeTab === 'advanced' && (
              <AdvancedSettings
                showDebugInfo={settings.showDebugInfo}
                onUpdateSetting={updateSetting}
              />
            )}
          </div>

          {/* 面板底部 */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={resetSettings}
              className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
            >
              重置为默认设置
            </button>
          </div>
        </div>
      </div>

      {/* 设置按钮 - 当面板隐藏时显示 */}
      {!isVisible && (
        <button
          onClick={onToggle}
          className="
            fixed top-4 left-4 z-50
            p-3 bg-white border border-gray-200 rounded-full shadow-lg
            hover:bg-gray-50 hover:shadow-xl
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
          title="打开设置"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      )}
    </div>
  )
}