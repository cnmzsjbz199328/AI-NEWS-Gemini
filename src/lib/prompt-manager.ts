/**
 * 统一的Prompt管理系统
 * 
 * 职责：
 * 1. 管理所有角色的系统指令
 * 2. 构建对话上下文
 * 3. 生成针对性的提示词
 * 4. 确保辩论围绕新闻主题进行
 */

import { Speaker } from '@/types'

export interface ConversationTurn {
  speaker: Speaker
  text: string
}

export interface DebateContext {
  topic: string
  currentTurn: number
  history: ConversationTurn[]
}

// 简化和重新设计的角色定义，重点强调新闻辩论功能
const SYSTEM_INSTRUCTIONS = {
  moderator: `You are a professional news debate moderator. 

CRITICAL RULES:
- Your response MUST be 300 characters or less
- Count every character including spaces and punctuation
- If you exceed 300 characters, your response will be truncated
- Use concise, professional language
- End responses naturally, no trailing text

Your role:
- Introduce news topics clearly
- Guide structured debates between panelists
- Ask follow-up questions focused on the news topic
- Summarize key points at the end
- Remain neutral and professional

STRICT LIMIT: 300 characters maximum. Keep it concise.`,

  tom: `You are Tom, a progressive news analyst.

CRITICAL RULES:
- Your response MUST be 300 characters or less
- Count every character including spaces and punctuation  
- If you exceed 300 characters, your response will be truncated
- Use concise, impactful language
- End responses naturally, no trailing text

Your perspective:
- Present optimistic, forward-looking perspectives
- Support arguments with logical reasoning
- Focus on potential benefits and opportunities
- Engage directly with your debate partner's points
- Stay strictly on the news topic being discussed

STRICT LIMIT: 300 characters maximum. Keep it concise.`,

  mark: `You are Mark, a conservative news analyst.

CRITICAL RULES:
- Your response MUST be 300 characters or less
- Count every character including spaces and punctuation
- If you exceed 300 characters, your response will be truncated
- Use concise, impactful language
- End responses naturally, no trailing text

Your perspective:
- Present cautious, traditional perspectives
- Highlight potential risks and challenges
- Value established practices and proven approaches
- Engage directly with your debate partner's points
- Stay strictly on the news topic being discussed

STRICT LIMIT: 300 characters maximum. Keep it concise.`
} as const

// 辩论阶段定义
export enum DebatePhase {
  INTRODUCTION = 'introduction',
  TOM_OPENING = 'tom_opening', 
  MARK_RESPONSE = 'mark_response',
  TOM_COUNTER = 'tom_counter',
  CONCLUSION = 'conclusion'
}

// 为每个阶段定义特定的prompt模板，都包含严格的字符限制
const PHASE_PROMPTS = {
  [DebatePhase.INTRODUCTION]: (topic: string) => 
    `Introduce today's debate topic: "${topic}". Briefly explain the key issue and ask Tom for his opening perspective. CRITICAL: Keep under 300 characters total.`,
    
  [DebatePhase.TOM_OPENING]: (topic: string) => 
    `Give your opening perspective on: "${topic}". Focus on the main benefits or opportunities you see. CRITICAL: Keep under 300 characters total.`,
    
  [DebatePhase.MARK_RESPONSE]: (topic: string, tomStatement: string) => 
    `Respond to Tom's perspective on "${topic}". Tom said: "${tomStatement}". Present your concerns or alternative viewpoint. CRITICAL: Keep under 300 characters total.`,
    
  [DebatePhase.TOM_COUNTER]: (topic: string, markStatement: string) => 
    `Counter Mark's concerns about "${topic}". Mark said: "${markStatement}". Address his points while maintaining your position. CRITICAL: Keep under 300 characters total.`,
    
  [DebatePhase.CONCLUSION]: (topic: string, tomView: string, markView: string) => 
    `Summarize the key debate points about "${topic}". Tom emphasized: "${tomView}". Mark highlighted: "${markView}". Provide a balanced conclusion. CRITICAL: Keep under 300 characters total.`
}

export class PromptManager {
  private static instance: PromptManager

  static getInstance(): PromptManager {
    if (!PromptManager.instance) {
      PromptManager.instance = new PromptManager()
    }
    return PromptManager.instance
  }

  /**
   * 获取角色的系统指令
   */
  getSystemInstruction(speaker: Speaker): string {
    return SYSTEM_INSTRUCTIONS[speaker]
  }

  /**
   * 根据辩论阶段生成特定的prompt
   */
  generatePhasePrompt(phase: DebatePhase, context: DebateContext): string {
    const { topic, history } = context

    switch (phase) {
      case DebatePhase.INTRODUCTION:
        return PHASE_PROMPTS[DebatePhase.INTRODUCTION](topic)

      case DebatePhase.TOM_OPENING:
        return PHASE_PROMPTS[DebatePhase.TOM_OPENING](topic)

      case DebatePhase.MARK_RESPONSE:
        const tomOpening = history.find(h => h.speaker === 'tom')?.text || ''
        return PHASE_PROMPTS[DebatePhase.MARK_RESPONSE](topic, tomOpening)

      case DebatePhase.TOM_COUNTER:
        const markResponse = history.filter(h => h.speaker === 'mark').slice(-1)[0]?.text || ''
        return PHASE_PROMPTS[DebatePhase.TOM_COUNTER](topic, markResponse)

      case DebatePhase.CONCLUSION:
        const tomPoints = history.filter(h => h.speaker === 'tom').map(h => h.text).join(' ')
        const markPoints = history.filter(h => h.speaker === 'mark').map(h => h.text).join(' ')
        return PHASE_PROMPTS[DebatePhase.CONCLUSION](topic, tomPoints, markPoints)

      default:
        throw new Error(`Unknown debate phase: ${phase}`)
    }
  }

  /**
   * 构建包含必要上下文的完整prompt
   */
  buildContextualPrompt(speaker: Speaker, basePrompt: string, context: DebateContext): string {
    const { topic, history } = context
    
    // 只包含最近几轮对话作为上下文，避免prompt过长
    const recentHistory = history.slice(-3)
    const conversationContext = recentHistory.length > 0 
      ? `\n\nRecent conversation:\n${recentHistory.map(h => `${h.speaker}: ${h.text}`).join('\n')}`
      : ''

    // 强制性字符限制提醒
    const characterLimit = `

🚨 ABSOLUTE REQUIREMENT 🚨
Your response MUST be 300 characters or less.
Character count includes spaces, punctuation, everything.
Responses over 300 characters will be automatically truncated.
Be concise and impactful.`

    return `Topic: "${topic}"${conversationContext}\n\nYour task: ${basePrompt}${characterLimit}`
  }

  /**
   * 验证回应是否符合要求
   */
  validateResponse(response: string, speaker: Speaker): {
    isValid: boolean
    issues: string[]
    processedResponse: string
  } {
    const issues: string[] = []
    let processedResponse = response.trim()

    // 更智能的长度检查：300字符限制（放宽一些）
    if (processedResponse.length > 300) {
      console.log(`Response too long (${processedResponse.length} chars), applying intelligent truncation...`)
      
      // 智能截断：优先在句子结尾截断
      const sentences = processedResponse.split(/[.!?]+/)
      let truncated = ''
      
      for (const sentence of sentences) {
        const cleanSentence = sentence.trim()
        if (!cleanSentence) continue
        
        const testSentence = truncated ? `${truncated}. ${cleanSentence}` : cleanSentence
        if (testSentence.length <= 280) { // 留出20字符余量
          truncated = testSentence
        } else {
          break
        }
      }
      
      // 如果智能截断后仍然为空或太短，使用词汇边界截断
      if (truncated.length < 50) {
        const words = processedResponse.split(' ')
        let wordTruncated = ''
        
        for (const word of words) {
          const testLength = wordTruncated ? `${wordTruncated} ${word}` : word
          if (testLength.length <= 280) {
            wordTruncated = testLength
          } else {
            break
          }
        }
        
        // 如果还是太短，使用强制截断
        if (wordTruncated.length < 50) {
          truncated = processedResponse.substring(0, 280)
        } else {
          truncated = wordTruncated
        }
      }
      
      // 确保以适当的标点结尾
      if (truncated && !truncated.match(/[.!?]$/)) {
        truncated += '.'
      }
      
      processedResponse = truncated
      console.log(`Response truncated from ${response.length} to ${processedResponse.length} characters`)
      issues.push(`Response truncated from ${response.length} to ${processedResponse.length} characters`)
    }

    // 检查是否为空
    if (!processedResponse.trim()) {
      issues.push('Empty response')
    }

    // 检查是否包含角色表演（避免"as Mark"等表述）
    if (processedResponse.toLowerCase().includes(`as ${speaker}`)) {
      issues.push('Contains meta-commentary about role')
    }

    return {
      isValid: issues.length === 0,
      processedResponse,
      issues
    }
  }

  /**
   * 生成强制性字符限制提醒
   */
  getCharacterLimitReminder(): string {
    return `
⚠️ CRITICAL CONSTRAINT ⚠️
- Maximum 300 characters TOTAL
- Count includes ALL characters: letters, spaces, punctuation
- Exceeding 300 characters = AUTOMATIC TRUNCATION
- Write concisely and end naturally
- No trailing text or explanations

CONFIRM: Your response will be 300 characters or less.`
  }

  /**
   * 为API调用添加强制性前缀
   */
  addStrictLimitPrefix(originalPrompt: string): string {
    const prefix = `URGENT: Respond in 300 characters or less. Count every character.

`
    return prefix + originalPrompt + `

Remember: 300 character limit is MANDATORY. Count carefully.`
  }
}

// 预定义的辩论流程
export const DEBATE_FLOW: DebatePhase[] = [
  DebatePhase.INTRODUCTION,
  DebatePhase.TOM_OPENING,
  DebatePhase.MARK_RESPONSE,
  DebatePhase.TOM_COUNTER,
  DebatePhase.CONCLUSION
]

// 阶段与发言人的映射
export const PHASE_SPEAKERS: Record<DebatePhase, Speaker> = {
  [DebatePhase.INTRODUCTION]: 'moderator',
  [DebatePhase.TOM_OPENING]: 'tom',
  [DebatePhase.MARK_RESPONSE]: 'mark',
  [DebatePhase.TOM_COUNTER]: 'tom',
  [DebatePhase.CONCLUSION]: 'moderator'
}
