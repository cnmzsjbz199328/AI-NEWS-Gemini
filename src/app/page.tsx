'use client'

import { useState, useEffect, useCallback } from 'react'
import { ConversationEntry, NewsItem, Speaker, AppState, SlideData } from '@/types'
import { DEFAULT_TTS_VOICE_CONFIG } from '@/components/ui/constants'
import { SettingsPanel, AppSettings, resolveLanguage } from '@/components/settings'
import Button from '@/components/ui/Button'

import { NewsDisplay } from '@/components/news/NewsDisplay'
import { SpeakerAvatar } from '@/components/ui/SpeakerAvatar'
import { TranscriptArea } from '@/components/ui/TranscriptArea'
import { PipelineStatusWidget } from '@/components/ui/PipelineStatusWidget'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { useNewsManager } from '@/hooks/useNewsManager'
import { usePipelineStatus } from '@/hooks/usePipelineStatus'
import { useDiscussionManager } from '@/hooks/useDiscussionManager'
import { useNewsAutoRotation } from '@/hooks/useNewsAutoRotation'
import { usePlaybackController } from '@/hooks/usePlaybackController'


export default function HomePage() {
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
      moderator: { animationState: 'static', generationState: 'idle' },
      tom:       { animationState: 'static', generationState: 'idle' },
      mark:      { animationState: 'static', generationState: 'idle' },
    },
    audioQueue: [],
    currentPlayingAudio: undefined,
    nextSequenceNumber: 1,
    status: 'Ready to start discussion',
    news: [],
    newsError: '',
    activeNewsIndex: 0
  })

  const [isSettingsPanelVisible, setIsSettingsPanelVisible] = useState(false)
  const [currentSlide, setCurrentSlide] = useState<SlideData | null>(null)
  const [appSettings, setAppSettings] = useState<AppSettings>({
    audioEnabled: true,
    autoRotateNews: true,
    rotationInterval: 5,
    language: 'auto',
    debateSpeed: 'normal',
    showDebugInfo: false,
    ttsVoiceConfig: DEFAULT_TTS_VOICE_CONFIG,
  })

  const { news, newsError, activeNewsIndex, fetchNews, setActiveNewsIndex } = useNewsManager()
  const { pipelineStatus } = usePipelineStatus(state.isDebating)
  const { startDiscussion, updateStatus, updateError } = useDiscussionManager({
    state,
    setState,
    news,
    activeNewsIndex,
    ttsVoiceConfig: appSettings.ttsVoiceConfig,
    language: resolveLanguage(appSettings.language),
    debateSpeed: appSettings.debateSpeed,
  })

  const handleNewsRotation = useCallback(() => {
    setActiveNewsIndex((activeNewsIndex + 1) % news.length)
  }, [activeNewsIndex, news.length, setActiveNewsIndex])

  useNewsAutoRotation({
    newsLength: news.length,
    isDebating: state.isDebating,
    onRotateNews: handleNewsRotation,
    enabled: appSettings.autoRotateNews,
    intervalSeconds: appSettings.rotationInterval,
  })

  const updateSpeakerAnimationState = useCallback((speaker: Speaker, animationState: 'speaking' | 'static') => {
    setState(prevState => ({
      ...prevState,
      speakersState: {
        ...prevState.speakersState,
        [speaker]: { ...prevState.speakersState[speaker], animationState }
      }
    }))
  }, [])

  const updateConversation = useCallback((speaker: Speaker, text: string, action: 'add' | 'remove') => {
    if (action === 'add') {
      setState(prevState => ({
        ...prevState,
        conversation: [...prevState.conversation, {
          id: `${speaker}-${Date.now()}`,
          speaker,
          text,
          timestamp: new Date()
        }]
      }))
    }
  }, [])

  const { isPlaying, replayLastTask, stopAllPlayback } = usePlaybackController({
    pipelineStatus,
    onSpeakerStateChange: (speaker, speakingState) => {
      updateSpeakerAnimationState(speaker, speakingState === 'speaking' ? 'speaking' : 'static')
    },
    onConversationUpdate: updateConversation,
    onPlaybackComplete: useCallback(() => {
      setState(prev => ({ ...prev, isDebating: false, status: 'Discussion complete. Ready to start again.' }))
    }, []),
    audioEnabled: appSettings.audioEnabled,
    onSlideChange: setCurrentSlide,
  })

  useEffect(() => {
  }, [state.speakersState, state.conversation])

  return (
    <div className={`flex min-h-screen ${isSettingsPanelVisible ? 'settings-panel-open' : ''}`}>
      {/* 设置面板 */}
      <SettingsPanel
        isVisible={isSettingsPanelVisible}
        onToggle={() => setIsSettingsPanelVisible(!isSettingsPanelVisible)}
        onSettingsChange={setAppSettings}
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
            <SlidePanel
              currentSlide={currentSlide}
              activeSpeaker={
                (Object.keys(state.speakersState) as Speaker[]).find(
                  s => state.speakersState[s].animationState === 'speaking'
                )
              }
            />
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
          showDebugInfo={appSettings.showDebugInfo}
        />

        <TranscriptArea
          speakersState={state.speakersState}
          conversation={state.conversation}
        />
      </div>

        <div className="controls">
          <Button
            variant="success"
            size="lg"
            onClick={() => startDiscussion(true)}
            disabled={state.isDebating}
          >
            🆕 Begin New Discussion
          </Button>

          <Button
            variant="info"
            size="lg"
            onClick={() => startDiscussion(false)}
            disabled={state.isDebating}
          >
            🔄 Start (Reuse if Available)
          </Button>

          <Button
            variant="danger"
            size="lg"
            onClick={stopAllPlayback}
            disabled={state.isDebating && !isPlaying}
          >
            🛑 Stop All Playback
          </Button>
        </div>
      </div>

    </div>
  )
}
