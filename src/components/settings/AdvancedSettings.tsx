import Switch from '../ui/Switch'
import { AppSettings } from './SettingsPanel'

interface AdvancedSettingsProps {
  showDebugInfo: boolean
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
}

export default function AdvancedSettings({ showDebugInfo, onUpdateSetting }: AdvancedSettingsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-200">调试选项</h3>
        <Switch
          checked={showDebugInfo}
          onChange={(checked) => onUpdateSetting('showDebugInfo', checked)}
          label="显示调试信息"
        />
        <p className="text-xs text-gray-500">开启后，生成过程中会在右上角显示任务详情。</p>
      </div>
    </div>
  )
}
