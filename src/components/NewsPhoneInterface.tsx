'use client'

import React from 'react'
import { AppState } from '@/types'

interface NewsPhoneInterfaceProps {
  appState: AppState
  onStartDebate: () => void
  onNextNews: () => void
  onClearConversation: () => void
  onRefreshNews: () => void
}

export function NewsPhoneInterface({
  appState,
  onStartDebate,
  onNextNews,
  onClearConversation,
  onRefreshNews
}: NewsPhoneInterfaceProps) {
  const currentNews = appState.newsItems[appState.currentNewsIndex]

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* AI机器人角色 - 左侧 */}
      <div className="absolute left-8 bottom-1/4 z-10 hidden lg:block animate-fadeIn">
        <div className="w-48 h-64 relative">
          {/* 机器人身体 */}
          <div className="w-36 h-44 bg-gradient-to-b from-slate-100 to-slate-300 rounded-3xl mx-auto relative shadow-2xl border-2 border-slate-400">
            {/* 机器人头部 */}
            <div className="w-28 h-28 bg-gradient-to-b from-blue-100 to-blue-200 rounded-2xl mx-auto -mt-6 relative shadow-lg border border-blue-300">
              {/* 天线 */}
              <div className="absolute top-[-8px] left-1/2 transform -translate-x-1/2">
                <div className="w-1 h-4 bg-gray-600"></div>
                <div className="w-3 h-3 bg-red-500 rounded-full mx-auto animate-pulse"></div>
              </div>
              
              {/* 眼睛 */}
              <div className="flex space-x-4 pt-6 justify-center">
                <div className="w-5 h-5 bg-gradient-to-b from-cyan-300 to-cyan-500 rounded-full animate-pulse shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full mt-1 ml-1"></div>
                </div>
                <div className="w-5 h-5 bg-gradient-to-b from-cyan-300 to-cyan-500 rounded-full animate-pulse shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full mt-1 ml-1"></div>
                </div>
              </div>
              
              {/* 嘴部扬声器 */}
              <div className="w-12 h-2 bg-gray-700 rounded-full mx-auto mt-4 relative">
                <div className="absolute inset-0 bg-gray-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            {/* 胸部控制面板 */}
            <div className="w-8 h-8 bg-gradient-to-b from-cyan-300 to-cyan-500 rounded-xl mx-auto mt-8 animate-pulse shadow-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white/30 rounded-lg"></div>
            </div>
            
            {/* 手臂 */}
            <div className="absolute -left-8 top-12 w-16 h-8 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full rotate-12 shadow-lg"></div>
            <div className="absolute -right-8 top-12 w-16 h-8 bg-gradient-to-l from-slate-200 to-slate-300 rounded-full -rotate-12 shadow-lg"></div>
            
            {/* 手掌 */}
            <div className="absolute -left-12 top-16 w-6 h-6 bg-slate-300 rounded-full shadow-md"></div>
            <div className="absolute -right-12 top-16 w-6 h-6 bg-slate-300 rounded-full shadow-md"></div>
          </div>
          
          {/* 机器人腿部 */}
          <div className="flex space-x-6 justify-center mt-2">
            <div className="w-8 h-20 bg-gradient-to-b from-slate-200 to-slate-400 rounded-lg shadow-lg"></div>
            <div className="w-8 h-20 bg-gradient-to-b from-slate-200 to-slate-400 rounded-lg shadow-lg"></div>
          </div>
          
          {/* 脚部 */}
          <div className="flex space-x-4 justify-center mt-1">
            <div className="w-10 h-4 bg-gray-600 rounded-full shadow-md"></div>
            <div className="w-10 h-4 bg-gray-600 rounded-full shadow-md"></div>
          </div>
        </div>
      </div>

      {/* 人物角色 - 右侧 */}
      <div className="absolute right-8 bottom-1/4 z-10 hidden lg:block animate-fadeIn">
        <div className="w-36 h-64 relative">
          {/* 人物头部 */}
          <div className="w-20 h-20 bg-gradient-to-b from-yellow-100 to-yellow-200 rounded-full mx-auto relative shadow-lg">
            {/* 头发 */}
            <div className="w-22 h-10 bg-gradient-to-b from-gray-800 to-gray-900 rounded-t-full absolute -top-3 -left-1 shadow-md"></div>
            
            {/* 眼睛 */}
            <div className="flex space-x-3 pt-6 justify-center">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <div className="w-2 h-2 bg-black rounded-full"></div>
            </div>
            
            {/* 鼻子 */}
            <div className="w-1 h-2 bg-yellow-300 mx-auto mt-1"></div>
            
            {/* 嘴 */}
            <div className="w-6 h-1 bg-red-500 rounded-full mx-auto mt-1"></div>
          </div>
          
          {/* 身体西装 */}
          <div className="w-24 h-36 bg-gradient-to-b from-blue-800 to-blue-900 rounded-lg mx-auto mt-2 relative shadow-xl">
            {/* 衬衫 */}
            <div className="w-16 h-24 bg-white mx-auto rounded-t-lg"></div>
            
            {/* 领带 */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-20 bg-gradient-to-b from-red-600 to-red-800 shadow-md"></div>
            
            {/* 西装翻领 */}
            <div className="absolute top-0 left-2 w-6 h-8 bg-blue-800 transform rotate-12"></div>
            <div className="absolute top-0 right-2 w-6 h-8 bg-blue-800 transform -rotate-12"></div>
            
            {/* 手臂 */}
            <div className="absolute -left-6 top-6 w-12 h-6 bg-gradient-to-r from-blue-800 to-blue-900 rounded-full rotate-12 shadow-lg"></div>
            <div className="absolute -right-6 top-6 w-12 h-6 bg-gradient-to-l from-blue-800 to-blue-900 rounded-full -rotate-12 shadow-lg"></div>
            
            {/* 手 */}
            <div className="absolute -left-8 top-10 w-4 h-4 bg-yellow-200 rounded-full shadow-md"></div>
            <div className="absolute -right-8 top-10 w-4 h-4 bg-yellow-200 rounded-full shadow-md"></div>
          </div>
          
          {/* 腿部西裤 */}
          <div className="flex space-x-3 justify-center mt-1">
            <div className="w-5 h-16 bg-gradient-to-b from-gray-700 to-gray-900 rounded-lg shadow-lg"></div>
            <div className="w-5 h-16 bg-gradient-to-b from-gray-700 to-gray-900 rounded-lg shadow-lg"></div>
          </div>
          
          {/* 皮鞋 */}
          <div className="flex space-x-2 justify-center mt-1">
            <div className="w-6 h-3 bg-black rounded-lg shadow-md"></div>
            <div className="w-6 h-3 bg-black rounded-lg shadow-md"></div>
          </div>
        </div>
      </div>

      {/* 中央手机界面 */}
      <div className="relative z-20">
        {/* 手机外框 */}
        <div className="w-80 h-[600px] bg-gradient-to-b from-gray-900 to-black rounded-[3rem] p-6 shadow-2xl border-4 border-gray-700">
          {/* 手机屏幕 */}
          <div className="w-full h-full bg-gradient-to-b from-purple-800 via-blue-900 to-indigo-900 rounded-[2rem] relative overflow-hidden">
            
            {/* 状态栏 */}
            <div className="h-8 flex items-center justify-between px-6 pt-2">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
              <div className="text-white text-xs">9:41</div>
              <div className="flex space-x-1">
                <div className="w-4 h-2 bg-white rounded-sm"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
            </div>

            {/* TOP 5 NEWS 标题 */}
            <div className="text-center py-6">
              <h1 className="text-3xl font-bold text-white mb-2">TOP 5</h1>
              <h2 className="text-3xl font-bold text-white">NEWS</h2>
            </div>

            {/* 导航标签 */}
            <div className="flex justify-center mb-4">
              <div className="flex bg-black/30 rounded-full p-1">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-medium">
                  TOM 5
                </button>
                <button className="px-6 py-2 text-white text-sm font-medium">
                  HOT NEWS
                </button>
              </div>
            </div>

            {/* 新闻列表 */}
            <div className="px-4 space-y-3 flex-1 overflow-y-auto max-h-[320px]">
              {appState.newsItems.slice(0, 6).map((news, index) => {
                // 定义不同的AI服务图标和颜色
                const aiServices = [
                  { name: 'Reka AI', icon: '⏰', color: 'from-purple-500 to-pink-500' },
                  { name: 'Teka 5 AI', icon: '👥', color: 'from-blue-500 to-cyan-500' },
                  { name: 'Gov. Muhies', icon: '☁️', color: 'from-green-500 to-teal-500' },
                  { name: 'Nestcan Li', icon: '⚙️', color: 'from-orange-500 to-red-500' },
                  { name: 'Serha AI El', icon: '👤', color: 'from-indigo-500 to-purple-500' },
                  { name: 'Leurtore', icon: '🔄', color: 'from-pink-500 to-rose-500' }
                ];
                
                const service = aiServices[index % aiServices.length];
                
                return (
                  <div 
                    key={index}
                    className={`flex items-center space-x-3 p-3 rounded-xl transition-all cursor-pointer hover:scale-[1.02] ${
                      index === appState.currentNewsIndex 
                        ? 'bg-blue-600/30 border border-blue-400 shadow-lg' 
                        : 'bg-black/20 hover:bg-black/30'
                    }`}
                    onClick={() => {
                      // 这里可以添加选择新闻的逻辑
                    }}
                  >
                    {/* AI服务图标 */}
                    <div className={`w-12 h-12 bg-gradient-to-br ${service.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <span className="text-lg">{service.icon}</span>
                    </div>
                    
                    {/* 新闻内容 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm mb-1 leading-tight">
                        {service.name}
                      </h3>
                      <p className="text-cyan-300 text-xs truncate font-medium">
                        {news.title.length > 25 ? news.title.substring(0, 25) + '...' : news.title}
                      </p>
                    </div>
                    
                    {/* 指示器 */}
                    {index === appState.currentNewsIndex && (
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 底部控制按钮 */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex space-x-2">
                <button
                  onClick={onStartDebate}
                  disabled={appState.isDebating || !currentNews}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                    appState.isDebating || !currentNews
                      ? 'bg-gray-600 text-gray-400'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                  }`}
                >
                  {appState.isDebating ? '辩论中...' : '开始辩论'}
                </button>
                
                <button
                  onClick={onNextNews}
                  disabled={appState.isDebating}
                  className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-xl font-semibold text-sm transition-all"
                >
                  下一条
                </button>
              </div>
              
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={onRefreshNews}
                  disabled={appState.isDebating}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-medium text-xs transition-all"
                >
                  刷新新闻
                </button>
                
                <button
                  onClick={onClearConversation}
                  disabled={appState.isDebating}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg font-medium text-xs transition-all"
                >
                  清除对话
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 当前辩论状态显示 */}
      {appState.conversation.length > 0 && (
        <div className="absolute top-4 left-4 right-4 z-30">
          <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4 max-h-32 overflow-y-auto">
            <h3 className="text-white font-semibold mb-2 text-sm">实时辩论</h3>
            {appState.conversation.slice(-3).map((entry, index) => (
              <div key={index} className="text-xs text-gray-300 mb-1">
                <span className="font-medium capitalize text-white">{entry.speaker}:</span> {entry.text.slice(0, 100)}...
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 辩论进行中的指示器 */}
      {appState.isDebating && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
          <div className="bg-black/70 rounded-full p-4">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}
    </div>
  )
}
