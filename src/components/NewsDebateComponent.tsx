'use client'

import React from 'react'
import { AppState, Speaker } from '@/types'

interface NewsDebateComponentProps {
  appState: AppState
  onStartDebate: () => void
  onNextNews: () => void
  onClearConversation: () => void
  onRefreshNews: () => void
}

export function NewsDebateComponent({
  appState,
  onStartDebate,
  onNextNews,
  onClearConversation,
  onRefreshNews
}: NewsDebateComponentProps) {
  const currentNews = appState.newsItems[appState.currentNewsIndex]

  const getSpeakerImage = (speaker: string) => {
    // 检查是否有角色状态信息
    if (appState.speakersState && appState.speakersState[speaker as Speaker]) {
      const speakerState = appState.speakersState[speaker as Speaker]
      
      // 根据动画状态选择图片
      const isAnimated = speakerState.animationState === 'thinking' || 
                        speakerState.animationState === 'speaking'
      
      if (isAnimated) {
        // 显示动态GIF
        const gifMap: { [key: string]: string } = {
          'moderator': '/Senior Moderator.gif',
          'tom': '/Tom.gif',
          'mark': '/Mark.gif'
        }
        return gifMap[speaker] || '/Senior Moderator.gif'
      } else {
        // 显示静态图片
        const staticMap: { [key: string]: string } = {
          'moderator': '/Senior Moderator-static.png',
          'tom': '/Tom-static.png',
          'mark': '/Mark-static.png'
        }
        return staticMap[speaker] || '/Senior Moderator.gif' // 备用到GIF
      }
    }
    
    // 备用逻辑：使用GIF
    const imageMap: { [key: string]: string } = {
      'moderator': '/Senior Moderator.gif',
      'tom': '/Tom.gif',
      'mark': '/Mark.gif'
    }
    return imageMap[speaker] || '/Senior Moderator.gif'
  }

  const getSpeakerStyle = (speaker: string) => {
    const styles: { [key: string]: string } = {
      'moderator': 'border-yellow-400 bg-yellow-50',
      'tom': 'border-blue-400 bg-blue-50',
      'mark': 'border-green-400 bg-green-50'
    }
    return styles[speaker] || 'border-gray-400 bg-gray-50'
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 新闻标题区域 */}
      {currentNews && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">{currentNews.title}</h1>
          <p className="text-gray-200 mb-4">{currentNews.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">{currentNews.date}</span>
            {currentNews.thumbnailUrl && (
              <img 
                src={currentNews.thumbnailUrl} 
                alt="News thumbnail"
                className="w-16 h-16 object-cover rounded"
              />
            )}
          </div>
        </div>
      )}

      {/* 控制按钮 */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={onStartDebate}
          disabled={appState.isDebating || !currentNews}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            appState.isDebating || !currentNews
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          {appState.isDebating ? 'Debating...' : 'Start Debate'}
        </button>
        
        <button
          onClick={onNextNews}
          disabled={appState.isDebating}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white rounded-lg font-semibold transition-colors"
        >
          Next News
        </button>
        
        <button
          onClick={onRefreshNews}
          disabled={appState.isDebating}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 text-white rounded-lg font-semibold transition-colors"
        >
          Refresh News
        </button>
        
        <button
          onClick={onClearConversation}
          disabled={appState.isDebating}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white rounded-lg font-semibold transition-colors"
        >
          Clear Conversation
        </button>
      </div>

      {/* 对话显示区域 */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 min-h-[400px] max-h-[600px] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">Live Debate</h2>
        
        {/* 当前发言人区域 */}
        {appState.conversation.length > 0 && (() => {
          // 找到当前正在播放或最新的发言
          const currentEntry = appState.conversation[appState.conversation.length - 1]
          const currentSpeaker = currentEntry.speaker as Speaker
          const isCurrentSpeaking = appState.speakersState[currentSpeaker]?.animationState === 'speaking'
          
          return (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Current Speaker</h3>
              <div className={`flex items-start space-x-4 p-4 rounded-lg border-l-4 ${getSpeakerStyle(currentEntry.speaker)}`}>
                <img
                  src={getSpeakerImage(currentEntry.speaker)}
                  alt={currentEntry.speaker}
                  className="w-16 h-16 rounded-full border-2 border-white shadow-lg flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-gray-800 capitalize">
                      {currentEntry.speaker}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {isCurrentSpeaking ? 'Speaking...' : 'Recently spoke'}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{currentEntry.text}</p>
                </div>
              </div>
            </div>
          )
        })()}

        {/* 对话历史（可折叠） */}
        {appState.conversation.length === 0 ? (
          <div className="text-center text-gray-300 py-8">
            <p>No conversation yet. Start a debate to begin!</p>
          </div>
        ) : (
          <details className="mt-4">
            <summary className="text-white cursor-pointer hover:text-gray-300 mb-4">
              View Full Conversation History ({appState.conversation.length} entries)
            </summary>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {appState.conversation.map((entry, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-4 p-3 rounded-lg border-l-4 ${getSpeakerStyle(entry.speaker)} opacity-75`}
                >
                  <img
                    src={getSpeakerImage(entry.speaker)}
                    alt={entry.speaker}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-800 capitalize text-sm">
                        {entry.speaker}
                      </h4>
                      <span className="text-xs text-gray-500">
                        Entry #{index + 1}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-sm">{entry.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Debug info - 可选显示当前状态 */}
        {process.env.NODE_ENV === 'development' && appState.speakersState && (
          <div className="mt-4 p-3 bg-black/20 rounded text-xs text-gray-300">
            <div className="font-semibold mb-1">Speaker States (Debug):</div>
            {Object.entries(appState.speakersState).map(([speaker, state]) => (
              <div key={speaker} className="flex justify-between">
                <span>{speaker}:</span>
                <span>{state.animationState}/{state.generationState}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 状态信息 */}
      <div className="text-center text-sm text-gray-300">
        {appState.newsItems.length > 0 && (
          <p>
            News {appState.currentNewsIndex + 1} of {appState.newsItems.length} | 
            Conversation entries: {appState.conversation.length}
          </p>
        )}
      </div>
    </div>
  )
}
