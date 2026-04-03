'use client'

import { useState, useEffect } from 'react'
import { Settings, X } from 'lucide-react'
import { VoiceConfig } from '../../types'
import { SupportedLanguage } from '../../types'
import { useAutoCollapse } from '../../hooks/useAutoCollapse'
import { DEFAULT_TTS_VOICE_CONFIG } from '../ui/constants'
import SettingsTabs from './SettingsTabs'
import GeneralSettings from './GeneralSettings'
import VoiceSettings from './VoiceSettings'
import AdvancedSettings from './AdvancedSettings'

const SETTINGS_STORAGE_KEY = 'ai-news-app-settings'

export interface AppSettings {
  audioEnabled: boolean
  autoRotateNews: boolean
  rotationInterval: number
  language: 'en' | 'zh' | 'auto'
  debateSpeed: 'slow' | 'normal' | 'fast'
  showDebugInfo: boolean
  ttsVoiceConfig: VoiceConfig
}

const DEFAULT_SETTINGS: AppSettings = {
  audioEnabled: true,
  autoRotateNews: true,
  rotationInterval: 5,
  language: 'auto',
  debateSpeed: 'normal',
  showDebugInfo: false,
  ttsVoiceConfig: DEFAULT_TTS_VOICE_CONFIG,
}

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!stored) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

// Resolved language mapped to SupportedLanguage for the pipeline
export function resolveLanguage(lang: 'en' | 'zh' | 'auto'): SupportedLanguage {
  if (lang === 'zh') return 'zh-CN'
  return 'en-US'
}

interface SettingsPanelProps {
  isVisible: boolean
  onToggle: () => void
  autoCollapse?: boolean
  autoCollapseDelay?: number
  onSettingsChange?: (settings: AppSettings) => void
}

export default function SettingsPanel({
  isVisible,
  onToggle,
  autoCollapse = true,
  autoCollapseDelay = 5000,
  onSettingsChange,
}: SettingsPanelProps) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [activeTab, setActiveTab] = useState<'general' | 'voice' | 'advanced'>('general')

  const { handleUserInteraction } = useAutoCollapse({
    isVisible,
    autoCollapse,
    autoCollapseDelay,
    onCollapse: onToggle
  })

  // 初始化：从 localStorage 加载设置
  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  // 持久化 + 通知父组件
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    }
    onSettingsChange?.(settings)
  }, [settings, onSettingsChange])

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

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
          bg-gray-900/95
          backdrop-blur-xl
          border-r
          border-white/10
          shadow-2xl
          ${isVisible ? 'w-80' : 'w-0'}
        `}
        onMouseEnter={handleUserInteraction}
        onMouseMove={handleUserInteraction}
        onClick={handleUserInteraction}
        onKeyDown={handleUserInteraction}
      >
        <div className="w-80 h-full flex flex-col">
          {/* 面板头部 */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              设置
            </h2>
            <button
              onClick={onToggle}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
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
                  language: settings.language,
                  debateSpeed: settings.debateSpeed,
                }}
                onUpdateSetting={(key, value) => updateSetting(key as keyof AppSettings, value as AppSettings[keyof AppSettings])}
              />
            )}

            {activeTab === 'voice' && (
              <VoiceSettings
                ttsVoiceConfig={settings.ttsVoiceConfig}
                onTtsVoiceConfigChange={(config) => updateSetting('ttsVoiceConfig', config)}
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
          <div className="p-4 border-t border-white/10">
            <button
              onClick={resetSettings}
              className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
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
            p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg
            hover:bg-white/20 hover:shadow-xl
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-white/40
          "
          title="打开设置"
        >
          <Settings className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  )
}
