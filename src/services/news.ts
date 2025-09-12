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
    // 并行获取ABC和BBC新闻，ABC在前，BBC在后
    const [abcNews, bbcNews] = await Promise.all([
      this.fetchABCNews(),
      this.fetchBBCNews()
    ]);
    
    // 合并新闻，ABC（前5条）+ BBC（后5条）
    return [...abcNews, ...bbcNews];
  }

  async fetchABCNews(): Promise<NewsItem[]> {
    try {
      // 添加时间戳参数避免缓存
      const timestamp = Date.now();
      const rssUrl = `${RSS_CONFIG.API_URL}${encodeURIComponent(RSS_CONFIG.ABC_RSS_URL)}&_t=${timestamp}`;
      
      console.log('[NEWS SERVICE] Fetching ABC news from URL:', rssUrl);
      
      const response = await fetch(rssUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch ABC RSS feed.');
      }

      const data = await response.json();
      console.log('[NEWS SERVICE] ABC RSS API response status:', data.status);
      
      if (data.status !== 'ok' || !data.items) {
        throw new Error('Failed to parse ABC RSS feed.');
      }

      return this.processNewsItems(data.items, 'ABC News', API_CONFIG.ABC_NEWS_COUNT);
    } catch (error) {
      console.error('Error fetching ABC news:', error);
      // 如果ABC获取失败，返回空数组而不是抛出错误
      return [];
    }
  }

  async fetchBBCNews(): Promise<NewsItem[]> {
    try {
      // 添加时间戳参数避免缓存
      const timestamp = Date.now();
      const rssUrl = `${RSS_CONFIG.API_URL}${encodeURIComponent(RSS_CONFIG.BBC_RSS_URL)}&_t=${timestamp}`;
      
      console.log('[NEWS SERVICE] Fetching BBC news from URL:', rssUrl);
      
      const response = await fetch(rssUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch BBC RSS feed.');
      }

      const data = await response.json();
      console.log('[NEWS SERVICE] BBC RSS API response status:', data.status);
      
      if (data.status !== 'ok' || !data.items) {
        throw new Error('Failed to parse BBC RSS feed.');
      }

      return this.processNewsItems(data.items, 'BBC News', API_CONFIG.BBC_NEWS_COUNT);
    } catch (error) {
      console.error('Error fetching BBC news:', error);
      // 如果BBC获取失败，返回空数组而不是抛出错误
      return [];
    }
  }

  private processNewsItems(items: any[], source: string, maxCount: number): NewsItem[] {
    const newsItems: NewsItem[] = [];
    
    console.log(`[NEWS SERVICE] Processing ${source} RSS items, total count:`, items.length);
    
    for (let i = 0; i < Math.min(maxCount, items.length); i++) {
      const item = items[i];
      const title = item.title || 'No title';
      const description = item.description || 'No description available';
      const pubDate = item.pubDate || '';
      const thumbnailUrl = item.thumbnail || '';

      const cleanDescription = TextUtils.cleanDescription(description);
      const date = TextUtils.formatDate(pubDate);
      
      console.log(`[NEWS SERVICE] ${source} Item ${i + 1}:`, {
        title: title.substring(0, 50) + '...',
        pubDate,
        formattedDate: date,
        source
      });

      newsItems.push({
        title,
        description: cleanDescription,
        date,
        thumbnailUrl,
        source // 添加新闻来源标识
      });
    }

    return newsItems;
  }
}
