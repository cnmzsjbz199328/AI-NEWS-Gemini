/**
 * Generation Manager - 生成管理器
 * 
 * 职责：
 * 1. 协调文本和语音生成
 * 2. 实现并行生成逻辑
 * 3. 管理角色间的上下文传递
 * 4. 控制整个辩论流程
 */

import { Speaker, AudioItem, ConversationEntry } from '@/types'
import { generateAIResponse, generateSpeech } from '@/services/ai-client'
import { AudioManager } from './audio-manager'
import { SpeakerStateManager } from './speaker-state-manager'

export class GenerationManager {
  private audioManager: AudioManager
  private speakerStateManager: SpeakerStateManager
  private sequenceCounter: number = 0
  private conversation: ConversationEntry[] = []
  private onConversationUpdate?: (conversation: ConversationEntry[]) => void

  constructor(audioManager: AudioManager, speakerStateManager: SpeakerStateManager) {
    this.audioManager = audioManager
    this.speakerStateManager = speakerStateManager
  }

  /**
   * 设置对话更新回调
   */
  setConversationUpdateCallback(callback: (conversation: ConversationEntry[]) => void): void {
    this.onConversationUpdate = callback
  }

  /**
   * 获取下一个序列号
   */
  private getNextSequenceNumber(): number {
    return this.sequenceCounter++
  }

  /**
   * 更新对话记录
   */
  private updateConversation(speaker: Speaker, text: string): void {
    this.conversation.push({ speaker, text })
    if (this.onConversationUpdate) {
      this.onConversationUpdate([...this.conversation])
    }
  }

  /**
   * 启动文本生成
   */
  async generateText(speaker: Speaker, topic: string, context: ConversationEntry[] = []): Promise<string> {
    console.log(`[GenerationManager] Starting text generation for ${speaker}`)
    
    // 设置思考状态
    this.speakerStateManager.setThinking(speaker)

    try {
      // 构建prompt
      const prompt = this.buildPrompt(speaker, topic, context)
      
      // 调用AI生成文本
      const text = await generateAIResponse(speaker, prompt, topic, this.conversation)
      
      console.log(`[GenerationManager] Text generated for ${speaker}: ${text.substring(0, 50)}...`)
      
      return text
    } catch (error) {
      console.error(`[GenerationManager] Text generation failed for ${speaker}:`, error)
      throw error
    }
  }

  /**
   * 启动语音生成（并行）
   */
  async generateAudio(speaker: Speaker, text: string, sequenceNumber: number): Promise<void> {
    console.log(`[GenerationManager] Starting audio generation for ${speaker}, sequence: ${sequenceNumber}`)
    
    // 设置语音生成状态
    this.speakerStateManager.setGeneratingAudio(speaker)

    try {
      // 调用语音生成API
      const audioBlob = await generateSpeech(text, speaker)
      
      if (audioBlob) {
        // 创建音频项目
        const audioItem: AudioItem = {
          id: `${speaker}-${sequenceNumber}-${Date.now()}`,
          speaker,
          text,
          audioBlob,
          sequenceNumber,
          state: 'ready',
          timestamp: Date.now()
        }

        // 添加到播放队列
        this.audioManager.addAudioItem(audioItem)
        
        console.log(`[GenerationManager] Audio generated for ${speaker}, added to queue`)
      } else {
        console.warn(`[GenerationManager] No audio generated for ${speaker}`)
      }
    } catch (error) {
      console.error(`[GenerationManager] Audio generation failed for ${speaker}:`, error)
      // 即使语音生成失败，也要让角色进入静态状态
      setTimeout(() => this.speakerStateManager.setStatic(speaker), 3000)
    }
  }

  /**
   * 触发下一角色（并行）
   */
  triggerNextSpeaker(currentSpeaker: Speaker, newText: string, topic: string): void {
    const nextSpeaker = this.getNextSpeaker(currentSpeaker)
    if (!nextSpeaker) {
      console.log('[GenerationManager] No next speaker, debate may be ending')
      return
    }

    console.log(`[GenerationManager] Triggering next speaker: ${nextSpeaker}`)
    
    // 异步启动下一角色的生成过程
    setTimeout(() => {
      this.executeSpeakerTurn(nextSpeaker, topic, [...this.conversation])
        .catch(error => {
          console.error(`[GenerationManager] Error in next speaker turn:`, error)
        })
    }, 100) // 短暂延迟确保状态更新
  }

  /**
   * 执行完整发言流程
   */
  async executeSpeakerTurn(speaker: Speaker, topic: string, context: ConversationEntry[] = []): Promise<void> {
    try {
      console.log(`[GenerationManager] Executing turn for ${speaker}`)
      
      // 检查是否可以开始
      if (!this.speakerStateManager.canStartThinking(speaker)) {
        console.warn(`[GenerationManager] ${speaker} cannot start thinking, current state:`, 
          this.speakerStateManager.getSpeakerState(speaker))
        return
      }

      // 1. 生成文本
      const text = await this.generateText(speaker, topic, context)
      
      // 2. 立即更新对话记录
      this.updateConversation(speaker, text)
      
      // 3. 获取序列号
      const sequenceNumber = this.getNextSequenceNumber()
      
      // 4. 并行启动两个流程
      const audioPromise = this.generateAudio(speaker, text, sequenceNumber)
      const nextSpeakerPromise = Promise.resolve().then(() => {
        this.triggerNextSpeaker(speaker, text, topic)
      })
      
      // 等待语音生成完成，但不等待下一角色
      await audioPromise
      
      console.log(`[GenerationManager] Turn completed for ${speaker}`)
      
    } catch (error) {
      console.error(`[GenerationManager] Error in speaker turn for ${speaker}:`, error)
      // 出错时确保角色回到静态状态
      this.speakerStateManager.setStatic(speaker)
    }
  }

  /**
   * 构建提示词
   */
  private buildPrompt(speaker: Speaker, topic: string, context: ConversationEntry[]): string {
    if (this.conversation.length === 0) {
      // 第一次发言
      return `Introduce today's debate topic: "${topic}". Briefly explain the key issue and ask Tom for his opening perspective.`
    }
    
    // 根据对话历史构建上下文
    const recentContext = this.conversation.slice(-3)
      .map(entry => `${entry.speaker}: ${entry.text}`)
      .join('\n')
    
    return `Here's the recent conversation:\n${recentContext}\n\nContinue the debate about: "${topic}"`
  }

  /**
   * 获取下一个发言人
   */
  private getNextSpeaker(currentSpeaker: Speaker): Speaker | null {
    // 简单的轮转逻辑，可以根据需要调整
    const speakerOrder: Speaker[] = ['moderator', 'tom', 'mark']
    const currentIndex = speakerOrder.indexOf(currentSpeaker)
    
    if (currentIndex === -1) return null
    
    // 如果是主持人，下一个是tom
    if (currentSpeaker === 'moderator' && this.conversation.length === 1) {
      return 'tom'
    }
    
    // 如果是tom，下一个是mark
    if (currentSpeaker === 'tom' && this.conversation.length === 2) {
      return 'mark'
    }
    
    // tom和mark之间互相回应
    if (currentSpeaker === 'tom' && this.conversation.length > 2) {
      return 'mark'
    }
    if (currentSpeaker === 'mark') {
      return 'tom'
    }
    
    // 达到一定轮数后，让主持人总结
    if (this.conversation.length >= 5) {
      return 'moderator'
    }
    
    return null
  }

  /**
   * 启动完整辩论
   */
  async startDebate(topic: string): Promise<void> {
    console.log(`[GenerationManager] Starting debate on topic: ${topic}`)
    
    // 重置状态
    this.reset()
    
    // 从主持人开始
    await this.executeSpeakerTurn('moderator', topic)
  }

  /**
   * 重置生成器状态
   */
  reset(): void {
    console.log('[GenerationManager] Resetting generation manager')
    this.sequenceCounter = 0
    this.conversation = []
    this.speakerStateManager.resetAllStates()
    this.audioManager.clearQueue()
  }

  /**
   * 获取当前对话
   */
  getConversation(): ConversationEntry[] {
    return [...this.conversation]
  }

  /**
   * 获取辩论状态摘要
   */
  getDebateStatus(): {
    conversationLength: number
    sequenceCounter: number
    speakerStates: { [key in Speaker]: string }
    audioQueueStatus: { [key: number]: string }
  } {
    return {
      conversationLength: this.conversation.length,
      sequenceCounter: this.sequenceCounter,
      speakerStates: this.speakerStateManager.getStateSummary(),
      audioQueueStatus: this.audioManager.getQueueStatus()
    }
  }
}

// 单例实例
let instance: GenerationManager | null = null

export function getGenerationManager(
  audioManager?: AudioManager, 
  speakerStateManager?: SpeakerStateManager
): GenerationManager {
  if (!instance && audioManager && speakerStateManager) {
    instance = new GenerationManager(audioManager, speakerStateManager)
  }
  if (!instance) {
    throw new Error('GenerationManager not initialized. Please provide required managers.')
  }
  return instance
}

export function resetGenerationManager(): void {
  if (instance) {
    instance.reset()
    instance = null
  }
}
