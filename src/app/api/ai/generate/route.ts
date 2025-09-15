/**
 * DEPRECATED: This API route is no longer used after refactoring to one-shot generation
 * The new architecture uses PipelineScheduler with one-shot debate generation
 * TODO: Remove this file or redesign for new architecture
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This API endpoint is deprecated. Use /api/pipeline/start for debate generation.',
      message: 'The system now uses one-shot generation instead of incremental generation.'
    },
    { status: 410 } // Gone
  )
}