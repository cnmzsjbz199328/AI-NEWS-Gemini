import { useState, useEffect, useCallback } from 'react'
import { NewsItem } from '@/types'

interface UseNewsManagerReturn {
  news: NewsItem[]
  newsError: string
  activeNewsIndex: number
  isLoading: boolean
  fetchNews: () => Promise<void>
  setActiveNewsIndex: (index: number) => void
}

export function useNewsManager(): UseNewsManagerReturn {
  const [news, setNews] = useState<NewsItem[]>([])
  const [newsError, setNewsError] = useState<string>('')
  const [activeNewsIndex, setActiveNewsIndex] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const fetchNews = useCallback(async () => {
    try {
      setIsLoading(true)
      setNewsError('')
      
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
      
      setNews(newsItems)
      setActiveNewsIndex(0)
    } catch (error) {
      setNewsError('Unable to load BBC news. There was an error fetching the news feed.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNews()
    const interval = setInterval(fetchNews, 600000) // 每10分钟刷新新闻
    return () => clearInterval(interval)
  }, [fetchNews])

  return {
    news,
    newsError,
    activeNewsIndex,
    isLoading,
    fetchNews,
    setActiveNewsIndex
  }
}