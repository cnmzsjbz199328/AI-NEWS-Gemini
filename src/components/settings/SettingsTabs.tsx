interface SettingsTabsProps {
  activeTab: 'general' | 'voice' | 'advanced'
  onTabChange: (tab: 'general' | 'voice' | 'advanced') => void
  onUserInteraction: () => void
}

export default function SettingsTabs({ 
  activeTab, 
  onTabChange, 
  onUserInteraction 
}: SettingsTabsProps) {
  const tabs = [
    { id: 'general' as const, label: '常规' },
    { id: 'voice' as const, label: '音色' },
    { id: 'advanced' as const, label: '高级' }
  ]

  return (
    <div className="flex border-b border-gray-200 bg-gray-50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => {
            onTabChange(tab.id)
            onUserInteraction()
          }}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}