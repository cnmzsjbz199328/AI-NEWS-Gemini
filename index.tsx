/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/* tslint:disable */
import {Chat, GoogleGenAI, Modality, Session} from '@google/genai';
import {LitElement, html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';

const MODERATOR_PERSONALITY = `You are a balanced, wise, and fair news moderator. Your goal is to facilitate a healthy debate. 
- Introduce the topic clearly.
- Ask probing questions to each panelist.
- Keep the conversation flowing and on topic.
- Ensure both sides get to speak.
- Summarize the discussion at the end.
- You are impartial and do not take sides.
- Keep your introduction and summary concise, under 150 characters.`;

const TOM_PERSONALITY = `You are Tom, a progressive, analytical, and data-driven commentator. 
- You are optimistic about technology and innovation.
- You support your arguments with logic, statistics, and future-forward thinking.
- You believe AI can enhance journalism by removing bias and increasing efficiency.
- Your tone is calm, insightful, and confident.
- Keep your responses concise and under 150 characters.`;

const MARK_PERSONALITY = `You are Mark, a pragmatic, traditional, and experience-focused commentator.
- You are skeptical of new technology until it's proven.
- You value human experience, journalistic integrity, and the stories behind the news.
- You worry AI could lead to job losses, misinformation, and a lack of accountability in media.
- Your tone is passionate, grounded, and slightly cautious.
- Keep your responses concise and under 150 characters.`;

type Speaker = 'moderator' | 'tom' | 'mark';
type ConversationEntry = {speaker: Speaker; text: string};
type NewsItem = {
  title: string;
  description: string;
  date: string;
  thumbnailUrl: string;
};

@customElement('ai-news-commentary')
export class AiNewsCommentary extends LitElement {
  @state() status = 'Ready to start discussion';
  @state() error = '';
  @state() currentMessage: ConversationEntry | null = null;
  @state() currentSpeaker: Speaker | 'none' = 'none';
  @state() isDebating = false;
  @state() news: NewsItem[] = [];
  @state() newsError = '';
  @state() activeNewsIndex = 0;

  private ai: GoogleGenAI;
  private moderatorChat: Chat;
  private tomChat: Chat;
  private markChat: Chat;

  private audioContext: AudioContext;
  private slideshowInterval?: ReturnType<typeof setTimeout>;
  private nextAudioStartTime = 0; // Property to manage audio queue

  constructor() {
    super();
    this.initClient();
    // As per the documentation, the Gemini API outputs audio at a 24000Hz sample rate.
    // The AudioContext used for decoding must be initialized with the same sample rate,
    // otherwise, `decodeAudioData` will fail.
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)({sampleRate: 24000});
  }

  // Render in Light DOM to allow global styles
  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.fetchBBCNews();
    // Refresh news every 10 minutes
    setInterval(() => this.fetchBBCNews(), 600000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.slideshowInterval) clearInterval(this.slideshowInterval);
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }

  private async fetchBBCNews() {
    try {
      this.newsError = '';
      if (this.slideshowInterval) clearInterval(this.slideshowInterval);

      // Use a more reliable RSS-to-JSON service to avoid proxy failures.
      const apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=';
      const rssUrl = 'https://feeds.bbci.co.uk/news/rss.xml';
      const response = await fetch(apiUrl + encodeURIComponent(rssUrl));
      if (!response.ok) throw new Error('Failed to fetch RSS feed.');

      const data = await response.json();
      if (data.status !== 'ok' || !data.items) {
        throw new Error('Failed to parse RSS feed.');
      }
      const items = data.items;

      const newsItems: NewsItem[] = [];
      for (let i = 0; i < Math.min(5, items.length); i++) {
        const item = items[i];
        const title = item.title || 'No title';
        const description = item.description || 'No description available';
        const pubDate = item.pubDate || '';
        const thumbnailUrl = item.thumbnail || '';

        const cleanDescription = description.replace(/<[^>]*>/g, '').trim();
        const date = pubDate
          ? new Date(pubDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          : '';

        newsItems.push({title, description: cleanDescription, date, thumbnailUrl});
      }
      this.news = newsItems;

      if (this.news.length > 0) {
        this.activeNewsIndex = 0;
        this.slideshowInterval = setInterval(() => {
          this.activeNewsIndex = (this.activeNewsIndex + 1) % this.news.length;
        }, 7000);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      this.newsError =
        'Unable to load BBC news. There was an error fetching the news feed.';
    }
  }

  private async initClient() {
    try {
      this.ai = new GoogleGenAI({
        apiKey: process.env.API_KEY,
      });

      this.moderatorChat = this.ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {systemInstruction: MODERATOR_PERSONALITY},
      });

      this.tomChat = this.ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {systemInstruction: TOM_PERSONALITY},
      });

      this.markChat = this.ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {systemInstruction: MARK_PERSONALITY},
      });
    } catch (e) {
      console.error(e);
      this.updateError(e.message);
    }
  }

  private updateStatus(msg: string) {
    this.status = msg;
  }

  private updateError(msg: string) {
    this.error = msg;
  }

  private async startDiscussion() {
    if (this.isDebating || this.news.length === 0) return;

    // Resume AudioContext if it was suspended by browser policy
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const currentNews = this.news[this.activeNewsIndex];
    const topic = `Title: ${currentNews.title}. Summary: ${currentNews.description}`;

    this.isDebating = true;
    this.currentMessage = null;
    this.updateStatus('The discussion is starting...');

    try {
      await this.runDebate(topic);
    } catch (e) {
      this.updateError(`An error occurred: ${e.message}`);
    } finally {
      this.isDebating = false;
      this.currentSpeaker = 'none';
      this.currentMessage = null; // Clear final subtitle
      this.updateStatus('Discussion finished. Click Start to begin again.');
    }
  }

  private async runDebate(topic: string) {
    const history: {speaker: Speaker; text: string}[] = [];
    const fullHistoryForContext = (
      currentSpeaker: Speaker,
      prompt: string,
    ) => {
      const context = history
        .map((msg) => `${msg.speaker}: ${msg.text}`)
        .join('\n\n');
      return `Here's the conversation so far:\n${context}\n\nAs ${currentSpeaker}, what is your response to the following prompt: "${prompt}"`;
    };

    // Round 1: Moderator introduces
    let prompt = `Introduce the topic for today's debate based on this news story: "${topic}". Then, ask Tom for his opening statement.`;
    let response = await this.generateResponse('moderator', prompt);
    history.push({speaker: 'moderator', text: response});

    // Round 2: Tom's opening
    prompt = `Give your opening statement on the topic.`;
    response = await this.generateResponse(
      'tom',
      fullHistoryForContext('tom', prompt),
    );
    history.push({speaker: 'tom', text: response});

    // Round 3: Mark responds directly to Tom
    prompt = `Directly respond to Tom's last statement.`;
    response = await this.generateResponse(
      'mark',
      fullHistoryForContext('mark', prompt),
    );
    history.push({speaker: 'mark', text: response});

    // Round 4: Tom responds directly to Mark
    prompt = `Directly respond to Mark's last statement.`;
    response = await this.generateResponse(
      'tom',
      fullHistoryForContext('tom', prompt),
    );
    history.push({speaker: 'tom', text: response});

    // Round 5: Moderator summarizes and concludes
    prompt = `Summarize the key points from both Tom and Mark, and provide a concluding thought to end the debate.`;
    response = await this.generateResponse(
      'moderator',
      fullHistoryForContext('moderator', prompt),
    );
    history.push({speaker: 'moderator', text: response});
  }

  private async generateResponse(
    speaker: Speaker,
    prompt: string,
  ): Promise<string> {
    this.updateStatus(
      `${speaker.charAt(0).toUpperCase() + speaker.slice(1)} is thinking...`,
    );

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
    }

    const result = await chat.sendMessage({message: prompt});
    const text = result.text.trim();

    // Do not try to speak empty text
    if (!text) {
      console.warn(`Received empty text response for ${speaker}. Skipping speech.`);
      this.currentSpeaker = 'none';
      return '';
    }

    this.currentMessage = {speaker, text};

    this.currentSpeaker = speaker;
    await this.speak(text, speaker);
    this.currentSpeaker = 'none';

    return text;
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private async speak(text: string, speaker: Speaker): Promise<void> {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    this.nextAudioStartTime = 0;
  
    return new Promise(async (resolve, reject) => {
      try {
        let systemInstruction: string;
        switch (speaker) {
          case 'moderator':
            systemInstruction = MODERATOR_PERSONALITY;
            break;
          case 'tom':
            systemInstruction = TOM_PERSONALITY;
            break;
          case 'mark':
            systemInstruction = MARK_PERSONALITY;
            break;
        }
  
        const narrationInstruction = ` You will be given a line of text. Your only task is to say this line of text out loud in character. Do not add any extra words or commentary.`;
        systemInstruction += narrationInstruction;
  
        const responseStream = await this.ai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents: {
            role: 'user',
            parts: [{text}],
          },
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: systemInstruction,
          },
        });
  
        for await (const chunk of responseStream) {
          const audio = chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData;
          if (audio?.data) {
            try {
              const audioBuffer = await this.audioContext.decodeAudioData(
                this.base64ToArrayBuffer(audio.data),
              );
              const source = this.audioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(this.audioContext.destination);
  
              const playTime =
                this.nextAudioStartTime === 0
                  ? this.audioContext.currentTime
                  : this.nextAudioStartTime;
  
              source.start(playTime);
              this.nextAudioStartTime = playTime + audioBuffer.duration;
            } catch (e) {
              console.error('Error processing audio chunk:', e);
              // Don't reject the whole promise, just log the chunk error.
            }
          }
        }
        // Resolve the promise once the stream is fully processed.
        // We can add a small delay to ensure the last audio chunk has time to play.
        const bufferTime = this.nextAudioStartTime - this.audioContext.currentTime;
        setTimeout(resolve, Math.max(0, bufferTime * 1000 + 200));
      } catch (error) {
        console.error('Speech generation failed:', error);
        reject(error); // Reject the promise on a fatal error
      }
    });
  }

  private renderNewsContent() {
    if (this.newsError) {
      return html`
        <div class="error">
          <h3>${this.newsError}</h3>
          <button class="refresh-btn" @click=${this.fetchBBCNews}>
            Try Again
          </button>
        </div>
      `;
    }

    if (this.news.length === 0) {
      return html`<div class="loading">Loading BBC news</div>`;
    }

    return this.news.map(
      (item, index) => html`
        <div
          class="news-item ${index === this.activeNewsIndex ? 'active' : ''}"
        >
          ${item.thumbnailUrl
            ? html`<img
                src="${item.thumbnailUrl}"
                class="news-thumbnail"
                alt="${item.title}"
              />`
            : ''}
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <div class="news-meta">
            <span>BBC News</span>
            <span>${item.date}</span>
          </div>
        </div>
      `,
    );
  }

  render() {
    return html`
      <div id="status">${this.error || this.status}</div>
      
      <div class="main-content">
        <div class="commentator moderator ${
          this.currentSpeaker === 'moderator' ? 'speaking' : ''
        }">
            <h2>Moderator</h2>
            <div class="avatar">
                <img src="/moderator.gif" alt="Moderator Avatar">
            </div>
        </div>
        <div class="studio-container">
          <div class="commentator tom ${
            this.currentSpeaker === 'tom' ? 'speaking' : ''
          }">
            <h2>Tom</h2>
            <div class="avatar">
              <img src="/tom.gif" alt="Tom Avatar">
            </div>
          </div>

          <div class="news-panel">
              <div id="news-content">
                ${this.renderNewsContent()}
              </div>
          </div>

          <div class="commentator mark ${
            this.currentSpeaker === 'mark' ? 'speaking' : ''
          }">
            <h2>Mark</h2>
            <div class="avatar">
               <img src="/mark.gif" alt="Mark Avatar">
            </div>
          </div>
        </div>
      </div>

      <div id="transcript">
        ${
          this.currentMessage
            ? html`
                <div class="message ${this.currentMessage.speaker}">
                  <div class="speaker-name ${this.currentMessage.speaker}">
                    ${this.currentMessage.speaker.toUpperCase()}
                  </div>
                  <div>${unsafeHTML(this.currentMessage.text)}</div>
                </div>
              `
            : ''
        }
      </div>

      <div class="controls">
        <button @click=${this.startDiscussion} ?disabled=${this.isDebating}>
          Start Discussion
        </button>
      </div>
    `;
  }
}