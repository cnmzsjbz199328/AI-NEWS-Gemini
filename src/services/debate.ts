/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Speaker, ConversationEntry, AppState } from '../types';
import { PERSONALITIES } from '../config';
import { NewsService } from '../services/news';
import { AIService } from '../services/ai';
import { ArrayUtils, TextUtils } from '../utils/helpers';

/**
 * Main business logic service for orchestrating debates
 */
export class DebateService {
  private static instance: DebateService;
  private newsService: NewsService;
  private aiService: AIService;
  private appState: AppState;

  private constructor() {
    this.newsService = NewsService.getInstance();
    this.aiService = AIService.getInstance();
    this.appState = {
      conversation: [],
      currentNewsIndex: 0,
      isDebating: false,
      newsItems: []
    };
  }

  static getInstance(): DebateService {
    if (!DebateService.instance) {
      DebateService.instance = new DebateService();
    }
    return DebateService.instance;
  }

  getAppState(): AppState {
    return this.appState;
  }

  updateConversation(entry: ConversationEntry): void {
    this.appState.conversation.push(entry);
    // Keep conversation length manageable
    if (this.appState.conversation.length > 50) {
      this.appState.conversation = this.appState.conversation.slice(-30);
    }
  }

  async loadNews(): Promise<void> {
    try {
      this.appState.newsItems = await this.newsService.getNews();
      this.appState.currentNewsIndex = 0;
    } catch (error) {
      console.error('Failed to load news:', error);
      throw error;
    }
  }

  async startDebate(): Promise<void> {
    if (this.appState.isDebating) {
      console.log('Debate already in progress');
      return;
    }

    if (this.appState.newsItems.length === 0) {
      await this.loadNews();
    }

    this.appState.isDebating = true;

    try {
      // Moderator introduces the topic
      await this.moderatorIntroduction();
      
      // Main debate rounds
      await this.conductDebateRounds();
      
      // Moderator conclusion
      await this.moderatorConclusion();
    } catch (error) {
      console.error('Debate failed:', error);
      throw error;
    } finally {
      this.appState.isDebating = false;
    }
  }

  private async moderatorIntroduction(): Promise<void> {
    const currentNews = this.appState.newsItems[this.appState.currentNewsIndex];
    const moderatorPrompt = `Good evening. Tonight we're discussing: "${currentNews.title}". ${currentNews.description} Please introduce this topic briefly and set the stage for Tom and Mark's debate. Keep your response under 150 characters, be concise and engaging.`;
    
    const response = await this.aiService.generateResponse('moderator', moderatorPrompt);
    this.updateConversation({ speaker: 'moderator', text: response });
    await this.aiService.generateSpeech(response, 'moderator');
  }

  private async conductDebateRounds(): Promise<void> {
    const speakers: Speaker[] = ['tom', 'mark'];
    const rounds = 5; // 增加到5轮以支持更多对话

    for (let round = 0; round < rounds; round++) {
      for (const speaker of speakers) {
        await this.speakerTurn(speaker);
        
        // Add pause between speakers
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  private async speakerTurn(speaker: Speaker): Promise<void> {
    const currentNews = this.appState.newsItems[this.appState.currentNewsIndex];
    const recentConversation = this.appState.conversation.slice(-5)
      .map(entry => `${entry.speaker}: ${entry.text}`)
      .join('\n');

    const prompt = `Based on the news: "${currentNews.title}" - ${currentNews.description}
Recent conversation:
${recentConversation}

Please provide your perspective as ${speaker}. IMPORTANT: Keep your response under 150 characters. Be concise, engaging, and direct. This is a multi-round debate, so make each response count.`;

    const response = await this.aiService.generateResponse(speaker, prompt);
    this.updateConversation({ speaker, text: response });
    await this.aiService.generateSpeech(response, speaker);
  }

  private async moderatorConclusion(): Promise<void> {
    const recentConversation = this.appState.conversation.slice(-6)
      .map(entry => `${entry.speaker}: ${entry.text}`)
      .join('\n');

    const prompt = `Based on this debate:
${recentConversation}

Please provide a brief, balanced conclusion that summarizes the key points discussed. Keep your response under 150 characters, be concise and impactful.`;

    const response = await this.aiService.generateResponse('moderator', prompt);
    this.updateConversation({ speaker: 'moderator', text: response });
    await this.aiService.generateSpeech(response, 'moderator');
  }

  async nextNews(): Promise<void> {
    if (this.appState.currentNewsIndex < this.appState.newsItems.length - 1) {
      this.appState.currentNewsIndex++;
    } else {
      // Reload news and reset index
      await this.loadNews();
    }
  }

  async stopDebate(): Promise<void> {
    this.appState.isDebating = false;
    this.aiService.cleanup();
  }

  async refreshNews(): Promise<void> {
    await this.loadNews();
  }

  clearConversation(): void {
    this.appState.conversation = [];
  }
}
