import { getIndexTTSIntegratedService } from '../indexTTS-integrated-service';

export class AudioGenerationService {

  /**
   * Static entry point to generate a single audio file for a given text and speaker.
   * This is the new, stateless interface for the orchestrator to call.
   * @returns The URL of the generated audio file.
   */
  public static async generateAudio(text: string, speaker: string): Promise<string> {
    console.log(`[AudioService] Generating audio for speaker "${speaker}"...`);
    try {
      // This service now handles a single audio generation, not a whole task.
      const indexTTSService = getIndexTTSIntegratedService();

      const result = await indexTTSService.generateSpeech(text, speaker, { 
        emotion: 'neutral',
        speed: 1.0 
      });

      if (result.success && result.audioUrl) {
        console.log(`[AudioService] ✅ Audio generated successfully for speaker "${speaker}".`);
        return result.audioUrl;
      } else {
        throw new Error(result.error || 'Audio generation failed for an unknown reason.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[AudioService] 💥 Audio generation failed for speaker "${speaker}":`, errorMessage);
      throw error; // Re-throw the error to be caught by the orchestrator
    }
  }
}