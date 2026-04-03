/**
 * Google Cloud Text-to-Speech Service
 * Uses API key authentication (TTS_API_KEY env var)
 */

import { Speaker } from '@/types'

interface TTSVoiceConfig {
  name: string
  languageCode: string
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL'
  speakingRate: number
  pitch: number
}

// Per-call overrides from user settings
interface SpeakerVoiceOverride {
  voiceId?: string
  ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL'
  speed?: number
  pitch?: number
}

const SPEAKER_VOICE_CONFIG: Record<Speaker, TTSVoiceConfig> = {
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

  async synthesizeSpeech(speaker: Speaker, text: string, override?: SpeakerVoiceOverride): Promise<Uint8Array> {
    const defaults = SPEAKER_VOICE_CONFIG[speaker]

    const requestBody = {
      input: { text },
      voice: {
        languageCode: defaults.languageCode,
        name: override?.voiceId ?? defaults.name,
        ssmlGender: override?.ssmlGender ?? defaults.ssmlGender,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: override?.speed ?? defaults.speakingRate,
        pitch: override?.pitch ?? defaults.pitch,
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

    const binary = atob(data.audioContent)
    return Uint8Array.from(Array.from(binary), c => c.charCodeAt(0))
  }

  /**
   * Returns a base64 data URL suitable for storing in KV and playing directly in the browser.
   */
  async synthesizeToDataUrl(speaker: Speaker, text: string, override?: SpeakerVoiceOverride): Promise<string> {
    const audioBytes = await this.synthesizeSpeech(speaker, text, override)
    const base64 = btoa(Array.from(audioBytes, b => String.fromCharCode(b)).join(''))
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
