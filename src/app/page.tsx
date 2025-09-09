'use client'

import { useState, useEffect } from 'react'
import { ConversationEntry, NewsItem, Speaker, AppState, SpeakersState, AudioPlaybackInfo } from '@/types'
import { SpeakerStateManager } from '@/utils/speaker-state-manager'
import { AudioManager } from '@/utils/audio-manager'
import { GenerationManager } from '@/utils/generation-manager'

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

  // Initialize managers
  const speakerStateManager = new SpeakerStateManager()
  speakerStateManager.setStateChangeCallback(
    (newState: SpeakersState) => setState(prev => ({ ...prev, speakersState: newState }))
  )
  
  const audioManager = new AudioManager(speakerStateManager)
  audioManager.setStateChangeCallback(
    (audioInfo: AudioPlaybackInfo) => setState(prev => ({ 
      ...prev, 
      currentPlayingAudio: audioInfo.currentSequence > 0 ? audioInfo.currentSequence.toString() : undefined
    }))
  )
  
  const generationManager = new GenerationManager(audioManager, speakerStateManager)
  generationManager.setConversationUpdateCallback(
    (conversation: ConversationEntry[]) => setState(prev => ({ 
      ...prev, 
      conversation 
    }))
  )

  const updateStatus = (msg: string) => {
    setState((prev: AppState) => ({ ...prev, status: msg }))
  }

  const updateError = (msg: string) => {
    setState((prev: AppState) => ({ ...prev, error: msg }))
  }

  // Helper function to get speaker image based on animation state
  const getSpeakerImage = (speaker: Speaker) => {
    const speakerState = state.speakersState[speaker]
    const animationState = speakerState.animationState
    
    console.log(`[UI] getSpeakerImage for ${speaker}: animationState = ${animationState}`)
    
    // Use animated GIF when thinking or speaking, static PNG when idle
    if (animationState === 'thinking' || animationState === 'speaking') {
      console.log(`[UI] ${speaker} using ANIMATED image (state: ${animationState})`)
      switch (speaker) {
        case 'moderator':
          return "https://pub-b436254f85684e9e95bebad4567b11ff.r2.dev/public/ezgif.com-video-to-gif-converter.gif"
        case 'tom':
          return "https://pub-b436254f85684e9e95bebad4567b11ff.r2.dev/public/Moving-picture-dog-flips-hot-dog-on-nose-animated-gif.gif"
        case 'mark':
          return "https://pub-b436254f85684e9e95bebad4567b11ff.r2.dev/public/dog-ezgif.com-video-to-gif-converter%20(1).gif"
      }
    } else {
      console.log(`[UI] ${speaker} using STATIC image (state: ${animationState})`)
      // Static state - use PNG images
      switch (speaker) {
        case 'moderator':
          return "https://pub-b436254f85684e9e95bebad4567b11ff.r2.dev/public/1.png"
        case 'tom':
          return "https://pub-b436254f85684e9e95bebad4567b11ff.r2.dev/public/3.png"
        case 'mark':
          return "https://pub-b436254f85684e9e95bebad4567b11ff.r2.dev/public/2.png"
      }
    }
  }

  useEffect(() => {
    fetchNews()
    // 每10分钟刷新新闻
    const interval = setInterval(fetchNews, 600000)
    return () => clearInterval(interval)
  }, [])

  // 自动新闻滚动功能
  useEffect(() => {
    if (state.news.length > 0 && !state.isDebating) {
      const interval = setInterval(() => {
        setState(prev => ({
          ...prev,
          activeNewsIndex: (prev.activeNewsIndex + 1) % prev.news.length
        }))
      }, 5000) // 每5秒切换一个新闻

      return () => clearInterval(interval)
    }
  }, [state.news.length, state.isDebating])

  // 监控状态变化的useEffect
  useEffect(() => {
    console.log(`[UI] State changed - conversation length: ${state.conversation.length}`);
    console.log(`[UI] Speaker states:`, state.speakersState);
  }, [state.speakersState, state.conversation])

  const fetchNews = async () => {
    try {
      setState((prev: AppState) => ({ ...prev, newsError: '' }))
      
      const response = await fetch('/api/news')
      if (!response.ok) {
        throw new Error('Failed to fetch news')
      }
      
      const newsItems: NewsItem[] = await response.json()
      console.log('[NEWS DEBUG] Fetched news items:', newsItems.map(item => ({
        title: item.title.substring(0, 50) + '...',
        date: item.date,
        description: item.description.substring(0, 50) + '...'
      })))
      
      setState((prev: AppState) => ({ 
        ...prev, 
        news: newsItems,
        activeNewsIndex: 0
      }))
    } catch (error) {
      setState((prev: AppState) => ({ 
        ...prev, 
        newsError: 'Unable to load BBC news. There was an error fetching the news feed.'
      }))
    }
  }

  const startDiscussion = async () => {
    console.log('[UI] startDiscussion called!')
    if (state.isDebating || state.news.length === 0) {
      console.log('[UI] Early return - isDebating:', state.isDebating, 'news.length:', state.news.length)
      return
    }

    console.log('[UI] Starting discussion...')

    // 启用音频上下文（处理浏览器自动播放策略）
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      await audioContext.resume()
      console.log('[UI] Audio context enabled successfully')
    } catch (error) {
      console.warn('[UI] Failed to enable audio context:', error)
    }

    const currentNews = state.news[state.activeNewsIndex]
    const topic = `Title: ${currentNews.title}. Summary: ${currentNews.description}`

    setState((prev: AppState) => ({ 
      ...prev, 
      isDebating: true,
      currentMessage: null,
      error: '',
      conversation: []
    }))
    updateStatus('The discussion is starting...')

    try {
      await runDebateWithNewSystem(topic)
    } catch (e: any) {
      updateError(`An error occurred: ${e.message}`)
    } finally {
      setState((prev: AppState) => ({ 
        ...prev, 
        isDebating: false
      }))
      // Reset all speakers to static state
      speakerStateManager.setStatic('moderator')
      speakerStateManager.setStatic('tom')
      speakerStateManager.setStatic('mark')
      updateStatus('Discussion finished. Click Start to begin again.')
    }
  }

  const runDebateWithNewSystem = async (topic: string) => {
    console.log('[UI] Starting debate with new system, topic:', topic)
    
    // Define the debate flow with our new system
    const debateFlow = [
      {
        speaker: 'moderator' as Speaker,
        prompt: `Introduce the topic for today's debate based on this news story: "${topic}". Then, ask Tom for his opening statement.`
      },
      {
        speaker: 'tom' as Speaker,
        prompt: `Give your opening statement on the topic.`
      },
      {
        speaker: 'mark' as Speaker,
        prompt: `Directly respond to Tom's last statement.`
      },
      {
        speaker: 'tom' as Speaker,
        prompt: `Directly respond to Mark's last statement.`
      },
      {
        speaker: 'moderator' as Speaker,
        prompt: `Summarize the key points from both Tom and Mark, and provide a concluding thought to end the debate.`
      }
    ]

    // Execute each speaker turn using our generation manager
    for (const turn of debateFlow) {
      updateStatus(`${turn.speaker.charAt(0).toUpperCase() + turn.speaker.slice(1)} is preparing...`)
      
      try {
        await generationManager.executeSpeakerTurn(
          turn.speaker,
          turn.prompt,
          state.conversation
        )
        
        // Small delay between speakers
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error: any) {
        console.error(`Error during ${turn.speaker} turn:`, error)
        throw new Error(`Failed to execute ${turn.speaker} turn: ${error.message}`)
      }
    }

    // 讨论结束后，自动切换到下一个新闻话题
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        activeNewsIndex: (prev.activeNewsIndex + 1) % prev.news.length
      }))
    }, 2000) // 讨论结束2秒后切换到下一个话题
  }

  const renderNewsContent = () => {
    if (state.newsError) {
      return (
        <div className="error">
          <div>{state.newsError}</div>
          <button className="refresh-btn" onClick={fetchNews}>
            Refresh News
          </button>
        </div>
      )
    }

    if (state.news.length === 0) {
      return <div className="loading">Loading BBC News</div>
    }

    return state.news.map((item: NewsItem, index: number) => (
      <div 
        key={index}
        className={`news-item ${index === state.activeNewsIndex ? 'active' : ''}`}
      >
        {item.thumbnailUrl && (
          <img
            src={item.thumbnailUrl}
            className="news-thumbnail"
            alt={item.title}
          />
        )}
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <div className="news-meta">
          <span>BBC News</span>
          <span>{item.date}</span>
        </div>
      </div>
    ))
  }

  return (
    <div className="ai-news-commentary">
      <div className="aitv-logo">AITV</div>
      
      <div id="status">{state.error || state.status}</div>
      
      <div className="main-content">
        <div className={`commentator moderator ${state.speakersState.moderator.animationState === 'speaking' ? 'speaking' : ''}`}>
          <h2>Moderator</h2>
          <div className="avatar">
            <img src={getSpeakerImage('moderator')} alt="Moderator Avatar" />
          </div>
        </div>
        
        <div className="studio-container">
          <div className={`commentator tom ${state.speakersState.tom.animationState === 'speaking' ? 'speaking' : ''}`}>
            <h2>Tom</h2>
            <div className="avatar">
              <img src={getSpeakerImage('tom')} alt="Tom Avatar" />
            </div>
          </div>

          <div className="news-panel">
            <div className="news-navigation">
              <span className="news-indicator">
                {state.news.length > 0 ? `${state.activeNewsIndex + 1} / ${state.news.length}` : 'Loading...'}
              </span>
              <span className="news-status">
                {state.isDebating ? `Discussing Topic ${state.activeNewsIndex + 1}` : 'Auto-rotating topics'}
              </span>
            </div>
            <div id="news-content">
              {renderNewsContent()}
            </div>
          </div>

          <div className={`commentator mark ${state.speakersState.mark.animationState === 'speaking' ? 'speaking' : ''}`}>
            <h2>Mark</h2>
            <div className="avatar">
              <img src={getSpeakerImage('mark')} alt="Mark Avatar" />
            </div>
          </div>
        </div>
      </div>

      <div id="transcript">
        {/* 只显示当前正在播放语音的字幕 */}
        {(() => {
          // 记录当前所有角色的状态
          console.log(`[UI] Current speaker states:`, {
            moderator: state.speakersState.moderator.animationState,
            tom: state.speakersState.tom.animationState,
            mark: state.speakersState.mark.animationState
          });
          
          // 找到正在播放语音的角色
          const activeSpeaker = Object.keys(state.speakersState).find(speaker => 
            state.speakersState[speaker as Speaker]?.animationState === 'speaking'
          ) as Speaker | undefined;
          
          console.log(`[UI] Active speaker (speaking): ${activeSpeaker}`);
          
          if (activeSpeaker) {
            // 从对话记录中找到该角色的最新发言
            const currentEntry = [...state.conversation]
              .reverse()
              .find(entry => entry.speaker === activeSpeaker);
            
            console.log(`[UI] Found subtitle for ${activeSpeaker}:`, currentEntry?.text?.substring(0, 50));
            
            if (currentEntry) {
              return (
                <div key={`${activeSpeaker}-speaking`} className={`message ${activeSpeaker} current speaking`}>
                  <div className={`speaker-name ${activeSpeaker}`}>
                    {activeSpeaker.toUpperCase()}
                  </div>
                  <div className="subtitle-text">{currentEntry.text}</div>
                </div>
              );
            }
          }
          
          // 检查是否有人在思考
          const thinkingSpeakers = Object.keys(state.speakersState).filter(speaker => 
            state.speakersState[speaker as Speaker]?.animationState === 'thinking'
          );
          
          console.log(`[UI] Thinking speakers:`, thinkingSpeakers);
          
          // 如果没有人在说话，显示提示信息
          return (
            <div className="no-current-speaker">
              <p style={{ color: '#666', textAlign: 'center', padding: '20px', opacity: 0.7 }}>
                {state.conversation.length === 0 
                  ? 'Press Start Discussion to begin...' 
                  : (thinkingSpeakers.length > 0
                      ? `Generating response (${thinkingSpeakers.join(', ')})...`
                      : 'Preparing next speaker...'
                    )
                }
              </p>
            </div>
          );
        })()}
      </div>

      <div className="controls">
        <button onClick={startDiscussion} disabled={state.isDebating}>
          Start Discussion
        </button>
      </div>
    </div>
  )
}
