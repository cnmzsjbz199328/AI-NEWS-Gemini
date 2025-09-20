PS C:\Users\tj169\OneDrive - Flinders\work\IT\AI-NEWS> npm run dev                                          
                                                      
> aitv-news-commentary@0.1.0 dev                      
> next dev                                            

  ▲ Next.js 14.2.32
  - Local:        http://localhost:3000
  - Environments: .env.local, .env

 ✓ Starting...
 ✓ Ready in 4.4s
 ○ Compiling /api/pipeline/start ...
 ✓ Compiled /api/pipeline/start in 4.2s (737 modules)
[API /start] Received request to start pipeline
(node:16848) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
[TaskManager] Task created: task-1758354911249-wdanyk5v3 (expecting 6 audio items)
[API /start] Task task-1758354911249-wdanyk5v3 created. Triggering background orchestration.
[Orchestrator] Creating task for topic: "AI technology trends 2024"
 POST /api/pipeline/start 200 in 6116ms
[TaskManager] Task created: task-1758354912350-omer3chkd (expecting 6 audio items)
[Orchestrator] Task task-1758354912350-omer3chkd created.
[TaskManager] Task task-1758354912350-omer3chkd updated: { status: 'GENERATING_TEXT' }
[Orchestrator] Task task-1758354912350-omer3chkd: Generating script...
🔄 Starting text generation for text-gen-task-1758354912857 with Gemini (retry: 0)
📞 Calling aiWorkerPool.assignTask for text-gen-task-1758354912857
🤖 Starting one-shot generation for task text-gen-task-1758354912857 with Gemini
📝 Generated prompt for text-gen-task-1758354912857 (2677 characters)
Gemini API response: {
  hasText: true,
  textLength: 1161,
  textPreview: '```json\n' +
    '{\n' +
    '  "moderator_intro": "Welcome! Today, we discuss AI trends 2024 and its profound impact on journalism. Tom, Mark, glad to have you on the show.",\n' +       
    '  "conversation": [\n' +
    '    {\n' +
    '      "speaker": "tom",\n' +
    `      "text": "AI in 2024 offers unparalleled data analysis, removing human bias and boosting efficiency in newsrooms. It's a leap for accuracy and speed."\n` +
    '    },\n' +
    '    {\n' +
    '      "speaker": "mark",\n' +
    '      "text": "Efficiency at what cost? AI lacks human judgment and empathy. It risks job displaceme'  
}
🔍 Extracted JSON for task text-gen-task-1758354912857 (1149 characters)
✅ Successfully parsed script for task text-gen-task-1758354912857: { hasIntro: true, conversationLength: 4, hasOutro: true }
✅ One-shot generation completed for task text-gen-task-1758354912857 in 7381ms
📋 AI task result for text-gen-task-1758354912857: { success: true, hasScript: true, error: undefined, duration: 7381 }
✅ Text generation completed for task: text-gen-task-1758354912857
[Orchestrator] Task task-1758354912350-omer3chkd: Script generated and saved.
[TaskManager] Task task-1758354912350-omer3chkd updated: { status: 'GENERATING_AUDIO' }
[Orchestrator] Task task-1758354912350-omer3chkd: Starting audio generation...
[AudioService] Generating audio for speaker "test_speaker"...
[IndexTTS-Client] ✅ Client initialized with 90s timeout
[VoiceConfigManager] Initialized with mapping: { moderator: 'tom', tom: 'guodegang', mark: 'cillian' }      
[IndexTTS-Integrated] Service initialized
[AudioService] 💥 Audio generation failed for speaker "test_speaker": indexTTSService.generateSpeech is not a function
[Orchestrator] Failed to generate audio for task task-1758354912350-omer3chkd, segment moderator_intro: TypeError: indexTTSService.generateSpeech is not a function
    at AudioGenerationService.generateAudio (webpack-internal:///(rsc)/./src/lib/services/AudioGenerationService.ts:17:50)
    at PipelineOrchestrator.generateAndSaveAudio (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:64:121)
    at PipelineOrchestrator.run (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:45:24) 
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[TaskManager] 🎵 Audio added to task-1758354912350-omer3chkd: (1/6)
[AudioService] Generating audio for speaker "tom"...  
[AudioService] 💥 Audio generation failed for speaker "tom": indexTTSService.generateSpeech is not a function
[AudioService] Generating audio for speaker "mark"... 
[AudioService] 💥 Audio generation failed for speaker "mark": indexTTSService.generateSpeech is not a function
[AudioService] Generating audio for speaker "tom"...  
[AudioService] 💥 Audio generation failed for speaker "tom": indexTTSService.generateSpeech is not a function
[AudioService] Generating audio for speaker "mark"... 
[AudioService] 💥 Audio generation failed for speaker "mark": indexTTSService.generateSpeech is not a function
[Orchestrator] Failed to generate audio for task task-1758354912350-omer3chkd, segment 0: TypeError: indexTTSService.generateSpeech is not a function
    at AudioGenerationService.generateAudio (webpack-internal:///(rsc)/./src/lib/services/AudioGenerationService.ts:17:50)
    at PipelineOrchestrator.generateAndSaveAudio (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:64:121)
    at eval (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:47:86)
    at Array.map (<anonymous>)
    at PipelineOrchestrator.run (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:47:62) 
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[Orchestrator] Failed to generate audio for task task-1758354912350-omer3chkd, segment 1: TypeError: indexTTSService.generateSpeech is not a function
    at AudioGenerationService.generateAudio (webpack-internal:///(rsc)/./src/lib/services/AudioGenerationService.ts:17:50)
    at PipelineOrchestrator.generateAndSaveAudio (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:64:121)
    at eval (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:47:86)
    at Array.map (<anonymous>)
    at PipelineOrchestrator.run (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:47:62) 
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[Orchestrator] Failed to generate audio for task task-1758354912350-omer3chkd, segment 2: TypeError: indexTTSService.generateSpeech is not a function
    at AudioGenerationService.generateAudio (webpack-internal:///(rsc)/./src/lib/services/AudioGenerationService.ts:17:50)
    at PipelineOrchestrator.generateAndSaveAudio (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:64:121)
    at eval (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:47:86)
    at Array.map (<anonymous>)
    at PipelineOrchestrator.run (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:47:62) 
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[Orchestrator] Failed to generate audio for task task-1758354912350-omer3chkd, segment 3: TypeError: indexTTSService.generateSpeech is not a function
    at AudioGenerationService.generateAudio (webpack-internal:///(rsc)/./src/lib/services/AudioGenerationService.ts:17:50)
    at PipelineOrchestrator.generateAndSaveAudio (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:64:121)
    at eval (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:47:86)
    at Array.map (<anonymous>)
    at PipelineOrchestrator.run (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:47:62) 
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[TaskManager] 🎵 Audio added to task-1758354912350-omer3chkd: (2/6)
[TaskManager] 🎵 Audio added to task-1758354912350-omer3chkd: (3/6)
[TaskManager] 🎵 Audio added to task-1758354912350-omer3chkd: (4/6)
[TaskManager] 🎵 Audio added to task-1758354912350-omer3chkd: (5/6)
[AudioService] Generating audio for speaker "test_speaker"...
[AudioService] 💥 Audio generation failed for speaker "test_speaker": indexTTSService.generateSpeech is not a function
[Orchestrator] Failed to generate audio for task task-1758354912350-omer3chkd, segment moderator_outro: TypeError: indexTTSService.generateSpeech is not a function
    at AudioGenerationService.generateAudio (webpack-internal:///(rsc)/./src/lib/services/AudioGenerationService.ts:17:50)
    at PipelineOrchestrator.generateAndSaveAudio (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:64:121)
    at PipelineOrchestrator.run (webpack-internal:///(rsc)/./src/lib/pipeline-orchestrator-simple.ts:50:24) 
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[TaskManager] 🎵 Audio added to task-1758354912350-omer3chkd: (6/6)
[TaskManager] 🎉 All audio collected for task task-1758354912350-omer3chkd, marking as complete.
[TaskManager] Task task-1758354912350-omer3chkd updated: { status: 'READY_TO_PLAY' }
[Orchestrator] Task task-1758354912350-omer3chkd: All audio generation requests are complete.
 ✓ Compiled /api/pipeline/status in 265ms (739 modules)
 GET /api/pipeline/status 200 in 324ms

 StatusCode        : 200
StatusDescription : OK
Content           : {"success":true,"message":"Pipel
                    ine started successfully. Poll t
                    he status endpoint to track prog
                    ress.","taskId":"task-1758354911
                    249-wdanyk5v3"}
RawContent        : HTTP/1.1 200 OK
                    vary: RSC, Next-Router-State-Tre
                    e, Next-Router-Prefetch
                    Connection: keep-alive
                    Keep-Alive: timeout=5
                    Transfer-Encoding: chunked
                    Content-Type: application/json
                    Date: Sat, 20 Sep 2...
Forms             : {}
Headers           : {[vary, RSC, Next-Router-State-T
                    ree, Next-Router-Prefetch], [Con
                    nection, keep-alive], [Keep-Aliv
                    e, timeout=5], [Transfer-Encodin
                    g, chunked]...}
Images            : {}
InputFields       : {}
Links             : {}
ParsedHtml        : mshtml.HTMLDocumentClass
RawContentLength  : 143