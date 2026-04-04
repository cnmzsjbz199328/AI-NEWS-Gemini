import { NextResponse } from 'next/server';
import { TaskManager } from '@/lib/managers/TaskManager';

/**
 * Pipeline Status API
 * GET /api/pipeline/status
 *
 * Returns real-time status of all tasks from Vercel KV storage.
 * This endpoint is used by the frontend to track pipeline progress.
 */
export async function GET() {
  try {
    const status = await TaskManager.getPipelineStatus();

    // Format response for compatibility with existing frontend
    const response = {
      isActive: status.isActive,
      totalTasks: status.totalTasks,
      completedTasks: status.completedTasks,
      currentPlayIndex: 0, // Legacy field
      progressPercentage: status.progressPercentage,
      statusCounts: status.tasks.reduce((counts, task) => {
        counts[task.status] = (counts[task.status] || 0) + 1;
        return counts;
      }, {} as Record<string, number>),
      tasks: status.tasks.map(task => ({
        id: task.id,
        status: task.status,
        newsTopic: task.newsTopic ? (task.newsTopic.substring(0, 50) + (task.newsTopic.length > 50 ? '...' : '')) : 'No topic',
        createdAt: task.createdAt,
        hasScript: !!task.script,
        audioPlaylist: task.audioPlaylist, // Include for playback
        script: task.script,              // Include for playback
        slides: task.slides ?? null,      // Include for slide display
      })),
      nextPlayableTask: null, // Legacy field
      timestamp: Date.now(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API /status] Error fetching pipeline status:', error);
    
    // Return empty state on error to prevent frontend crashes
    const errorResponse = {
      isActive: false,
      totalTasks: 0,
      completedTasks: 0,
      currentPlayIndex: 0,
      progressPercentage: 0,
      statusCounts: {},
      tasks: [],
      nextPlayableTask: null,
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}