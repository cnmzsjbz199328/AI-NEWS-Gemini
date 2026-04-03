import { Volume2, Clock, Palette, Globe } from 'lucide-react'
import Switch from '../ui/Switch'
import Select from '../ui/Select'
import Slider from '../ui/Slider'
import { 
  THEME_OPTIONS, 
  LANGUAGE_OPTIONS, 
  DEBATE_SPEED_OPTIONS 
} from '../ui/constants'

interface GeneralAppSettings {
  audioEnabled: boolean
  autoRotateNews: boolean
  rotationInterval: number
  theme: 'light' | 'dark' | 'auto'
  language: 'en' | 'zh' | 'auto'
  debateSpeed: 'slow' | 'normal' | 'fast'
}

interface GeneralSettingsProps {
  settings: GeneralAppSettings
  onUpdateSetting: <K extends keyof GeneralAppSettings>(key: K, value: GeneralAppSettings[K]) => void
}

export default function GeneralSettings({ settings, onUpdateSetting }: GeneralSettingsProps) {
  const themeOptions = Object.entries(THEME_OPTIONS).map(([value, label]) => ({ value, label }))
  const languageOptions = Object.entries(LANGUAGE_OPTIONS).map(([value, label]) => ({ value, label }))
  const debateSpeedOptions = Object.entries(DEBATE_SPEED_OPTIONS).map(([value, label]) => ({ value, label }))

  return (
    <div className="space-y-6">
      {/* 音频设置 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          音频设置
        </h3>
        <div className="space-y-3">
          <Switch
            checked={settings.audioEnabled}
            onChange={(checked) => onUpdateSetting('audioEnabled', checked)}
            label="启用音频"
          />

          <div className="space-y-2">
            <label className="text-sm text-gray-400">辩论速度</label>
            <Select
              value={settings.debateSpeed}
              onChange={(value) => onUpdateSetting('debateSpeed', value as 'slow' | 'normal' | 'fast')}
              options={debateSpeedOptions}
            />
          </div>
        </div>
      </div>

      {/* 新闻设置 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          新闻设置
        </h3>
        <div className="space-y-3">
          <Switch
            checked={settings.autoRotateNews}
            onChange={(checked) => onUpdateSetting('autoRotateNews', checked)}
            label="自动轮换新闻"
          />

          {settings.autoRotateNews && (
            <div className="space-y-2">
              <label className="text-sm text-gray-400">轮换间隔</label>
              <Slider
                value={settings.rotationInterval}
                onChange={(value) => onUpdateSetting('rotationInterval', value)}
                min={3}
                max={10}
                unit="秒"
              />
            </div>
          )}
        </div>
      </div>

      {/* 外观设置 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          外观设置
        </h3>
        <div className="space-y-2">
          <label className="text-sm text-gray-400">主题</label>
          <Select
            value={settings.theme}
            onChange={(value) => onUpdateSetting('theme', value as 'light' | 'dark' | 'auto')}
            options={themeOptions}
          />
        </div>
      </div>

      {/* 语言设置 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          语言设置
        </h3>
        <Select
          value={settings.language}
          onChange={(value) => onUpdateSetting('language', value as 'en' | 'zh' | 'auto')}
          options={languageOptions}
        />
      </div>
    </div>
  )
}