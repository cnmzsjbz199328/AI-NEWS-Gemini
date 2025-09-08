import { NextRequest, NextResponse } from 'next/server'
import { Speaker } from '@/types'

// 为每个角色配置不同的声音
const SPEAKER_VOICE_CONFIG = {
  moderator: {
    name: 'en-US-Studio-M', // 男性，权威感
    languageCode: 'en-US',
    ssmlGender: 'MALE' as const,
    speakingRate: 1.0,
    pitch: 0.0
  },
  tom: {
    name: 'en-US-Neural2-J', // 年轻男性，活泼
    languageCode: 'en-US', 
    ssmlGender: 'MALE' as const,
    speakingRate: 1.1,
    pitch: 2.0
  },
  mark: {
    name: 'en-US-Neural2-A', // 成熟男性，稳重
    languageCode: 'en-US',
    ssmlGender: 'MALE' as const, 
    speakingRate: 0.9,
    pitch: -1.0
  }
}

/**
 * 生成JWT token用于Google Cloud认证
 */
async function generateJWT(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const expiry = now + 3600 // 1 hour

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }

  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: expiry,
    iat: now,
  }

  // 编码header和payload
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signingInput = `${encodedHeader}.${encodedPayload}`

  // 处理私钥格式
  const privateKeyFormatted = privateKey
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
  const encodedSignature = base64UrlEncode(signatureString)

  return `${signingInput}.${encodedSignature}`
}

/**
 * Base64 URL 编码
 */
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * 获取Google Cloud访问令牌
 */
async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const jwt = await generateJWT(clientEmail, privateKey)
  
  // 添加重试机制
  const maxRetries = 3
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Authentication attempt ${attempt}/${maxRetries}`)
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }),
        // 增加超时控制
        signal: AbortSignal.timeout(15000), // 15秒超时
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Token request failed: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      console.log(`Authentication successful on attempt ${attempt}`)
      return data.access_token
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`Authentication attempt ${attempt} failed:`, error)
      
      if (attempt === maxRetries) {
        throw new Error(`Authentication failed after ${maxRetries} attempts: ${errorMessage}`)
      }
      
      // 指数退避重试：1秒、2秒、4秒
      const delay = Math.pow(2, attempt - 1) * 1000
      console.log(`Retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  // 不应该到达这里，但为了TypeScript类型安全
  throw new Error('Authentication failed: maximum retries exceeded')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, speaker } = body

    if (!text || !speaker) {
      return NextResponse.json(
        { error: 'Text and speaker are required' },
        { status: 400 }
      )
    }

    // 验证speaker类型
    if (!['moderator', 'tom', 'mark'].includes(speaker)) {
      return NextResponse.json(
        { error: 'Invalid speaker. Must be moderator, tom, or mark' },
        { status: 400 }
      )
    }

    // 检查Google Cloud credentials
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY

    if (!clientEmail || !privateKey) {
      console.error('Google Cloud credentials not found')
      return NextResponse.json(
        { error: 'TTS service not configured' },
        { status: 503 }
      )
    }

    console.log(`Generating speech for ${speaker}: "${text.substring(0, 50)}..."`)

    // 获取访问令牌
    const accessToken = await getAccessToken(clientEmail, privateKey)
    
    // 获取speaker配置
    const voiceConfig = SPEAKER_VOICE_CONFIG[speaker as keyof typeof SPEAKER_VOICE_CONFIG]

    // 调用Google Cloud TTS API
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

    const ttsResponse = await fetch(
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

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text()
      console.error(`TTS API failed: ${ttsResponse.status} ${errorText}`)
      return NextResponse.json(
        { error: 'TTS service temporarily unavailable' },
        { status: 503 }
      )
    }

    const ttsData = await ttsResponse.json()
    
    if (!ttsData.audioContent) {
      return NextResponse.json(
        { error: 'No audio content received from TTS API' },
        { status: 500 }
      )
    }

    // 解码base64音频数据
    const audioData = Uint8Array.from(atob(ttsData.audioContent), c => c.charCodeAt(0))
    
    console.log(`Speech generated successfully for ${speaker}, size: ${audioData.length} bytes`)

    // 创建Blob并返回音频数据
    const audioBlob = new Blob([audioData], { type: 'audio/mpeg' })
    
    return new Response(audioBlob, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioData.length.toString(),
        'Cache-Control': 'public, max-age=3600', // 1小时缓存
      },
    })

  } catch (error) {
    console.error('Speech generation error:', error)
    
    // 根据错误类型返回不同的响应
    if (error instanceof Error) {
      if (error.message.includes('Authentication failed')) {
        return NextResponse.json(
          { error: 'TTS authentication failed' },
          { status: 401 }
        )
      }
      if (error.message.includes('TTS API failed')) {
        return NextResponse.json(
          { error: 'TTS service temporarily unavailable' },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    )
  }
}
