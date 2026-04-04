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
    <>
      {/* Settings toggle button — always visible in top-left */}
      <button
        onClick={onToggle}
        className="
          fixed top-4 left-4 z-[210]
          p-2.5 bg-white/8 backdrop-blur-md border border-white/15 rounded-full shadow-lg
          hover:bg-white/15 hover:shadow-xl
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-white/30
        "
        title="Settings"
      >
        <Settings className="w-4 h-4 text-white/70" />
      </button>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[199] bg-black/50 backdrop-blur-sm transition-opacity duration-400"
        style={{ opacity: isVisible ? 1 : 0, pointerEvents: isVisible ? 'auto' : 'none' }}
        onClick={onToggle}
      />

      {/* Drawer */}
      <aside
        className="fixed top-0 left-0 h-full w-80 z-[200] flex flex-col bg-[#0d0a12]/97 backdrop-blur-2xl border-r border-white/10 shadow-2xl"
        style={{
          transform: isVisible ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.5s cubic-bezier(.4,0,.2,1)',
        }}
        onMouseEnter={handleUserInteraction}
        onMouseMove={handleUserInteraction}
        onClick={handleUserInteraction}
        onKeyDown={handleUserInteraction}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <h2 className="font-headline text-sm font-semibold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            Settings
          </h2>
          <button
            onClick={onToggle}
            className="text-slate-500 hover:text-white transition-colors p-1 rounded-full hover:bg-white/8"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <SettingsTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onUserInteraction={handleUserInteraction}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
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

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 shrink-0">
          <button
            onClick={resetSettings}
            className="w-full py-2 text-[10px] text-slate-600 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-body font-bold uppercase tracking-widest"
          >
            Reset to Defaults
          </button>
        </div>
      </aside>
    </>
  )
}
