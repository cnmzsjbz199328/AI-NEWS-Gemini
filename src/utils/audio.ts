/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Audio utilities for handling speech synthesis
 */
export class AudioUtils {
  private static instance: AudioUtils;
  private audioContext: AudioContext;
  private nextAudioStartTime = 0;

  private constructor() {
    this.audioContext = new (window.AudioContext || 
      (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }

  static getInstance(): AudioUtils {
    if (!AudioUtils.instance) {
      AudioUtils.instance = new AudioUtils();
    }
    return AudioUtils.instance;
  }

  async resumeContext(): Promise<void> {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  closeContext(): void {
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }

  base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async playAudioBuffer(audioData: string): Promise<void> {
    try {
      const audioBuffer = await this.audioContext.decodeAudioData(
        this.base64ToArrayBuffer(audioData)
      );
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      const playTime = this.nextAudioStartTime === 0
        ? this.audioContext.currentTime
        : this.nextAudioStartTime;

      source.start(playTime);
      this.nextAudioStartTime = playTime + audioBuffer.duration;
    } catch (error) {
      console.error('Error processing audio chunk:', error);
    }
  }

  resetAudioQueue(): void {
    this.nextAudioStartTime = 0;
  }

  getBufferTime(): number {
    return this.nextAudioStartTime - this.audioContext.currentTime;
  }
}
