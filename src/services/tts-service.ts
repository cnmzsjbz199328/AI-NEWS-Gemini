/**
 * Google Cloud Text-to-Speech Service
 * 基于TTS.md中的成功经验实现
 */

import { Speaker } from '@/types'

interface TTSConfig {
  text: string
  languageCode: string
  voiceName: string
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL'
  audioEncoding: 'MP3' | 'LINEAR16' | 'OGG_OPUS'
  speakingRate?: number
  pitch?: number
}

interface VoiceConfig {
  name: string
  languageCode: string
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL'
  speakingRate: number
  pitch: number
}

// 为每个角色配置不同的声音
const SPEAKER_VOICE_CONFIG: Record<Speaker, VoiceConfig> = {
  moderator: {
    name: 'en-US-Studio-M', // 男性，权威感
    languageCode: 'en-US',
    ssmlGender: 'MALE',
    speakingRate: 1.0,
    pitch: 0.0
  },
  tom: {
    name: 'en-US-Neural2-J', // 年轻男性，活泼
    languageCode: 'en-US', 
    ssmlGender: 'MALE',
    speakingRate: 1.1,
    pitch: 2.0
  },
  mark: {
    name: 'en-US-Neural2-A', // 成熟男性，稳重
    languageCode: 'en-US',
    ssmlGender: 'MALE', 
    speakingRate: 0.9,
    pitch: -1.0
  }
}

export class TTSService {
  private accessToken: string | null = null
  private tokenExpiryTime: number = 0

  constructor(
    private clientEmail: string,
    private privateKey: string
  ) {}

  /**
   * 获取访问令牌
   */
  private async getAccessToken(): Promise<string> {
    // 如果token仍然有效，直接返回
    if (this.accessToken && Date.now() < this.tokenExpiryTime - 60000) {
      return this.accessToken
    }

    try {
      const jwt = await this.generateJWT()
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Token request failed: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.tokenExpiryTime = Date.now() + (data.expires_in * 1000)
      
      return this.accessToken!
    } catch (error) {
      console.error('Failed to get access token:', error)
      throw new Error('Authentication failed')
    }
  }

  /**
   * 生成JWT token
   */
  private async generateJWT(): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    const expiry = now + 3600 // 1 hour

    const header = {
      alg: 'RS256',
      typ: 'JWT',
    }

    const payload = {
      iss: this.clientEmail,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: expiry,
      iat: now,
    }

    // 编码header和payload
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header))
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload))
    const signingInput = `${encodedHeader}.${encodedPayload}`

    // 导入私钥
    const privateKeyFormatted = this.privateKey
      .replace(/\\n/g, '\n')
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '')

    const keyData = Uint8Array.from(atob(privateKeyFormatted), c => c.charCodeAt(0))
    
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      keyData,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    )

    // 签名
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(signingInput)
    )

    const signatureArray = new Uint8Array(signature)
    const signatureString = Array.from(signatureArray, byte => String.fromCharCode(byte)).join('')
    const encodedSignature = this.base64UrlEncode(signatureString)

    return `${signingInput}.${encodedSignature}`
  }

  /**
   * Base64 URL 编码
   */
  private base64UrlEncode(str: string): string {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  /**
   * 为指定角色合成语音
   */
  async synthesizeSpeech(speaker: Speaker, text: string): Promise<Uint8Array> {
    try {
      const accessToken = await this.getAccessToken()
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
        'https://texttospeech.googleapis.com/v1/text:synthesize',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`TTS API failed: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      
      if (!data.audioContent) {
        throw new Error('No audio content received from TTS API')
      }

      // 解码base64音频数据
      const audioData = Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))
      return audioData

    } catch (error) {
      console.error(`TTS synthesis failed for ${speaker}:`, error)
      throw error
    }
  }

  /**
   * 获取可用的语音列表（用于调试）
   */
  async getAvailableVoices(languageCode: string = 'en-US'): Promise<any[]> {
    try {
      const accessToken = await this.getAccessToken()
      
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/voices?languageCode=${languageCode}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Voice list request failed: ${response.status}`)
      }

      const data = await response.json()
      return data.voices || []
    } catch (error) {
      console.error('Failed to get available voices:', error)
      return []
    }
  }
}

// 导出单例实例
export function createTTSService(): TTSService | null {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY

  if (!clientEmail || !privateKey) {
    console.error('Google Cloud credentials not found. Please set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY environment variables.')
    return null
  }

  return new TTSService(clientEmail, privateKey)
}
