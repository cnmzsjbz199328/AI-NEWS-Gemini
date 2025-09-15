/**
 * 音频生成服务 - 封装音频生成的完整逻辑
 * 包括调用TTS、处理超时和重试机制
 */

import { PipelineTask, AudioPlaylist } from '@/types'

export interface AudioGenerationResult {
  success: boolean
  audioPlaylist?: AudioPlaylist
  error?: string
  shouldRetry: boolean
}

export class AudioGenerationService {
  private readonly timeoutMs: number = 60000 // 60秒超时

  /**
   * 执行音频生成任务
   */
  public async execute(task: PipelineTask): Promise<AudioGenerationResult> {
    console.log(`🎵 Starting audio generation for task: ${task.id} in language: ${task.language}`)
    
    try {
      if (!task.script) {
        return {
          success: false,
          error: 'No script available for TTS generation',
          shouldRetry: false
        }
      }

      // 使用 IndexTTS 集成服务作为主力 TTS 服务
      const { getIndexTTSIntegratedService } = await import('../indexTTS-integrated-service')
      const indexTTSService = getIndexTTSIntegratedService()

      // 准备所有需要生成语音的文本项
      const ttsItems = [
        { speaker: 'moderator' as const, text: task.script.moderator_intro },
        ...task.script.conversation,
        { speaker: 'moderator' as const, text: task.script.moderator_outro }
      ]

      console.log(`🎵 Generating ${ttsItems.length} audio items for task: ${task.id} using IndexTTS`)

      // 使用 IndexTTS 批量生成语音（添加超时保护）
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`TTS generation timeout after ${this.timeoutMs / 1000} seconds`)), this.timeoutMs)
      })
      
      const batchResults = await Promise.race([
        indexTTSService.generateBatchSpeech(ttsItems, { 
          emotion: 'neutral',
          speed: 1.0 
        }),
        timeoutPromise
      ]) as any[]

      // 检查生成结果
      const successfulResults = batchResults.filter(r => r.success)
      const failedResults = batchResults.filter(r => !r.success)
      
      if (failedResults.length > 0) {
        console.warn(`⚠️ ${failedResults.length}/${ttsItems.length} IndexTTS generations failed for task: ${task.id}`)
        console.warn(`Failed results:`, failedResults.map(r => r.error).join(', '))
      }

      if (successfulResults.length === 0) {
        return {
          success: false,
          error: `All IndexTTS generations failed for task: ${task.id}`,
          shouldRetry: true
        }
      }

      // 构建音频播放列表（使用成功的结果）
      const audioPlaylist: AudioPlaylist = {
        moderator_intro: batchResults[0]?.success ? batchResults[0].audioUrl : '',
        conversation: batchResults.slice(1, -1)
          .filter(result => result.success)
          .map((result: any, index: number) => ({
            speaker: ttsItems[index + 1]?.speaker || 'tom',
            audioUrl: result.audioUrl,
            text: ttsItems[index + 1]?.text || ''
          })),
        moderator_outro: batchResults[batchResults.length - 1]?.success 
          ? batchResults[batchResults.length - 1].audioUrl 
          : ''
      }

      // 检查是否有关键音频缺失
      const criticalMissing = [
        !audioPlaylist.moderator_intro,
        !audioPlaylist.moderator_outro,
        audioPlaylist.conversation.length === 0
      ].filter(Boolean).length

      if (criticalMissing > 0) {
        console.error(`❌ Critical audio missing for task ${task.id}`)
        return {
          success: false,
          error: 'Failed to generate critical audio components',
          shouldRetry: true
        }
      }

      console.log(`✅ Audio generation completed for task: ${task.id} (${successfulResults.length}/${ttsItems.length} successful)`)
      
      return {
        success: true,
        audioPlaylist,
        shouldRetry: false
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.log(`💥 Audio generation failed for task ${task.id}:`, errorMessage)
      
      return {
        success: false,
        error: errorMessage,
        shouldRetry: true
      }
    }
  }

  /**
   * 设置超时时间
   */
  public setTimeout(timeoutMs: number): void {
    (this as any).timeoutMs = timeoutMs
  }

  /**
   * 获取当前超时时间
   */
  public getTimeout(): number {
    return this.timeoutMs
  }
}