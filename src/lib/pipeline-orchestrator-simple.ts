import { TaskManager } from './managers/TaskManager';
import { TextGenerationService } from './services/TextGenerationService';
import { AudioGenerationService } from './services/AudioGenerationService';
import { VoiceConfig, SupportedLanguage, PipelineTask } from '@/types';

/**
 * Pipeline Orchestrator - Refactored for Statelessness
 *
 * This class is now a stateless service responsible for orchestrating the entire
 * news generation pipeline, from text generation to audio synthesis.
 * It uses the KV-backed TaskManager to persist and retrieve state at each step.
 */
export class PipelineOrchestrator {

  /**
   * Starts the entire pipeline for a given news topic.
   * This method is designed to be called from an API endpoint and run asynchronously.
   * It does not return data, but orchestrates the background process.
   *
   * @param newsTopic The topic for the news debate.
   * @param debateRounds The number of debate rounds.
   * @param voiceConfig The voice configuration for TTS.
   * @param language The language of the debate.
   */
  public static async run(newsTopic: string, debateRounds: number, voiceConfig: VoiceConfig, language: SupportedLanguage): Promise<void> {
    let taskId: string | null = null;
    try {
      // 1. Create and persist the initial task
      const task = await TaskManager.createTask(newsTopic, debateRounds, voiceConfig, language);
      taskId = task.id;
      if (!taskId) throw new Error('Task creation failed: taskId is null');

      // 2. Generate the debate script
      await TaskManager.updateTaskStatus(taskId, 'GENERATING_TEXT');
      const script = await TextGenerationService.generateDebateScript(newsTopic, debateRounds, language);
      await TaskManager.saveTaskScript(taskId, script);

      // 3. Generate audio for each part of the script
      await TaskManager.updateTaskStatus(taskId, 'GENERATING_AUDIO');

      // Generate moderator intro audio
      await this.generateAndSaveAudio(taskId, 'moderator_intro', script.moderator_intro, 'moderator', undefined, voiceConfig);

      // Generate conversation audio in parallel
      const conversationPromises = script.conversation.map((turn, index) =>
        this.generateAndSaveAudio(taskId!, 'conversation', turn.text, turn.speaker, index, voiceConfig)
      );
      await Promise.all(conversationPromises);

      // Generate moderator outro audio
      await this.generateAndSaveAudio(taskId, 'moderator_outro', script.moderator_outro, 'moderator', undefined, voiceConfig);

      // The final status update to READY_TO_PLAY is handled within TaskManager.addAudioSegment

    } catch (error) {
      console.error(`[Orchestrator] Pipeline failed for task ${taskId}:`, error);
      if (taskId) {
        await TaskManager.updateTaskStatus(taskId, 'FAILED', error instanceof Error ? error.message : String(error));
      }
    }
  }

  /**
   * A helper method to generate a single audio segment and save it via the TaskManager.
   */
  private static async generateAndSaveAudio(
    taskId: string,
    type: 'moderator_intro' | 'conversation' | 'moderator_outro',
    text: string,
    speaker: string,
    index?: number,
    voiceConfig?: VoiceConfig
  ): Promise<void> {
    try {
      const audioUrl = await AudioGenerationService.generateAudio(text, speaker, voiceConfig);
      await TaskManager.addAudioSegment(taskId, type, audioUrl, text, speaker, index);
    } catch (error) {
      // Log the error for the specific segment but don't fail the entire pipeline.
      // A more robust solution might involve retrying or marking the segment as failed.
      console.error(`[Orchestrator] Failed to generate audio for task ${taskId}, segment ${index ?? type}:`, error);
      // We still add a "segment" with an error state to ensure the task completes.
      await TaskManager.addAudioSegment(taskId, type, 'error:generation_failed', text, speaker, index);
    }
  }
}
