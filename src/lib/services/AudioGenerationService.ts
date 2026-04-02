import { Speaker } from '@/types'
import { createTTSService } from '@/services/tts-service'

export class AudioGenerationService {
  /**
   * Generate audio for a single text/speaker pair.
   * Returns a base64 data URL that can be stored in KV and played directly by the browser.
   */
  public static async generateAudio(text: string, speaker: string): Promise<string> {
    const ttsService = createTTSService()
    if (!ttsService) {
      throw new Error('TTS service unavailable: TTS_API_KEY not set')
    }
    return ttsService.synthesizeToDataUrl(speaker as Speaker, text)
  }
}
