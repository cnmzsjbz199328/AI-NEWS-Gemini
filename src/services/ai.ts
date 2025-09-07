/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Chat, GoogleGenAI, Modality } from '@google/genai';
import { Speaker, AIResponse } from '../types';
import { PERSONALITIES, API_CONFIG } from '../config';
import { AudioUtils } from '../utils/audio';

/**
 * AI service for handling chat and speech generation
 */
export class AIService {
  private static instance: AIService;
  private ai: GoogleGenAI;
  private moderatorChat: Chat;
  private tomChat: Chat;
  private markChat: Chat;
  private audioUtils: AudioUtils;

  private constructor() {
    this.audioUtils = AudioUtils.getInstance();
    this.initClient();
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private initClient(): void {
    try {
      // 在 Next.js API 路由中，这些应该通过环境变量获取
      // 客户端代码应该通过 API 路由调用，而不是直接初始化 AI 客户端
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error('Gemini API Key not found - this should only be used server-side');
      }

      this.ai = new GoogleGenAI({ apiKey });

      this.moderatorChat = this.ai.chats.create({
        model: API_CONFIG.GEMINI_MODEL,
        config: { systemInstruction: PERSONALITIES.MODERATOR },
      });

      this.tomChat = this.ai.chats.create({
        model: API_CONFIG.GEMINI_MODEL,
        config: { systemInstruction: PERSONALITIES.TOM },
      });

      this.markChat = this.ai.chats.create({
        model: API_CONFIG.GEMINI_MODEL,
        config: { systemInstruction: PERSONALITIES.MARK },
      });
    } catch (error) {
      console.error('Failed to initialize AI client:', error);
      throw error;
    }
  }

  async generateResponse(speaker: Speaker, prompt: string): Promise<string> {
    let chat: Chat;
    
    switch (speaker) {
      case 'moderator':
        chat = this.moderatorChat;
        break;
      case 'tom':
        chat = this.tomChat;
        break;
      case 'mark':
        chat = this.markChat;
        break;
      default:
        throw new Error(`Unknown speaker: ${speaker}`);
    }

    try {
      const result = await chat.sendMessage({ message: prompt });
      return result.text.trim();
    } catch (error) {
      console.error(`Error generating response for ${speaker}:`, error);
      throw error;
    }
  }

  async generateSpeech(text: string, speaker: Speaker): Promise<void> {
    if (!text.trim()) {
      console.warn(`Received empty text for ${speaker}. Skipping speech.`);
      return;
    }

    await this.audioUtils.resumeContext();
    this.audioUtils.resetAudioQueue();

    return new Promise(async (resolve, reject) => {
      try {
        let systemInstruction: string;
        
        switch (speaker) {
          case 'moderator':
            systemInstruction = PERSONALITIES.MODERATOR;
            break;
          case 'tom':
            systemInstruction = PERSONALITIES.TOM;
            break;
          case 'mark':
            systemInstruction = PERSONALITIES.MARK;
            break;
        }

        const narrationInstruction = ` You will be given a line of text. Your only task is to say this line of text out loud in character. Do not add any extra words or commentary.`;
        systemInstruction += narrationInstruction;

        const responseStream = await this.ai.models.generateContentStream({
          model: API_CONFIG.GEMINI_MODEL,
          contents: {
            role: 'user',
            parts: [{ text }],
          },
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: systemInstruction,
          },
        });

        for await (const chunk of responseStream) {
          const audio = chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData;
          if (audio?.data) {
            await this.audioUtils.playAudioBuffer(audio.data);
          }
        }

        // Add buffer time to ensure audio completes
        const bufferTime = this.audioUtils.getBufferTime();
        setTimeout(resolve, Math.max(0, bufferTime * 1000 + 200));
      } catch (error) {
        console.error('Speech generation failed:', error);
        reject(error);
      }
    });
  }

  cleanup(): void {
    this.audioUtils.closeContext();
  }
}
