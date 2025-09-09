/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NewsItem } from '../types';
import { RSS_CONFIG, API_CONFIG } from '../config';
import { TextUtils } from '../utils/helpers';

/**
 * News service for fetching and processing news data
 */
export class NewsService {
  private static instance: NewsService;

  private constructor() {}

  static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  async getNews(): Promise<NewsItem[]> {
    return this.fetchBBCNews();
  }

  async fetchBBCNews(): Promise<NewsItem[]> {
    try {
      // 添加时间戳参数避免缓存
      const timestamp = Date.now();
      const rssUrl = `${RSS_CONFIG.API_URL}${encodeURIComponent(RSS_CONFIG.BBC_RSS_URL)}&_t=${timestamp}`;
      
      console.log('[NEWS SERVICE] Fetching from URL:', rssUrl);
      
      const response = await fetch(rssUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch RSS feed.');
      }

      const data = await response.json();
      console.log('[NEWS SERVICE] RSS API response status:', data.status);
      console.log('[NEWS SERVICE] RSS feed lastBuildDate:', data.feed?.lastBuildDate);
      console.log('[NEWS SERVICE] First item pubDate:', data.items?.[0]?.pubDate);
      
      if (data.status !== 'ok' || !data.items) {
        throw new Error('Failed to parse RSS feed.');
      }

      return this.processNewsItems(data.items);
    } catch (error) {
      console.error('Error fetching news:', error);
      throw new Error('Unable to load BBC news. There was an error fetching the news feed.');
    }
  }

  private processNewsItems(items: any[]): NewsItem[] {
    const newsItems: NewsItem[] = [];
    
    console.log('[NEWS SERVICE] Processing RSS items, total count:', items.length);
    
    for (let i = 0; i < Math.min(API_CONFIG.MAX_NEWS_ITEMS, items.length); i++) {
      const item = items[i];
      const title = item.title || 'No title';
      const description = item.description || 'No description available';
      const pubDate = item.pubDate || '';
      const thumbnailUrl = item.thumbnail || '';

      const cleanDescription = TextUtils.cleanDescription(description);
      const date = TextUtils.formatDate(pubDate);
      
      console.log(`[NEWS SERVICE] Item ${i + 1}:`, {
        title: title.substring(0, 50) + '...',
        pubDate,
        formattedDate: date
      });

      newsItems.push({
        title,
        description: cleanDescription,
        date,
        thumbnailUrl
      });
    }

    return newsItems;
  }
}
