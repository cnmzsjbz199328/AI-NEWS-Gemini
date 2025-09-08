/**
 * Speaker State Manager - 角色状态管理器
 * 
 * 职责：
 * 1. 管理所有角色的动画状态
 * 2. 处理状态转换逻辑
 * 3. 提供状态查询接口
 * 4. 通知状态变化
 */

import { Speaker, SpeakerState, SpeakersState, SpeakerAnimationState, GenerationState } from '@/types'

export class SpeakerStateManager {
  private speakersState: SpeakersState
  private onStateChange?: (state: SpeakersState) => void

  constructor(initialState?: SpeakersState) {
    this.speakersState = initialState || this.createInitialState()
  }

  /**
   * 创建初始状态
   */
  private createInitialState(): SpeakersState {
    const createInitialSpeakerState = (): SpeakerState => ({
      animationState: 'static',
      generationState: 'idle',
      lastTextGeneratedAt: undefined,
      lastAudioGeneratedAt: undefined,
      currentAudioId: undefined
    })

    return {
      moderator: createInitialSpeakerState(),
      tom: createInitialSpeakerState(),
      mark: createInitialSpeakerState()
    }
  }

  /**
   * 设置状态变化回调
   */
  setStateChangeCallback(callback: (state: SpeakersState) => void): void {
    this.onStateChange = callback
  }

  /**
   * 通知状态变化
   */
  private notifyStateChange(): void {
    // 记录状态变化
    const currentStates = Object.entries(this.speakersState).map(([speaker, state]) => 
      `${speaker}:${state.animationState}`
    ).join(', ');
    console.log(`[SpeakerStateManager] State changed - ${currentStates}`);
    
    if (this.onStateChange) {
      this.onStateChange({ ...this.speakersState })
    }
  }

  /**
   * 更新角色状态
   */
  private updateSpeakerState(speaker: Speaker, updates: Partial<SpeakerState>): void {
    const oldState = this.speakersState[speaker].animationState;
    const newState = updates.animationState || oldState;
    
    console.log(`[SpeakerStateManager] ${speaker}: ${oldState} → ${newState}`);
    
    this.speakersState[speaker] = {
      ...this.speakersState[speaker],
      ...updates
    }
    this.notifyStateChange()
  }

  /**
   * 设置角色为思考状态（开始生成文本）
   */
  setThinking(speaker: Speaker): void {
    console.log(`[SpeakerStateManager] Setting ${speaker} to thinking state`)
    this.updateSpeakerState(speaker, {
      animationState: 'thinking',
      generationState: 'generating_text'
    })
  }

  /**
   * 设置角色文本生成完成，开始语音生成
   */
  setGeneratingAudio(speaker: Speaker, textGeneratedAt: number = Date.now()): void {
    console.log(`[SpeakerStateManager] Setting ${speaker} to generating audio state`)
    this.updateSpeakerState(speaker, {
      animationState: 'thinking', // 仍然显示思考动画
      generationState: 'generating_audio',
      lastTextGeneratedAt: textGeneratedAt
    })
  }

  /**
   * 设置角色为发言状态（开始播放语音）
   */
  setSpeaking(speaker: Speaker, audioId: string): void {
    console.log(`[SpeakerStateManager] Setting ${speaker} to speaking state`)
    this.updateSpeakerState(speaker, {
      animationState: 'speaking',
      generationState: 'ready_to_play',
      currentAudioId: audioId,
      lastAudioGeneratedAt: Date.now()
    })
  }

  /**
   * 设置角色为静态状态（完成发言）
   */
  setStatic(speaker: Speaker): void {
    console.log(`[SpeakerStateManager] Setting ${speaker} to static state`)
    this.updateSpeakerState(speaker, {
      animationState: 'static',
      generationState: 'idle',
      currentAudioId: undefined
    })
  }

  /**
   * 获取角色当前状态
   */
  getSpeakerState(speaker: Speaker): SpeakerState {
    return { ...this.speakersState[speaker] }
  }

  /**
   * 获取所有角色状态
   */
  getAllStates(): SpeakersState {
    return { ...this.speakersState }
  }

  /**
   * 检查是否有角色正在思考或发言
   */
  isAnyoneActive(): boolean {
    return Object.values(this.speakersState).some(state => 
      state.animationState !== 'static'
    )
  }

  /**
   * 获取当前活跃的角色
   */
  getActiveSpeaker(): Speaker | null {
    for (const [speaker, state] of Object.entries(this.speakersState)) {
      if (state.animationState !== 'static') {
        return speaker as Speaker
      }
    }
    return null
  }

  /**
   * 重置所有状态
   */
  resetAllStates(): void {
    console.log('[SpeakerStateManager] Resetting all speaker states')
    this.speakersState = this.createInitialState()
    this.notifyStateChange()
  }

  /**
   * 检查角色是否可以开始思考
   */
  canStartThinking(speaker: Speaker): boolean {
    const state = this.speakersState[speaker]
    return state.generationState === 'idle' && state.animationState === 'static'
  }

  /**
   * 获取状态摘要（用于调试）
   */
  getStateSummary(): { [key in Speaker]: string } {
    const summary: { [key in Speaker]: string } = {} as any
    
    for (const [speaker, state] of Object.entries(this.speakersState)) {
      summary[speaker as Speaker] = `${state.animationState}/${state.generationState}`
    }
    
    return summary
  }
}

// 单例实例
let instance: SpeakerStateManager | null = null

export function getSpeakerStateManager(): SpeakerStateManager {
  if (!instance) {
    instance = new SpeakerStateManager()
  }
  return instance
}

export function resetSpeakerStateManager(): void {
  instance = null
}
