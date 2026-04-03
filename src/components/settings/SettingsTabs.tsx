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
    <div className="flex border-b border-white/10 bg-white/5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => {
            onTabChange(tab.id)
            onUserInteraction()
          }}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'text-blue-300 border-b-2 border-blue-400 bg-white/10'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}