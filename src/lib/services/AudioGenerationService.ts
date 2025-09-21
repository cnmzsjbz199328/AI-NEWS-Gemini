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

      const result = await indexTTSService.generateSpeechForRole(text, speaker as any, { 
        emotion: 'neutral',
        speed: 1.0 
      });

      if (result.success && result.audioUrl) {
        // 将 HF 私有链接转换为本地代理链接
        const proxyUrl = this.convertToProxyUrl(result.audioUrl);
        console.log(`[AudioService] ✅ Audio generated successfully for speaker "${speaker}".`);
        console.log(`[AudioService] 🔄 Converted HF URL to proxy: ${proxyUrl}`);
        return proxyUrl;
      } else {
        throw new Error(result.error || 'Audio generation failed for an unknown reason.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[AudioService] 💥 Audio generation failed for speaker "${speaker}":`, errorMessage);
      throw error; // Re-throw the error to be caught by the orchestrator
    }
  }

  /**
   * 将 Hugging Face 私有链接转换为本地代理链接
   * 例：https://xxx.hf.space/file=xxx -> /api/audio/https://xxx.hf.space/file=xxx
   */
  private static convertToProxyUrl(hfUrl: string): string {
    // 如果已经是代理URL，直接返回，避免重复转换
    if (hfUrl.startsWith('/api/audio/') || hfUrl.startsWith('api/audio/')) {
      return hfUrl.startsWith('/') ? hfUrl : '/' + hfUrl; // 确保开头有斜杠
    }
    
    // 移除可能的协议前缀，然后重新添加以确保格式正确
    const cleanUrl = hfUrl.replace(/^https?:\/\//, '');
    return `/api/audio/https://${cleanUrl}`;
  }
}