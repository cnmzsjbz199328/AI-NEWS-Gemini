'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ConversationEntry, NewsItem, Speaker, AppState, SlideData } from '@/types'
import { DEFAULT_TTS_VOICE_CONFIG } from '@/components/ui/constants'
import { SettingsPanel, AppSettings, resolveLanguage } from '@/components/settings'
import Button from '@/components/ui/Button'

import { SpeakerAvatar } from '@/components/ui/SpeakerAvatar'
import { TranscriptArea } from '@/components/ui/TranscriptArea'
import { PipelineStatusWidget } from '@/components/ui/PipelineStatusWidget'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { useNewsManager } from '@/hooks/useNewsManager'
import { usePipelineStatus } from '@/hooks/usePipelineStatus'
import { useDiscussionManager } from '@/hooks/useDiscussionManager'
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
    status: 'Select a news article and click New Discussion',
    news: [],
    newsError: '',
    activeNewsIndex: 0
  })

  const [isSettingsPanelVisible, setIsSettingsPanelVisible] = useState(false)
  const [currentSlide, setCurrentSlide] = useState<SlideData | null>(null)
  const [lockedNewsItem, setLockedNewsItem] = useState<NewsItem | null>(null)
  const [isAutoPlayMode, setIsAutoPlayMode] = useState(false)
  const [appSettings, setAppSettings] = useState<AppSettings>({
    audioEnabled: true,
    autoRotateNews: false,
    rotationInterval: 5,
    language: 'auto',
    debateSpeed: 'normal',
    showDebugInfo: false,
    ttsVoiceConfig: DEFAULT_TTS_VOICE_CONFIG,
  })

  // Refs for use inside callbacks without stale-closure risk
  const isAutoPlayModeRef = useRef(false)
  isAutoPlayModeRef.current = isAutoPlayMode

  const activeNewsIndexRef = useRef(0)
  const newsLengthRef = useRef(0)
  const autoPlayPendingRef = useRef(false)

  const { news, newsError, activeNewsIndex, fetchNews, setActiveNewsIndex } = useNewsManager()

  // Keep refs in sync after each render
  activeNewsIndexRef.current = activeNewsIndex
  newsLengthRef.current = news.length

  useEffect(() => {
    if (!state.isDebating) {
      setLockedNewsItem(null)
    }
  }, [state.isDebating])

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

  // Called when a discussion finishes playing
  const handlePlaybackComplete = useCallback(() => {
    setState(prev => ({ ...prev, isDebating: false, status: 'Discussion complete.' }))
    if (isAutoPlayModeRef.current && newsLengthRef.current > 0) {
      // Advance to next article and signal that a new discussion should start
      const nextIndex = (activeNewsIndexRef.current + 1) % newsLengthRef.current
      setActiveNewsIndex(nextIndex)
      autoPlayPendingRef.current = true
    }
  }, [setActiveNewsIndex])

  const { isPlaying, stopAllPlayback, markAllTasksAsProcessed } = usePlaybackController({
    pipelineStatus,
    onSpeakerStateChange: (speaker, speakingState) => {
      updateSpeakerAnimationState(speaker, speakingState === 'speaking' ? 'speaking' : 'static')
    },
    onConversationUpdate: updateConversation,
    onPlaybackComplete: handlePlaybackComplete,
    audioEnabled: appSettings.audioEnabled,
    onSlideChange: (slide) => {
      console.log(`[onSlideChange] slide="${slide?.title ?? 'null'}" | lockedNews="${lockedNewsItem?.title ?? 'null'}" | activeNews="${news[activeNewsIndex]?.title ?? 'null'}"`)
      setCurrentSlide(slide)
    },
  })

  const handleStartDiscussion = useCallback((forceNew = true) => {
    const item = news[activeNewsIndex] ?? null
    console.log(`[handleStartDiscussion] idx=${activeNewsIndex} locking="${item?.title ?? 'null'}"`)
    markAllTasksAsProcessed()  // 防止历史任务被重播
    setLockedNewsItem(item)
    return startDiscussion(forceNew)
  }, [startDiscussion, news, activeNewsIndex, markAllTasksAsProcessed])

  // Auto-play: after news advances and isDebating is cleared, start the next discussion.
  // autoPlayPendingRef guards against spurious re-triggers.
  useEffect(() => {
    if (autoPlayPendingRef.current && !state.isDebating && isAutoPlayMode && news.length > 0) {
      autoPlayPendingRef.current = false
      handleStartDiscussion(true)
    }
  }, [state.isDebating, activeNewsIndex, isAutoPlayMode, news.length, handleStartDiscussion])

  // Toggle sequential auto-play mode
  const handleAutoPlayToggle = useCallback(() => {
    if (isAutoPlayMode) {
      // Cancel auto-play — current discussion (if any) finishes normally
      setIsAutoPlayMode(false)
      autoPlayPendingRef.current = false
      updateStatus('Auto-play cancelled. Discussion will finish normally.')
    } else {
      setIsAutoPlayMode(true)
      if (!state.isDebating) {
        handleStartDiscussion(true)
      }
      // If already debating, auto-play will kick in after the current one finishes
    }
  }, [isAutoPlayMode, state.isDebating, startDiscussion, updateStatus])

  // Stop everything and exit auto-play mode
  const handleStop = useCallback(() => {
    setIsAutoPlayMode(false)
    autoPlayPendingRef.current = false
    stopAllPlayback()
    setState(prev => ({ ...prev, isDebating: false, status: 'Stopped.' }))
  }, [stopAllPlayback])

  const activeSpeaker = (Object.keys(state.speakersState) as Speaker[]).find(
    s => state.speakersState[s].animationState === 'speaking'
  )

  const newsStatusText = isAutoPlayMode
    ? (state.isDebating ? `Auto-play: Discussing ${activeNewsIndex + 1} / ${news.length}` : 'Auto-play: loading next...')
    : (state.isDebating ? `Discussing Topic ${activeNewsIndex + 1}` : 'Click New Discussion to start')

  return (
    <div className="flex min-h-screen">
      {/* Settings panel */}
      <SettingsPanel
        isVisible={isSettingsPanelVisible}
        onToggle={() => setIsSettingsPanelVisible(!isSettingsPanelVisible)}
        onSettingsChange={setAppSettings}
      />

      {/* Main content */}
      <div className="flex-1 ai-news-commentary">

        {/* Header */}
        <header className="flex justify-between items-center px-8 py-4 shrink-0">
          <button
            className="aitv-logo"
            onClick={() => setIsSettingsPanelVisible(!isSettingsPanelVisible)}
            title="Settings"
          >
            AITV
          </button>
          <div className="text-xs text-slate-400 font-body">{state.error || state.status}</div>
        </header>

        {/* Studio — avatars | content | controls */}
        <div className="studio-main">

          {/* Left: avatar column */}
          <div className="avatar-column">
            <SpeakerAvatar speaker="mark"      speakersState={state.speakersState} title="Mark" />
            <SpeakerAvatar speaker="tom"       speakersState={state.speakersState} title="Tom" />
            <SpeakerAvatar speaker="moderator" speakersState={state.speakersState} title="Moderator" />
          </div>

          {/* Centre: news+slide + transcript */}
          <div className="content-column">

            {/* Unified news + slide panel */}
            <div className="news-panel">
              <PipelineStatusWidget
                pipelineStatus={pipelineStatus}
                isVisible={state.isDebating}
                showDebugInfo={appSettings.showDebugInfo}
              />
              <div className="news-navigation">
                <span className="news-indicator">
                  {news.length > 0 ? `${activeNewsIndex + 1} / ${news.length}` : 'Loading...'}
                </span>
                <span className={`news-status ${isAutoPlayMode ? 'auto-play-active' : ''}`}>
                  {newsStatusText}
                </span>
              </div>
              <SlidePanel
                currentSlide={currentSlide}
                activeSpeaker={activeSpeaker}
                activeNewsItem={(state.isDebating && lockedNewsItem) ? lockedNewsItem : (news[activeNewsIndex] ?? null)}
                newsError={newsError}
                onRefreshNews={fetchNews}
              />
            </div>

            {/* Transcript — fixed height, no reflow */}
            <TranscriptArea
              speakersState={state.speakersState}
              conversation={state.conversation}
            />
          </div>

          {/* Right: controls column */}
          <div className="controls-column">
            <Button
              variant="success"
              size="sm"
              onClick={() => handleStartDiscussion(true)}
              disabled={state.isDebating}
            >
              🆕 New
            </Button>

            <Button
              variant={isAutoPlayMode ? 'warning' : 'info'}
              size="sm"
              onClick={handleAutoPlayToggle}
            >
              {isAutoPlayMode ? '⏸ Auto On' : '▶▶ Auto'}
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={handleStop}
              disabled={!state.isDebating && !isAutoPlayMode}
            >
              🛑 Stop
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
