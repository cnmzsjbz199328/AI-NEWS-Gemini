/**
 * GET /api/voices - Returns available Google Cloud TTS voice configuration
 */

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    service: 'Google-Cloud-TTS',
    voices: {
      moderator: { name: 'en-US-Neural2-D', gender: 'MALE', style: 'authoritative' },
      tom: { name: 'en-US-Neural2-J', gender: 'MALE', style: 'energetic' },
      mark: { name: 'en-US-Neural2-A', gender: 'MALE', style: 'calm' },
    },
  })
}
