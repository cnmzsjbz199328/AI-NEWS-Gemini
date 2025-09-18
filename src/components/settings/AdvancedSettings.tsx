import Switch from '../ui/Switch'
import { VoiceStorageManager } from '../../storage/voice-storage'
import { formatStorageUsage } from '../ui/formatters'

interface AdvancedSettingsProps {
  showDebugInfo: boolean
  onUpdateSetting: (key: 'showDebugInfo', value: boolean) => void
}

export default function AdvancedSettings({
  showDebugInfo,
  onUpdateSetting
}: AdvancedSettingsProps) {
  const storageUsage = VoiceStorageManager.getStorageUsage()

  return (
    <div className="space-y-6">
      {/* 调试设置 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">调试选项</h3>
        <Switch
          checked={showDebugInfo}
          onChange={(checked) => onUpdateSetting('showDebugInfo', checked)}
          label="显示调试信息"
        />
      </div>

      {/* 存储信息 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">存储使用情况</h3>
        <div className="text-xs text-gray-500">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>已使用:</span>
              <span>{formatStorageUsage(storageUsage.used)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}