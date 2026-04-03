import { NextRequest, NextResponse } from 'next/server';
import { TaskManager } from '@/lib/managers/TaskManager';
import { PipelineOrchestrator } from '@/lib/pipeline-orchestrator-simple';
import { VoiceConfig, SupportedLanguage } from '@/types';

interface StartPipelineRequest {
  newsTopic: string;
  debateRounds?: number;
  voiceConfig?: VoiceConfig;
  language?: SupportedLanguage;
  forceNew?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: StartPipelineRequest = await request.json();

    const { newsTopic, debateRounds = 2, voiceConfig, language = 'en-US', forceNew = false } = body;

    if (!newsTopic || typeof newsTopic !== 'string' || newsTopic.trim().length === 0) {
      return NextResponse.json({ error: 'newsTopic is required and must be a non-empty string' }, { status: 400 });
    }
    if (newsTopic.length > 500) {
      return NextResponse.json({ error: 'newsTopic must be less than 500 characters' }, { status: 400 });
    }
    if (debateRounds < 1 || debateRounds > 5) {
      return NextResponse.json({ error: 'debateRounds must be between 1 and 5' }, { status: 400 });
    }
    if (!voiceConfig) {
      return NextResponse.json({ error: 'voiceConfig is required' }, { status: 400 });
    }

    const task = await TaskManager.createTask(newsTopic, debateRounds, voiceConfig, language, forceNew);
    const { id: taskId } = task;

    if (task.status === 'READY_TO_PLAY' && !forceNew) {
      return NextResponse.json({
        success: true,
        message: 'Existing completed task found and reused.',
        taskId: taskId,
        reused: true
      });
    }

    PipelineOrchestrator.run(newsTopic, debateRounds, voiceConfig, language).catch(err => {
      console.error(`[API /start] Uncaught error in background pipeline for task ${taskId}:`, err);
    });

    return NextResponse.json({
      success: true,
      message: 'Pipeline started successfully. Poll the status endpoint to track progress.',
      taskId: taskId,
      reused: false
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