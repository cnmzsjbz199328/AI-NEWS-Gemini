import { NextRequest, NextResponse } from 'next/server';
import { TaskManager } from '@/lib/managers/TaskManager';
import { PipelineOrchestrator } from '@/lib/pipeline-orchestrator-simple';
import { VoiceConfig, SupportedLanguage } from '@/types';

interface StartPipelineRequest {
  newsTopic: string; // Changed from newsTopics array to a single topic
  debateRounds?: number;
  voiceConfig?: VoiceConfig;
  language?: SupportedLanguage;
}

/**
 * API Endpoint to start the generation pipeline.
 * POST /api/pipeline/start
 * 
 * This endpoint is now stateless and asynchronous.
 * It validates the request, creates a task record in KV, 
 * and immediately returns the taskId without waiting for the pipeline to finish.
 * The actual pipeline processing happens in the background.
 */
export async function POST(request: NextRequest) {
  console.log('[API /start] Received request to start pipeline');
  
  try {
    const body: StartPipelineRequest = await request.json();

    // --- Input Validation ---
    const { newsTopic, debateRounds = 2, voiceConfig, language = 'en-US' } = body;

    if (!newsTopic || typeof newsTopic !== 'string' || newsTopic.trim().length === 0) {
      return NextResponse.json({ error: 'newsTopic is required and must be a non-empty string' }, { status: 400 });
    }
    if (newsTopic.length > 500) {
      return NextResponse.json({ error: 'newsTopic must be less than 500 characters' }, { status: 400 });
    }
    if (debateRounds < 1 || debateRounds > 5) {
      return NextResponse.json({ error: 'debateRounds must be between 1 and 5' }, { status: 400 });
    }
    if (!voiceConfig) { // Basic validation, can be improved with Zod
        return NextResponse.json({ error: 'voiceConfig is required' }, { status: 400 });
    }

    // --- Task Creation and Asynchronous Execution ---

    // 1. Immediately create the task to get a taskId.
    // This makes the task visible to the user instantly.
    const task = await TaskManager.createTask(newsTopic, debateRounds, voiceConfig, language);
    const { id: taskId } = task;

    console.log(`[API /start] Task ${taskId} created. Triggering background orchestration.`);

    // 2. Trigger the orchestrator but DO NOT await it.
    // This is the "fire-and-forget" pattern suitable for serverless functions.
    // The orchestrator will run in the background, updating the task state in KV.
    PipelineOrchestrator.run(newsTopic, debateRounds, voiceConfig, language).catch(err => {
      // We log the error here, but the orchestrator itself should handle marking the task as failed.
      console.error(`[API /start] Uncaught error in background pipeline for task ${taskId}:`, err);
    });

    // 3. Immediately return the taskId to the client.
    // The client can now start polling the status endpoint.
    return NextResponse.json({
      success: true,
      message: 'Pipeline started successfully. Poll the status endpoint to track progress.',
      taskId: taskId,
    });

  } catch (error) {
    console.error('[API /start] Error in POST handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('JSON')) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error while starting pipeline', details: errorMessage },
      { status: 500 }
    );
  }
}
