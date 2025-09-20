import { NextResponse } from 'next/server';

/**
 * TEMPORARY Pipeline Status API
 * GET /api/pipeline/status
 *
 * This is a temporary mock endpoint to prevent the application from crashing
 * after the refactoring of TaskManager. It returns a static, empty-like state.
 * It will be replaced by a new endpoint that fetches status for a specific task ID.
 */
export async function GET() {
  // This endpoint is temporarily providing a mock response 
  // to allow the rest of the application to run without errors.
  const mockResponse = {
    isActive: false,
    totalTasks: 0,
    completedTasks: 0,
    currentPlayIndex: 0,
    progressPercentage: 0,
    statusCounts: {},
    tasks: [],
    nextPlayableTask: null,
    timestamp: Date.now(),
  };

  return NextResponse.json(mockResponse);
}