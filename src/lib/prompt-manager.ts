/**
 * 一次性生成提示词管理器
 * 
 * 职责：
 * 1. 构建用于一次性生成完整辩论剧本的提示词
 * 2. 整合来自 config/index.ts 的角色定义
 * 3. 生成符合 DebateScript 格式的 JSON 输出指令
 */

import { SupportedLanguage } from '@/types'
import { PERSONALITIES } from '@/config'

export interface OneShotPromptOptions {
  newsTopic: string
  debateRounds: number
  language: SupportedLanguage
}

export class PromptManager {
  private static instance: PromptManager | null = null

  public static getInstance(): PromptManager {
    if (!PromptManager.instance) {
      PromptManager.instance = new PromptManager()
    }
    return PromptManager.instance
  }

  /**
   * 构建一次性生成完整辩论剧本的提示词
   */
  public buildOneShotDebatePrompt(options: OneShotPromptOptions): string {
    const { newsTopic, debateRounds, language } = options

    const languageInstructions = this.getLanguageInstructions(language)
    const jsonFormat = this.getExpectedJsonFormat(debateRounds)

    return `You are an expert scriptwriter creating a news debate show. Generate a complete debate script in JSON format.

## TOPIC
${newsTopic}

## CHARACTERS
${this.formatCharacterDescriptions()}

## REQUIREMENTS
- Generate exactly ${debateRounds} rounds of debate between Tom and Mark
- Each response must be under 150 characters (including spaces and punctuation)
- ${languageInstructions}
- The moderator introduces the topic, facilitates the debate, and provides a conclusion
- Tom and Mark should have opposing viewpoints and engage with each other's arguments
- Keep the debate focused on the news topic provided

## OUTPUT FORMAT
Return ONLY a valid JSON object in this exact structure:
${jsonFormat}

## IMPORTANT
- Do not include any text outside the JSON object
- Ensure all character limits are respected
- Make the debate engaging and substantive despite the length constraints
- Each speaker should maintain their distinct personality and viewpoint`
  }

  /**
   * 格式化角色描述
   */
  private formatCharacterDescriptions(): string {
    return `
**MODERATOR**: ${PERSONALITIES.MODERATOR}

**TOM**: ${PERSONALITIES.TOM}

**MARK**: ${PERSONALITIES.MARK}
    `.trim()
  }

  /**
   * 获取语言特定的指令
   */
  private getLanguageInstructions(language: SupportedLanguage): string {
    switch (language) {
      case 'zh-CN':
        return 'All dialogue must be in Chinese (Simplified)'
      case 'en-US':
        return 'All dialogue must be in English'
      default:
        return 'All dialogue must be in English'
    }
  }

  /**
   * 获取期望的JSON格式示例
   */
  private getExpectedJsonFormat(debateRounds: number): string {
    const conversationExample = []
    
    for (let i = 0; i < debateRounds; i++) {
      conversationExample.push(
        `    {"speaker": "tom", "text": "Tom's argument for round ${i + 1} (under 150 chars)"}`,
        `    {"speaker": "mark", "text": "Mark's counter-argument for round ${i + 1} (under 150 chars)"}`
      )
    }

    return `{
  "moderator_intro": "Moderator's introduction (under 150 characters)",
  "conversation": [
${conversationExample.join(',\n')}
  ],
  "moderator_outro": "Moderator's conclusion (under 150 characters)"
}`
  }

  /**
   * 验证生成的脚本格式
   */
  public validateDebateScript(scriptText: string): { isValid: boolean; error?: string } {
    try {
      const script = JSON.parse(scriptText)
      
      // 检查必需字段
      if (!script.moderator_intro || !script.conversation || !script.moderator_outro) {
        return { isValid: false, error: 'Missing required fields: moderator_intro, conversation, or moderator_outro' }
      }

      // 检查对话数组
      if (!Array.isArray(script.conversation)) {
        return { isValid: false, error: 'conversation must be an array' }
      }

      // 检查对话项格式
      for (const item of script.conversation) {
        if (!item.speaker || !item.text) {
          return { isValid: false, error: 'Each conversation item must have speaker and text fields' }
        }
        if (!['tom', 'mark'].includes(item.speaker)) {
          return { isValid: false, error: 'Speaker must be either "tom" or "mark"' }
        }
      }

      return { isValid: true }
    } catch (error) {
      return { isValid: false, error: 'Invalid JSON format' }
    }
  }
}