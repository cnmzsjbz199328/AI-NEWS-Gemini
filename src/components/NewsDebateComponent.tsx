'use client'

import React from 'react'
import { AppState } from '@/types'

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
        
        {appState.conversation.length === 0 ? (
          <div className="text-center text-gray-300 py-8">
            <p>No conversation yet. Start a debate to begin!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appState.conversation.map((entry, index) => (
              <div
                key={index}
                className={`flex items-start space-x-4 p-4 rounded-lg border-l-4 ${getSpeakerStyle(entry.speaker)}`}
              >
                <img
                  src={getSpeakerImage(entry.speaker)}
                  alt={entry.speaker}
                  className="w-12 h-12 rounded-full border-2 border-white shadow-lg flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-gray-800 capitalize">
                      {entry.speaker}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{entry.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 正在辩论指示器 */}
        {appState.isDebating && (
          <div className="mt-4 flex items-center justify-center space-x-2 text-white">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Debate in progress...</span>
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
