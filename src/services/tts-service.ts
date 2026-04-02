/**
 * Google Cloud Text-to-Speech Service
 * Uses API key authentication (TTS_API_KEY env var)
 */

import { Speaker } from '@/types'

interface VoiceConfig {
  name: string
  languageCode: string
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL'
  speakingRate: number
  pitch: number
}

const SPEAKER_VOICE_CONFIG: Record<Speaker, VoiceConfig> = {
  moderator: {
    name: 'en-US-Neural2-D', // authoritative male voice (free tier)
    languageCode: 'en-US',
    ssmlGender: 'MALE',
    speakingRate: 1.0,
    pitch: 0.0,
  },
  tom: {
    name: 'en-US-Neural2-J', // younger male voice
    languageCode: 'en-US',
    ssmlGender: 'MALE',
    speakingRate: 1.1,
    pitch: 2.0,
  },
  mark: {
    name: 'en-US-Neural2-A', // mature male voice
    languageCode: 'en-US',
    ssmlGender: 'MALE',
    speakingRate: 0.9,
    pitch: -1.0,
  },
}

export class TTSService {
  constructor(private apiKey: string) {}

  async synthesizeSpeech(speaker: Speaker, text: string): Promise<Uint8Array> {
    const voiceConfig = SPEAKER_VOICE_CONFIG[speaker]

    const requestBody = {
      input: { text },
      voice: {
        languageCode: voiceConfig.languageCode,
        name: voiceConfig.name,
        ssmlGender: voiceConfig.ssmlGender,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: voiceConfig.speakingRate,
        pitch: voiceConfig.pitch,
      },
    }

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Google TTS API error ${response.status}: ${errorText}`)
    }

    const data = await response.json()

    if (!data.audioContent) {
      throw new Error('No audioContent in Google TTS response')
    }

    return Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))
  }

  /**
   * Returns a base64 data URL suitable for storing in KV and playing directly in the browser.
   */
  async synthesizeToDataUrl(speaker: Speaker, text: string): Promise<string> {
    const audioBytes = await this.synthesizeSpeech(speaker, text)
    const base64 = btoa(String.fromCharCode(...audioBytes))
    return `data:audio/mp3;base64,${base64}`
  }
}

export function createTTSService(): TTSService | null {
  const apiKey = process.env.TTS_API_KEY
  if (!apiKey) {
    console.error('TTS_API_KEY not set in environment variables')
    return null
  }
  return new TTSService(apiKey)
}
