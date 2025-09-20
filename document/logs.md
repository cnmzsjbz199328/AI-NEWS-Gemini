[API /start] Received request to start pipeline
(node:1524) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
[TaskManager] Task created: task-1758330565637-9n6jati66 (expecting 4 audio items)
[API /start] Task task-1758330565637-9n6jati66 created. Triggering background orchestration.
[Orchestrator] Creating task for topic: "The Ethics of Artificial General Intelligence"
 POST /api/pipeline/start 200 in 3154ms
[TaskManager] Task created: task-1758330565874-k5pgloeos (expecting 4 audio items)
[Orchestrator] Task task-1758330565874-k5pgloeos created.
[TaskManager] Task task-1758330565874-k5pgloeos updated: { status: 'GENERATING_TEXT' }
[Orchestrator] Task task-1758330565874-k5pgloeos: Generating script...
🔄 Starting text generation for text-gen-task-1758330566108 with Gemini (retry: 0)
📞 Calling aiWorkerPool.assignTask for text-gen-task-1758330566108
🤖 Starting one-shot generation for task text-gen-task-1758330566108 with Gemini
📝 Generated prompt for text-gen-task-1758330566108 (2527 characters)
 ✓ Compiled /api/pipeline/status in 207ms (739 modules)
 GET /api/pipeline/status 200 in 246ms
Gemini API response: {
  hasText: true,
  textLength: 794,
  textPreview: '```json\n' +
    '{\n' +
    `  "moderator_intro": "Welcome. Tonight, we debate the profound ethics of Artificial General Intelligence. Is it humanity's greatest leap or gravest risk?",\n` +
    '  "conversation": [\n' +
    '    {\n' +
    '      "speaker": "tom",\n' +
    `      "text": "AGI can solve humanity's grand challenges: climate, disease. Its analytical power offers unprecedented progress, driving innovation & efficiency. It's a tool for good."\n` +
    '    },\n' +
    '    {\n' +
    '      "speaker": "mark",\n' +
    '      "text": "But who controls this power? Without human over'
}
🔍 Extracted JSON for task text-gen-task-1758330566108 (782 characters)
✅ Successfully parsed script for task text-gen-task-1758330566108: { hasIntro: true, conversationLength: 2, hasOutro: true }
✅ One-shot generation completed for task text-gen-task-1758330566108 in 8288ms
📋 AI task result for text-gen-task-1758330566108: { success: true, hasScript: true, error: undefined, duration: 8288 }
✅ Text generation completed for task: text-gen-task-1758330566108
[Orchestrator] Task task-1758330565874-k5pgloeos: Script generated and saved.
[TaskManager] Task task-1758330565874-k5pgloeos updated: { status: 'GENERATING_AUDIO' }
[Orchestrator] Task task-1758330565874-k5pgloeos: Starting audio generation...
[AudioService] Generating audio for speaker "larry"...
[IndexTTS-Client] ✅ Client initialized with 90s timeout
[VoiceConfigManager] Initialized with mapping: { moderator: 'tom', tom: 'guodegang', mark: 'cillian' }      
[IndexTTS-Integrated] Service initialized
[AudioService] 💥 Audio generation failed for speaker "larry": indexTTSService.generateSpeech is not a function
[Orchestrator] Failed to generate audio for task task-1758330565874-k5pgloeos, segment moderator_intro: TypeError: indexTTSService.generateSpeech is not a function
    at AudioGenerationService.generateAudio (webpack-internal:///(rsc)/./src/lib/services/AudioGenerationService.ts:17:50)
    at PipelineOrchestrator.generateAndSaveAudio (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:64:121)
    at PipelineOrchestrator.run (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:45:24) 
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[TaskManager] 🎵 Audio added to task-1758330565874-k5pgloeos: (1/4)
[AudioService] Generating audio for speaker "tom"...  
[AudioService] 💥 Audio generation failed for speaker "tom": indexTTSService.generateSpeech is not a function
[AudioService] Generating audio for speaker "mark"... 
[AudioService] 💥 Audio generation failed for speaker "mark": indexTTSService.generateSpeech is not a function
[Orchestrator] Failed to generate audio for task task-1758330565874-k5pgloeos, segment 0: TypeError: indexTTSService.generateSpeech is not a function
    at AudioGenerationService.generateAudio (webpack-internal:///(rsc)/./src/lib/services/AudioGenerationService.ts:17:50)
    at PipelineOrchestrator.generateAndSaveAudio (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:64:121)
    at eval (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:47:86)
    at Array.map (<anonymous>)
    at PipelineOrchestrator.run (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:47:62) 
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[Orchestrator] Failed to generate audio for task task-1758330565874-k5pgloeos, segment 1: TypeError: indexTTSService.generateSpeech is not a function
    at AudioGenerationService.generateAudio (webpack-internal:///(rsc)/./src/lib/services/AudioGenerationService.ts:17:50)
    at PipelineOrchestrator.generateAndSaveAudio (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:64:121)
    at eval (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:47:86)
    at Array.map (<anonymous>)
    at PipelineOrchestrator.run (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:47:62) 
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[TaskManager] 🎵 Audio added to task-1758330565874-k5pgloeos: (2/4)
[TaskManager] 🎵 Audio added to task-1758330565874-k5pgloeos: (3/4)
[AudioService] Generating audio for speaker "larry"...
[AudioService] 💥 Audio generation failed for speaker "larry": indexTTSService.generateSpeech is not a function
[Orchestrator] Failed to generate audio for task task-1758330565874-k5pgloeos, segment moderator_outro: TypeError: indexTTSService.generateSpeech is not a function
    at AudioGenerationService.generateAudio (webpack-internal:///(rsc)/./src/lib/services/AudioGenerationService.ts:17:50)
    at PipelineOrchestrator.generateAndSaveAudio (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:64:121)
    at PipelineOrchestrator.run (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:50:24) 
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[TaskManager] 🎵 Audio added to task-1758330565874-k5pgloeos: (4/4)
[TaskManager] 🎉 All audio collected for task task-1758330565874-k5pgloeos, marking as complete.
[TaskManager] Task task-1758330565874-k5pgloeos updated: { status: 'READY_TO_PLAY' }
[Orchestrator] Task task-1758330565874-k5pgloeos: All audio generation requests are complete.