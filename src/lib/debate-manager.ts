/**
 * 辩论管理器
 * 
 * 职责：
 * 1. 管理辩论流程
 * 2. 协调角色发言
 * 3. 维护对话状态
 * 4. 确保辩论质量
 */

import { Speaker } from '@/types'
import { generateAIResponse } from '@/services/ai-client'
import { 
  PromptManager, 
  DebateContext, 
  DebatePhase, 
  DEBATE_FLOW, 
  PHASE_SPEAKERS,
  ConversationTurn
} from '@/lib/prompt-manager'

export interface DebateResponse {
  speaker: Speaker
  text: string
  phase: DebatePhase
}

export interface DebateProgress {
  currentPhase: DebatePhase
  totalPhases: number
  currentPhaseIndex: number
  isComplete: boolean
}

export class DebateManager {
  private promptManager: PromptManager
  private context: DebateContext
  private currentPhaseIndex: number = 0

  constructor(topic: string) {
    this.promptManager = PromptManager.getInstance()
    this.context = {
      topic,
      currentTurn: 0,
      history: []
    }
  }

  /**
   * 获取当前辩论进度
   */
  getProgress(): DebateProgress {
    return {
      currentPhase: DEBATE_FLOW[this.currentPhaseIndex],
      totalPhases: DEBATE_FLOW.length,
      currentPhaseIndex: this.currentPhaseIndex,
      isComplete: this.currentPhaseIndex >= DEBATE_FLOW.length
    }
  }

  /**
   * 获取当前主题
   */
  getTopic(): string {
    return this.context.topic
  }

  /**
   * 获取对话历史
   */
  getHistory(): ConversationTurn[] {
    return [...this.context.history]
  }

  /**
   * 执行下一个辩论阶段
   */
  async executeNextPhase(): Promise<DebateResponse | null> {
    if (this.currentPhaseIndex >= DEBATE_FLOW.length) {
      return null // 辩论已结束
    }

    const currentPhase = DEBATE_FLOW[this.currentPhaseIndex]
    const speaker = PHASE_SPEAKERS[currentPhase]

    try {
      // 生成针对当前阶段的prompt
      const phasePrompt = this.promptManager.generatePhasePrompt(currentPhase, this.context)
      
      // 调用AI生成回应
      const response = await generateAIResponse(
        speaker, 
        phasePrompt, 
        this.context.topic,
        this.context.history
      )

      // 验证回应
      const validation = this.promptManager.validateResponse(response, speaker)
      if (!validation.isValid) {
        console.warn(`Response validation failed for ${speaker} in ${currentPhase}:`, validation.issues)
      }

      // 使用处理后的文本
      const processedResponse = validation.processedResponse

      // 添加到历史记录
      const turn: ConversationTurn = { speaker, text: processedResponse }
      this.context.history.push(turn)
      this.context.currentTurn++

      // 移动到下一阶段
      this.currentPhaseIndex++

      return {
        speaker,
        text: processedResponse,
        phase: currentPhase
      }

    } catch (error) {
      console.error(`Error in debate phase ${currentPhase}:`, error)
      throw new Error(`Failed to execute debate phase: ${currentPhase}`)
    }
  }

  /**
   * 执行完整的辩论
   */
  async executeFullDebate(): Promise<DebateResponse[]> {
    const responses: DebateResponse[] = []

    while (!this.getProgress().isComplete) {
      const response = await this.executeNextPhase()
      if (response) {
        responses.push(response)
      }
    }

    return responses
  }

  /**
   * 重置辩论状态
   */
  reset(newTopic?: string): void {
    if (newTopic) {
      this.context.topic = newTopic
    }
    this.context.history = []
    this.context.currentTurn = 0
    this.currentPhaseIndex = 0
  }

  /**
   * 获取辩论摘要
   */
  getSummary(): {
    topic: string
    totalTurns: number
    speakers: Speaker[]
    phases: DebatePhase[]
  } {
    const speakers = Array.from(new Set(this.context.history.map(h => h.speaker)))
    const phases = DEBATE_FLOW.slice(0, this.currentPhaseIndex)

    return {
      topic: this.context.topic,
      totalTurns: this.context.history.length,
      speakers,
      phases
    }
  }

  /**
   * 获取特定发言人的所有发言
   */
  getSpeakerContributions(speaker: Speaker): ConversationTurn[] {
    return this.context.history.filter(turn => turn.speaker === speaker)
  }

  /**
   * 检查辩论是否可以继续
   */
  canContinue(): boolean {
    return this.currentPhaseIndex < DEBATE_FLOW.length
  }

  /**
   * 获取下一个发言人
   */
  getNextSpeaker(): Speaker | null {
    if (!this.canContinue()) return null
    
    const nextPhase = DEBATE_FLOW[this.currentPhaseIndex]
    return PHASE_SPEAKERS[nextPhase]
  }

  /**
   * 获取下一个阶段信息
   */
  getNextPhase(): DebatePhase | null {
    if (!this.canContinue()) return null
    return DEBATE_FLOW[this.currentPhaseIndex]
  }
}
