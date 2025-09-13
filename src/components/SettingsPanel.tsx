'use client'

import { useState, useEffect } from 'react'
import { Settings, X, Volume2, VolumeX, Palette, Clock, Globe, Mic } from 'lucide-react'
import VoiceUpload from './VoiceUpload'
import { VoiceConfig } from '../types/voice'
import { VoiceStorageManager } from '../storage/voice-storage'

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
  useFallbackTTS: boolean
  showDebugInfo: boolean
  ttsService: 'indexTTS' | 'cosyVoice' | 'webSpeech'
}

export default function SettingsPanel({ 
  isVisible, 
  onToggle, 
  autoCollapse = true, 
  autoCollapseDelay = 5000 
}: SettingsPanelProps) {
  const [settings, setSettings] = useState<AppSettings>({
    audioEnabled: true,
    autoRotateNews: true,
    rotationInterval: 5,
    theme: 'auto',
    language: 'auto',
    debateSpeed: 'normal',
    useFallbackTTS: false,
    showDebugInfo: false,
    ttsService: 'indexTTS'
  })

  const [voices, setVoices] = useState<VoiceConfig[]>([])
  const [activeTab, setActiveTab] = useState<'general' | 'voice' | 'advanced'>('general')
  const [isUserInteracting, setIsUserInteracting] = useState(false)
  const [autoCollapseTimer, setAutoCollapseTimer] = useState<NodeJS.Timeout | null>(null)

  // 加载音色配置
  useEffect(() => {
    const loadedVoices = VoiceStorageManager.getVoiceConfigs()
    setVoices(loadedVoices)
  }, [])

  // 自动折叠逻辑
  useEffect(() => {
    if (!autoCollapse || !isVisible) {
      return
    }

    // 清除现有定时器
    if (autoCollapseTimer) {
      clearTimeout(autoCollapseTimer)
    }

    // 如果用户没有交互，设置新的定时器
    if (!isUserInteracting) {
      const timer = setTimeout(() => {
        onToggle()
      }, autoCollapseDelay)
      
      setAutoCollapseTimer(timer)
    }

    // 清理函数
    return () => {
      if (autoCollapseTimer) {
        clearTimeout(autoCollapseTimer)
      }
    }
  }, [isVisible, isUserInteracting, autoCollapse, autoCollapseDelay, onToggle])

  // 处理用户交互
  const handleUserInteraction = () => {
    setIsUserInteracting(true)
    
    // 清除现有定时器
    if (autoCollapseTimer) {
      clearTimeout(autoCollapseTimer)
      setAutoCollapseTimer(null)
    }

    // 2秒后重置交互状态，重新开始自动折叠倒计时
    setTimeout(() => {
      setIsUserInteracting(false)
    }, 2000)
  }

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
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                setActiveTab('general')
                handleUserInteraction()
              }}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'general'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              常规
            </button>
            <button
              onClick={() => {
                setActiveTab('voice')
                handleUserInteraction()
              }}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'voice'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              音色
            </button>
            <button
              onClick={() => {
                setActiveTab('advanced')
                handleUserInteraction()
              }}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'advanced'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              高级
            </button>
          </div>

          {/* 设置内容 */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* 音频设置 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    音频设置
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">启用音频</span>
                      <button
                        onClick={() => updateSetting('audioEnabled', !settings.audioEnabled)}
                        className={`
                          relative inline-flex h-6 w-11 items-center rounded-full
                          transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                          ${settings.audioEnabled ? 'bg-blue-600' : 'bg-gray-200'}
                        `}
                      >
                        <span
                          className={`
                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${settings.audioEnabled ? 'translate-x-6' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    </label>

                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">辩论速度</label>
                      <select
                        value={settings.debateSpeed}
                        onChange={(e) => updateSetting('debateSpeed', e.target.value as 'slow' | 'normal' | 'fast')}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="slow">慢速</option>
                        <option value="normal">正常</option>
                        <option value="fast">快速</option>
                      </select>
                    </div>
                  </div>
                </div>

            {/* 新闻设置 */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                新闻设置
              </h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">自动轮换新闻</span>
                  <button
                    onClick={() => updateSetting('autoRotateNews', !settings.autoRotateNews)}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full
                      transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      ${settings.autoRotateNews ? 'bg-blue-600' : 'bg-gray-200'}
                    `}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${settings.autoRotateNews ? 'translate-x-6' : 'translate-x-1'}
                      `}
                    />
                  </button>
                </label>

                {settings.autoRotateNews && (
                  <div className="space-y-2">
                    <label className="text-sm text-gray-600">轮换间隔 (秒)</label>
                    <input
                      type="range"
                      min="3"
                      max="10"
                      value={settings.rotationInterval}
                      onChange={(e) => updateSetting('rotationInterval', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>3秒</span>
                      <span className="font-medium">{settings.rotationInterval}秒</span>
                      <span>10秒</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 外观设置 */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                外观设置
              </h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">主题</label>
                  <select
                    value={settings.theme}
                    onChange={(e) => updateSetting('theme', e.target.value as 'light' | 'dark' | 'auto')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="auto">跟随系统</option>
                    <option value="light">浅色</option>
                    <option value="dark">深色</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 语言设置 */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                语言设置
              </h3>
              <div className="space-y-2">
                <select
                  value={settings.language}
                  onChange={(e) => updateSetting('language', e.target.value as 'en' | 'zh' | 'auto')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="auto">自动检测</option>
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
              </div>
            )}

            {activeTab === 'voice' && (
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
                    onVoiceUpload={handleVoiceUpload}
                    onVoiceDelete={handleVoiceDelete}
                    existingVoices={voices}
                  />
                </div>

                {/* TTS服务选择 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">TTS服务偏好</h3>
                  <select
                    value={settings.ttsService}
                    onChange={(e) => updateSetting('ttsService', e.target.value as 'indexTTS' | 'cosyVoice' | 'webSpeech')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="indexTTS">IndexTTS-2 (推荐)</option>
                    <option value="cosyVoice">CosyVoice</option>
                    <option value="webSpeech">Web Speech API</option>
                  </select>
                  <p className="text-xs text-gray-500">
                    系统会根据选择的服务优先级自动降级到可用的服务
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                {/* 调试设置 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">调试选项</h3>
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">显示调试信息</span>
                    <button
                      onClick={() => updateSetting('showDebugInfo', !settings.showDebugInfo)}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full
                        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        ${settings.showDebugInfo ? 'bg-blue-600' : 'bg-gray-200'}
                      `}
                    >
                      <span
                        className={`
                          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                          ${settings.showDebugInfo ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">使用备用语音合成</span>
                    <button
                      onClick={() => updateSetting('useFallbackTTS', !settings.useFallbackTTS)}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full
                        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        ${settings.useFallbackTTS ? 'bg-blue-600' : 'bg-gray-200'}
                      `}
                    >
                      <span
                        className={`
                          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                          ${settings.useFallbackTTS ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </label>
                </div>

                {/* 存储信息 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">存储使用情况</h3>
                  <div className="text-xs text-gray-500">
                    {(() => {
                      const usage = VoiceStorageManager.getStorageUsage()
                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>已使用:</span>
                            <span>{(usage.used / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(usage.percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 面板底部 */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                // 重置所有设置
                setSettings({
                  audioEnabled: true,
                  autoRotateNews: true,
                  rotationInterval: 5,
                  theme: 'auto',
                  language: 'auto',
                  debateSpeed: 'normal',
                  useFallbackTTS: false,
                  showDebugInfo: false,
                  ttsService: 'indexTTS'
                })
              }}
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