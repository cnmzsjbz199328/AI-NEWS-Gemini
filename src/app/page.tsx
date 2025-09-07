'use client'

import { useState, useEffect } from 'react'
import { ConversationEntry, NewsItem, Speaker } from '@/types'

type AppState = {
  status: string
  error: string
  currentMessage: ConversationEntry | null
  currentSpeaker: Speaker | 'none'
  isDebating: boolean
  news: NewsItem[]
  newsError: string
  activeNewsIndex: number
}

export default function HomePage() {
  const [state, setState] = useState<AppState>({
    status: 'Ready to start discussion',
    error: '',
    currentMessage: null,
    currentSpeaker: 'none',
    isDebating: false,
    news: [],
    newsError: '',
    activeNewsIndex: 0
  })

  const updateStatus = (msg: string) => {
    setState((prev: AppState) => ({ ...prev, status: msg }))
  }

  const updateError = (msg: string) => {
    setState((prev: AppState) => ({ ...prev, error: msg }))
  }

  useEffect(() => {
    fetchNews()
    // 每10分钟刷新新闻
    const interval = setInterval(fetchNews, 600000)
    return () => clearInterval(interval)
  }, [])

  const fetchNews = async () => {
    try {
      setState((prev: AppState) => ({ ...prev, newsError: '' }))
      
      const response = await fetch('/api/news')
      if (!response.ok) {
        throw new Error('Failed to fetch news')
      }
      
      const newsItems: NewsItem[] = await response.json()
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
    if (state.isDebating || state.news.length === 0) return

    const currentNews = state.news[state.activeNewsIndex]
    const topic = `Title: ${currentNews.title}. Summary: ${currentNews.description}`

    setState((prev: AppState) => ({ 
      ...prev, 
      isDebating: true,
      currentMessage: null,
      error: ''
    }))
    updateStatus('The discussion is starting...')

    try {
      await runDebate(topic)
    } catch (e: any) {
      updateError(`An error occurred: ${e.message}`)
    } finally {
      setState((prev: AppState) => ({ 
        ...prev, 
        isDebating: false,
        currentSpeaker: 'none',
        currentMessage: null
      }))
      updateStatus('Discussion finished. Click Start to begin again.')
    }
  }

  const runDebate = async (topic: string) => {
    const history: { speaker: Speaker; text: string }[] = []
    
    const fullHistoryForContext = (currentSpeaker: Speaker, prompt: string) => {
      const context = history
        .map((msg) => `${msg.speaker}: ${msg.text}`)
        .join('\n\n')
      return `Here's the conversation so far:\n${context}\n\nAs ${currentSpeaker}, what is your response to the following prompt: "${prompt}"`
    }

    // 辩论流程
    let prompt = `Introduce the topic for today's debate based on this news story: "${topic}". Then, ask Tom for his opening statement.`
    let response = await generateResponse('moderator', prompt)
    history.push({ speaker: 'moderator', text: response })

    prompt = `Give your opening statement on the topic.`
    response = await generateResponse('tom', fullHistoryForContext('tom', prompt))
    history.push({ speaker: 'tom', text: response })

    prompt = `Directly respond to Tom's last statement.`
    response = await generateResponse('mark', fullHistoryForContext('mark', prompt))
    history.push({ speaker: 'mark', text: response })

    prompt = `Directly respond to Mark's last statement.`
    response = await generateResponse('tom', fullHistoryForContext('tom', prompt))
    history.push({ speaker: 'tom', text: response })

    prompt = `Summarize the key points from both Tom and Mark, and provide a concluding thought to end the debate.`
    response = await generateResponse('moderator', fullHistoryForContext('moderator', prompt))
    history.push({ speaker: 'moderator', text: response })
  }

  const generateResponse = async (speaker: Speaker, prompt: string): Promise<string> => {
    updateStatus(`${speaker.charAt(0).toUpperCase() + speaker.slice(1)} is thinking...`)

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speaker, prompt })
      })

      if (!response.ok) {
        throw new Error('AI response failed')
      }

      const { text } = await response.json()
      
      if (!text) {
        console.warn(`Received empty text response for ${speaker}. Skipping speech.`)
        return ''
      }

      setState((prev: AppState) => ({ 
        ...prev, 
        currentMessage: { speaker, text },
        currentSpeaker: speaker
      }))

      await speak(text, speaker)
      
      setState((prev: AppState) => ({ 
        ...prev, 
        currentSpeaker: 'none'
      }))

      return text
    } catch (error: any) {
      throw new Error(`Failed to generate response for ${speaker}: ${error.message}`)
    }
  }

  const speak = async (text: string, speaker: Speaker): Promise<void> => {
    try {
      const response = await fetch('/api/speech/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, speaker })
      })

      if (!response.ok) {
        throw new Error('Speech generation failed')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      await audio.play()
    } catch (error) {
      console.error('Speech generation error:', error)
    }
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
        <div className={`commentator moderator ${state.currentSpeaker === 'moderator' ? 'speaking' : ''}`}>
          <h2>Moderator</h2>
          <div className="avatar">
            <img src="/Senior Moderator.gif" alt="Moderator Avatar" />
          </div>
        </div>
        
        <div className="studio-container">
          <div className={`commentator tom ${state.currentSpeaker === 'tom' ? 'speaking' : ''}`}>
            <h2>Tom</h2>
            <div className="avatar">
              <img src="/Tom.gif" alt="Tom Avatar" />
            </div>
          </div>

          <div className="news-panel">
            <div id="news-content">
              {renderNewsContent()}
            </div>
          </div>

          <div className={`commentator mark ${state.currentSpeaker === 'mark' ? 'speaking' : ''}`}>
            <h2>Mark</h2>
            <div className="avatar">
              <img src="/Mark.gif" alt="Mark Avatar" />
            </div>
          </div>
        </div>
      </div>

      <div id="transcript">
        {state.currentMessage && (
          <div className={`message ${state.currentMessage.speaker}`}>
            <div className={`speaker-name ${state.currentMessage.speaker}`}>
              {state.currentMessage.speaker.toUpperCase()}
            </div>
            <div>{state.currentMessage.text}</div>
          </div>
        )}
      </div>

      <div className="controls">
        <button onClick={startDiscussion} disabled={state.isDebating}>
          Start Discussion
        </button>
      </div>
    </div>
  )
}
