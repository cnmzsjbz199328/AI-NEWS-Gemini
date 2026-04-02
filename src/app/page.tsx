'use client'

import { useState, useEffect, useCallback } from 'react'
import { ConversationEntry, NewsItem, Speaker, AppState, SpeakersState, AudioPlaybackInfo } from '@/types'
import { SettingsPanel } from '@/components/settings'

import { NewsDisplay } from '@/components/news/NewsDisplay'
import { SpeakerAvatar } from '@/components/ui/SpeakerAvatar'
import { TranscriptArea } from '@/components/ui/TranscriptArea'
import { PipelineStatusWidget } from '@/components/ui/PipelineStatusWidget'
import { useNewsManager } from '@/hooks/useNewsManager'
import { usePipelineStatus } from '@/hooks/usePipelineStatus'
import { useDiscussionManager } from '@/hooks/useDiscussionManager'
import { useNewsAutoRotation } from '@/hooks/useNewsAutoRotation'
import { usePlaybackController } from '@/hooks/usePlaybackController'


export default function HomePage() {
  console.log('[UI] ===== MAIN PAGE COMPONENT RENDERED =====')
  
  const [state, setState] = useState<AppState>({
    conversation: [],
    currentNewsIndex: 0,
    isDebating: false,
    newsItems: [],
    isLoading: false,
    error: '',
    currentMessage: null,
    currentSpeaker: 'none',
    speakersState: {
      moderator: { 
        animationState: 'static', 
        generationState: 'idle' 
      },
      tom: { 
        animationState: 'static', 
        generationState: 'idle' 
      },
      mark: { 
        animationState: 'static', 
        generationState: 'idle' 
      }
    },
    audioQueue: [],
    currentPlayingAudio: undefined,
    nextSequenceNumber: 1,
    // Legacy properties for compatibility
    status: 'Ready to start discussion',
    news: [],
    newsError: '',
    activeNewsIndex: 0
  })

  // 设置面板状态
  const [isSettingsPanelVisible, setIsSettingsPanelVisible] = useState(false)
  


  // 使用自定义hooks
  const { news, newsError, activeNewsIndex, fetchNews, setActiveNewsIndex } = useNewsManager()
  const { pipelineStatus } = usePipelineStatus(state.isDebating)
  const { startDiscussion, updateStatus, updateError } = useDiscussionManager({
    state,
    setState,
    news,
    activeNewsIndex
  })

  // 自动新闻轮播
  const handleNewsRotation = useCallback(() => {
    setActiveNewsIndex((activeNewsIndex + 1) % news.length)
  }, [activeNewsIndex, news.length, setActiveNewsIndex])
  
  useNewsAutoRotation({
    newsLength: news.length,
    isDebating: state.isDebating,
    onRotateNews: handleNewsRotation
  })

  // 音频播放控制
  const updateSpeakerAnimationState = useCallback((speaker: Speaker, animationState: 'speaking' | 'static') => {
    console.log(`[LOG-CHAIN] 3. page.tsx received state update. Speaker: ${speaker}, State: ${animationState}`);
    setState(prevState => {
      const newState = {
        ...prevState,
        speakersState: {
          ...prevState.speakersState,
          [speaker]: {
            ...prevState.speakersState[speaker],
            animationState
          }
        }
      }
      console.log(`[LOG-CHAIN] 4. page.tsx is setting new state.`, newState.speakersState);
      return newState;
    })
  }, [])

  // 更新对话记录的回调
  const updateConversation = useCallback((speaker: Speaker, text: string, action: 'add' | 'remove') => {
    if (action === 'add') {
      console.log(`[LOG-CHAIN] 3b. page.tsx received conversation update for ${speaker}.`);
      const newEntry = {
        id: `${speaker}-${Date.now()}`,
        speaker,
        text,
        timestamp: new Date()
      }
      setState(prevState => ({
        ...prevState,
        conversation: [...prevState.conversation, newEntry]
      }))
    }
  }, [])

  const { isPlaying, currentSpeaker, replayLastTask, stopAllPlayback } = usePlaybackController({
    pipelineStatus,
    onSpeakerStateChange: (speaker, speakingState) => {
      updateSpeakerAnimationState(speaker, speakingState === 'speaking' ? 'speaking' : 'static')
    },
    onConversationUpdate: updateConversation,
    onPlaybackComplete: useCallback(() => {
      setState(prev => ({ ...prev, isDebating: false, status: 'Discussion complete. Ready to start again.' }))
    }, [])
  })

  // TODO: Managers are disabled after architecture refactoring to one-shot generation
  // The new architecture uses PipelineScheduler for all generation logic
  // Frontend now only needs to interact with the pipeline API

  // 监控状态变化的useEffect
  useEffect(() => {
    console.log(`[UI] State changed - conversation length: ${state.conversation.length}`);
    console.log(`[UI] Speaker states:`, state.speakersState);
  }, [state.speakersState, state.conversation])

  return (
    <div className={`flex min-h-screen ${isSettingsPanelVisible ? 'settings-panel-open' : ''}`}>
      {/* 设置面板 */}
      <SettingsPanel 
        isVisible={isSettingsPanelVisible}
        onToggle={() => setIsSettingsPanelVisible(!isSettingsPanelVisible)}
      />
      
      {/* 主内容区域 */}
      <div className="flex-1 ai-news-commentary">
      <div className="aitv-logo">AITV</div>
      
      <div id="status">{state.error || state.status}</div>
      
      <div className="main-content">
        <SpeakerAvatar 
          speaker="moderator" 
          speakersState={state.speakersState} 
          title="Moderator" 
        />
        
        <div className="studio-container">
          <SpeakerAvatar 
            speaker="tom" 
            speakersState={state.speakersState} 
            title="Tom" 
          />

          <div className="news-panel">
            <div className="news-navigation">
              <span className="news-indicator">
                {news.length > 0 ? `${activeNewsIndex + 1} / ${news.length}` : 'Loading...'}
              </span>
              <span className="news-status">
                {state.isDebating ? `Discussing Topic ${activeNewsIndex + 1}` : 'Auto-rotating topics'}
              </span>
            </div>
            <div id="news-content">
              <NewsDisplay 
                news={news}
                newsError={newsError}
                activeNewsIndex={activeNewsIndex}
                onRefreshNews={fetchNews}
              />
            </div>
          </div>

          <SpeakerAvatar 
            speaker="mark" 
            speakersState={state.speakersState} 
            title="Mark" 
          />
        </div>
      </div>

      <div id="transcript">
        <PipelineStatusWidget 
          pipelineStatus={pipelineStatus}
          isVisible={state.isDebating}
        />
        
        <TranscriptArea 
          speakersState={state.speakersState}
          conversation={state.conversation}
        />
      </div>

        <div className="controls">
          <button 
            onClick={() => startDiscussion(true)} 
            disabled={state.isDebating}
            style={{ 
              marginRight: '10px',
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              cursor: state.isDebating ? 'not-allowed' : 'pointer'
            }}
          >
            🆕 Begin New Discussion
          </button>
          
          <button 
            onClick={() => startDiscussion(false)} 
            disabled={state.isDebating}
            style={{ 
              marginRight: '10px',
              backgroundColor: '#2196F3',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              cursor: state.isDebating ? 'not-allowed' : 'pointer'
            }}
          >
            🔄 Start (Reuse if Available)
          </button>
          
          <button 
            onClick={stopAllPlayback} 
            disabled={state.isDebating && !isPlaying}
            style={{ 
              backgroundColor: '#f44336',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              cursor: (!isPlaying && !state.isDebating) ? 'not-allowed' : 'pointer',
              opacity: (!isPlaying && !state.isDebating) ? 0.5 : 1
            }}
          >
            🛑 Stop All Playback
          </button>
        </div>
      </div>

    </div>
  )
}