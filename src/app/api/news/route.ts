import { NextRequest, NextResponse } from 'next/server'
import { NewsService } from '@/services/news'

export async function GET() {
  try {
    const newsService = NewsService.getInstance()
    const newsItems = await newsService.getNews()
    
    return NextResponse.json(newsItems)
  } catch (error) {
    console.error('News API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
}
