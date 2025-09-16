 ▲ Next.js 14.2.32
  - Local:        http://localhost:3000
  - Environments: .env.local, .env

 ✓ Starting...
 ✓ Ready in 4.4s
 ○ Compiling / ...

warn - As of Tailwind CSS v3.3, the `@tailwindcss/line-clamp` plugin is now included by default.
warn - Remove it from the `plugins` array in your configuration to eliminate this warning. 
 ✓ Compiled / in 3.6s (545 modules)
[UI] ===== MAIN PAGE COMPONENT RENDERED =====
[UI] getSpeakerImage for moderator: animationState = static
[UI] moderator using STATIC image (state: static) - IDLE
[UI] getSpeakerImage for tom: animationState = static
[UI] tom using STATIC image (state: static) - IDLE
[UI] getSpeakerImage for mark: animationState = static
[UI] mark using STATIC image (state: static) - IDLE
[UI] Current speaker states: { moderator: 'static', tom: 'static', mark: 'static' }        
[UI] Active speaker (speaking): undefined
[UI] Thinking speakers: []
 ✓ Compiled in 683ms (280 modules)
 GET / 200 in 4283ms
 ✓ Compiled /api/news in 297ms (298 modules)
[NEWS SERVICE] Fetching ABC news from URL: https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.abc.net.au%2Fnews%2Ffeed%2F51120%2Frss.xml&_t=1758033366483
[NEWS SERVICE] Fetching BBC news from URL: https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ffeeds.bbci.co.uk%2Fnews%2Frss.xml&_t=1758033366486
[NEWS SERVICE] ABC RSS API response status: ok
[NEWS SERVICE] Processing ABC News RSS items, total count: 10
[NEWS SERVICE] ABC News Item 1: {
  title: 'Breaking: Donald Trump confirms meeting with Antho...',
  pubDate: '2025-09-16 14:13:35',
  formattedDate: 'Sep 16, 2025',
  source: 'ABC News'
}
[NEWS SERVICE] BBC RSS API response status: ok
[NEWS SERVICE] Processing BBC News RSS items, total count: 10
 GET /api/news 200 in 1375ms
[NEWS SERVICE] Fetching ABC news from URL: https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.abc.net.au%2Fnews%2Ffeed%2F51120%2Frss.xml&_t=1758033367455
[NEWS SERVICE] Fetching BBC news from URL: https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ffeeds.bbci.co.uk%2Fnews%2Frss.xml&_t=1758033367456
[NEWS SERVICE] ABC RSS API response status: ok
[NEWS SERVICE] Processing ABC News RSS items, total count: 10
[NEWS SERVICE] ABC News Item 1: {
  title: 'Breaking: Donald Trump confirms meeting with Antho...',
  pubDate: '2025-09-16 14:13:35',
  formattedDate: 'Sep 16, 2025',
  source: 'ABC News'
}
[NEWS SERVICE] BBC RSS API response status: ok
[NEWS SERVICE] Processing BBC News RSS items, total count: 10
 GET /api/news 200 in 463ms
 ○ Compiling /api/pipeline/status ...
 ✓ Compiled /api/pipeline/status in 1609ms (975 modules)
 ✓ Compiled (977 modules)
Subscribed to event: task:updated
Subscribed to event: task:created
Subscribed to event: task:completed
Subscribed to event: task:failed
(node:9932) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
 GET /api/pipeline/status 200 in 2511ms
[Pipeline API] Received POST request to start pipeline
[Pipeline API] Request body: {
  "newsTopics": [
    "Title: Breaking: Donald Trump confirms meeting with Anthony Albanese. Summary: Mr Albanese has not yet met his American counterpart since his election win earlier this year, with questions swirling about whether he would be able to land a face-to-face meeting."       
  ],
  "debateRounds": 1,
  "voiceConfig": {
    "tom": "cosy-en-male-energetic",
    "mark": "cosy-en-female-calm",
    "moderator": "cosy-en-neutral-professional"
  },
  "language": "en-US"
}
[Pipeline API] Validating individual topics...
[Pipeline API] Validating debate rounds...
[Pipeline API] Validating language...
[Pipeline API] Validating voice config...
[Pipeline API] All validations passed, getting orchestrator...
[Pipeline API] Orchestrator obtained, checking current state...
[Pipeline API] Current pipeline state: { isActive: false, totalTasks: 0, completedTasks: 0 }
[Pipeline API] Starting pipeline with parameters: {
  newsTopicsCount: 1,
  debateRounds: 1,
  voiceConfig: {
    tom: 'cosy-en-male-energetic',
    mark: 'cosy-en-female-calm',
    moderator: 'cosy-en-neutral-professional'
  },
  language: 'en-US'
}
🚀 Pipeline started with 1 tasks
📋 Tasks created: task-1758033374771-0:PENDING_TEXT:en-US
Publishing event: task:created for task: task-1758033374771-0
[WebSocket] Task task-1758033374771-0 updated
🔄 Starting task processing...
🎯 Assigning task task-1758033374771-0 to worker Gemini
Worker Gemini assigned to task: task-1758033374771-0
Task task-1758033374771-0 updated: { status: 'GENERATING_TEXT' }
Publishing event: task:updated for task: task-1758033374771-0
[WebSocket] Task task-1758033374771-0 updated
✅ processTasks() called successfully
[Pipeline API] Pipeline started successfully
[Pipeline API] New pipeline state: { isActive: true, totalTasks: 1 }
🚀 Starting text generation for task: task-1758033374771-0 with worker: Gemini
 POST /api/pipeline/start 200 in 2583ms
🔄 Starting text generation for task-1758033374771-0 with Gemini (retry: 0)
📞 Calling aiWorkerPool.assignTask for task-1758033374771-0
🤖 Starting one-shot generation for task task-1758033374771-0 with Gemini
📝 Generated prompt for task-1758033374771-0 (2742 characters)
 GET /api/pipeline/status 200 in 20ms
Gemini API error: ServerError: got status: 503 Service Unavailable. {"error":{"code":503,"message":"The model is overloaded. Please try again later.","status":"UNAVAILABLE"}}        
    at throwErrorIfNotOK (webpack-internal:///(rsc)/./node_modules/@google/genai/dist/node/index.js:6284:33)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async eval (webpack-internal:///(rsc)/./node_modules/@google/genai/dist/node/index.js:6097:13)
    at async Models.generateContent (webpack-internal:///(rsc)/./node_modules/@google/genai/dist/node/index.js:2860:20)
    at async eval (webpack-internal:///(rsc)/./node_modules/@google/genai/dist/node/index.js:2693:30)
    at async Chat.sendMessage (webpack-internal:///(rsc)/./node_modules/@google/genai/dist/node/index.js:2699:9)
    at async Object.generateResponse (webpack-internal:///(rsc)/./src/lib/ai-providers.ts:48:32)
    at async AIWorkerPool.assignTask (webpack-internal:///(rsc)/./src/lib/ai-worker-pool.ts:70:30)
    at async TextGenerationService.execute (webpack-internal:///(rsc)/./src/lib/services/TextGenerationService.ts:17:28)
    at async PipelineScheduler.executeTextGeneration (webpack-internal:///(rsc)/./src/lib/PipelineScheduler.ts:234:28) {
  [cause]: 'Error\n' +
    '    at new ServerError (webpack-internal:///(rsc)/./node_modules/@google/genai/dist/node/index.js:5914:37)\n' +
    '    at throwErrorIfNotOK (webpack-internal:///(rsc)/./node_modules/@google/genai/dist/node/index.js:6284:33)\n' +
    '    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n' +
    '    at async eval (webpack-internal:///(rsc)/./node_modules/@google/genai/dist/node/index.js:6097:13)\n' +
    '    at async Models.generateContent (webpack-internal:///(rsc)/./node_modules/@google/genai/dist/node/index.js:2860:20)\n' +
    '    at async eval (webpack-internal:///(rsc)/./node_modules/@google/genai/dist/node/index.js:2693:30)\n' +
    '    at async Chat.sendMessage (webpack-internal:///(rsc)/./node_modules/@google/genai/dist/node/index.js:2699:9)\n' +
    '    at async Object.generateResponse (webpack-internal:///(rsc)/./src/lib/ai-providers.ts:48:32)\n' +
    '    at async AIWorkerPool.assignTask (webpack-internal:///(rsc)/./src/lib/ai-worker-pool.ts:70:30)\n' +
    '    at async TextGenerationService.execute (webpack-internal:///(rsc)/./src/lib/services/TextGenerationService.ts:17:28)\n' +
    '    at async PipelineScheduler.executeTextGeneration (webpack-internal:///(rsc)/./src/lib/PipelineScheduler.ts:234:28)'
}
❌ Failed to parse AI response for task task-1758033374771-0: No JSON object found in AI response
Raw response: As the moderator, I believe this is an important topic that deserves careful consideration from all perspectives....
❌ One-shot generation failed for task task-1758033374771-0: Failed to parse AI response: No JSON object found in AI response
📋 AI task result for task-1758033374771-0: {
  success: false,
  hasScript: false,
  error: 'Failed to parse AI response: No JSON object found in AI response',
  duration: 11083
}
❌ Text generation failed for task: task-1758033374771-0 Failed to parse AI response: No JSON object found in AI response
🔄 Task task-1758033374771-0 failed, retry 1/3
Task task-1758033374771-0 updated: { retryCount: 1 }
Task task-1758033374771-0 updated: {
  status: 'PENDING_TEXT',
  error: 'Retry 1/3: Failed to parse AI response: No JSON object found in AI response'     
}
Publishing event: task:updated for task: task-1758033374771-0
[WebSocket] Task task-1758033374771-0 updated
Worker Gemini released
🎯 Assigning task task-1758033374771-0 to worker Gemini
Worker Gemini assigned to task: task-1758033374771-0
Task task-1758033374771-0 updated: { status: 'GENERATING_TEXT' }
Publishing event: task:updated for task: task-1758033374771-0
[WebSocket] Task task-1758033374771-0 updated
🚀 Starting text generation for task: task-1758033374771-0 with worker: Gemini
🔄 Starting text generation for task-1758033374771-0 with Gemini (retry: 1)
📞 Calling aiWorkerPool.assignTask for task-1758033374771-0
🤖 Starting one-shot generation for task task-1758033374771-0 with Gemini
📝 Generated prompt for task-1758033374771-0 (2742 characters)
❌ One-shot generation failed for task task-1758033374771-0: AI call timeout after 30000ms
📋 AI task result for task-1758033374771-0: {
  success: false,
  hasScript: false,
  error: 'AI call timeout after 30000ms',
  duration: 30021
}
❌ Text generation failed for task: task-1758033374771-0 AI call timeout after 30000ms     
🔄 Task task-1758033374771-0 failed, retry 2/3
Task task-1758033374771-0 updated: { retryCount: 2 }
Task task-1758033374771-0 updated: {
  status: 'PENDING_TEXT',
  error: 'Retry 2/3: AI call timeout after 30000ms'
}
Publishing event: task:updated for task: task-1758033374771-0
[WebSocket] Task task-1758033374771-0 updated
Worker Gemini released
🎯 Assigning task task-1758033374771-0 to worker Gemini
Worker Gemini assigned to task: task-1758033374771-0
Task task-1758033374771-0 updated: { status: 'GENERATING_TEXT' }
Publishing event: task:updated for task: task-1758033374771-0
[WebSocket] Task task-1758033374771-0 updated
🚀 Starting text generation for task: task-1758033374771-0 with worker: Gemini
🔄 Starting text generation for task-1758033374771-0 with Gemini (retry: 2)
📞 Calling aiWorkerPool.assignTask for task-1758033374771-0
🤖 Starting one-shot generation for task task-1758033374771-0 with Gemini
📝 Generated prompt for task-1758033374771-0 (2742 characters)
Gemini API response: {
  hasText: true,
  textLength: 758,
  textPreview: '```json\n' +
    '{\n' +
    `  "moderator_intro": "Trump confirms meeting Albanese. Questions swirled about this face-to-face. Panel, what's your take on this diplomatic development?",\n` +
    '  "conversation": [\n' +
    '    {\n' +
    '      "speaker": "tom",\n' +
    '      "text": "This meeting was always a strategic necessity. Data highlights the enduring US-Aus alliance. It’s a predictable, vital step for global stability."\n' +
    '    },\n' +
    '    {\n' +
    '      "speaker": "mark",\n' +
    `      "text": "Predictable? The delay caused real concern. Diplomacy isn't just data` 
}
Gemini API response: {
  hasText: true,
  textLength: 779,
  textPreview: '```json\n' +
    '{\n' +
    `  "moderator_intro": "Trump confirms meeting PM Albanese. This long-awaited face-to-face raises questions about US-Australia ties. What's the significance?",\n` +
    '  "conversation": [\n' +
    '    {\n' +
    '      "speaker": "tom",\n' +
    '      "text": "This meeting is vital. Data shows consistent high-level engagement strengthens alliances. It ensures stability and strategic alignment for future challenges."\n' +
    '    },\n' +
    '    {\n' +
    '      "speaker": "mark",\n' +
    `      "text": "While good, it's just a meeting. Personal chemistry wit`
}
🔍 Extracted JSON for task task-1758033374771-0 (767 characters)
✅ Successfully parsed script for task task-1758033374771-0: { hasIntro: true, conversationLength: 2, hasOutro: true }
✅ One-shot generation completed for task task-1758033374771-0 in 25205ms
📋 AI task result for task-1758033374771-0: { success: true, hasScript: true, error: undefined, duration: 25205 }
✅ Text generation completed for task: task-1758033374771-0
Task task-1758033374771-0 updated: {
  script: {
    moderator_intro: "Trump confirms meeting PM Albanese. This long-awaited face-to-face raises questions about US-Australia ties. What's the significance?",
    conversation: [ [Object], [Object] ],
    moderator_outro: "A crucial meeting, with panelists highlighting both strategic importance and the nuances of personal diplomacy. We'll watch developments."
  }
}
Task task-1758033374771-0 updated: { status: 'PENDING_AUDIO' }
Publishing event: task:updated for task: task-1758033374771-0
[WebSocket] Task task-1758033374771-0 updated
✅ Text generation completed for task: task-1758033374771-0
Worker Gemini released
Task task-1758033374771-0 updated: { status: 'GENERATING_AUDIO' }
Publishing event: task:updated for task: task-1758033374771-0
[WebSocket] Task task-1758033374771-0 updated
🎵 Starting audio generation for task: task-1758033374771-0
🎵 Starting audio generation for task: task-1758033374771-0 in language: en-US
[IndexTTS-Client] ✅ Client initialized with 45s timeout
[VoiceConfigManager] Initialized with mapping: { moderator: 'tom', tom: 'guodegang', mark: 'cillian' }
[IndexTTS-Integrated] Service initialized
🎵 Generating 4 audio items for task: task-1758033374771-0 using IndexTTS
[IndexTTS-Integrated] 🎪 Generating batch speech: 4 segments
[IndexTTS-Integrated] 📋 Processing segment 1/4
[IndexTTS-Integrated] 🎯 Generating speech for moderator: "Trump confirms meeting PM Alba..."
[IndexTTS-Integrated] 🎵 Using voice: Tom (tom)
[IndexTTS-Client] 🚀 Starting speech generation: "Trump confirms meeting PM Albanese. This long-awai..."
[IndexTTS-Client] 📋 Attempt 1/1
[IndexTTS-Client] 🔐 Connecting to private Space: Tom1986/indextts2
[IndexTTS-Client] ✅ Connected successfully
[IndexTTS-Client] 📥 Downloading network file...
[IndexTTS-Client] ✅ Downloaded 171620 bytes
[IndexTTS-Client] 🔄 Processing with handle_file...
[IndexTTS-Client] ✅ File processed successfully
[IndexTTS-Client] 🔧 Built 24 parameters
[IndexTTS-Client] 🔄 Calling /gen_single...
[IndexTTS-Client] 📊 Parsing API response...
[IndexTTS-Client] ✅ Found nested audio URL: https://tom1986-indextts2.hf.space/gradio_api/file=/tmp/gradio/31df69a1fd6542abd883768f85b093ad89ab6fdaab3a335d5a8e5ad2d20d2e79/spk_1758033457.wav
[IndexTTS-Client] ✅ Processing completed in 28011ms
[IndexTTS-Integrated] ✅ Segment 1 completed successfully
[IndexTTS-Integrated] 📋 Processing segment 2/4
[IndexTTS-Integrated] 🎯 Generating speech for tom: "This meeting is vital. Data sh..."    
[IndexTTS-Integrated] 🎵 Using voice: 郭德纲 (guodegang)
[IndexTTS-Client] 🚀 Starting speech generation: "This meeting is vital. Data shows consistent high-..."
[IndexTTS-Client] 📋 Attempt 1/1
[IndexTTS-Client] 📥 Downloading network file...
[IndexTTS-Client] ✅ Downloaded 216960 bytes
[IndexTTS-Client] 🔄 Processing with handle_file...
[IndexTTS-Client] ✅ File processed successfully
[IndexTTS-Client] 🔧 Built 24 parameters
[IndexTTS-Client] 🔄 Calling /gen_single...
[IndexTTS-Client] 📊 Parsing API response...
[IndexTTS-Client] ✅ Found nested audio URL: https://tom1986-indextts2.hf.space/gradio_api/file=/tmp/gradio/5dcb1db69a55b54cd66ee6e44055a6d972dd921ecc952a092ff9813b11cc439c/spk_1758033475.wav
[IndexTTS-Client] ✅ Processing completed in 20026ms
[IndexTTS-Integrated] ✅ Segment 2 completed successfully
[IndexTTS-Integrated] 📋 Processing segment 3/4
[IndexTTS-Integrated] 🎯 Generating speech for mark: "While good, it's just a meetin..."   
[IndexTTS-Integrated] 🎵 Using voice: Cillian Murphy (cillian)
[IndexTTS-Client] 🚀 Starting speech generation: "While good, it's just a meeting. Personal chemistr..."
[IndexTTS-Client] 📋 Attempt 1/1
[IndexTTS-Client] 📥 Downloading network file...
[IndexTTS-Client] ✅ Downloaded 178560 bytes
[IndexTTS-Client] 🔄 Processing with handle_file...
[IndexTTS-Client] ✅ File processed successfully
[IndexTTS-Client] 🔧 Built 24 parameters
[IndexTTS-Client] 🔄 Calling /gen_single...
[NEWS SERVICE] Fetching ABC news from URL: https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.abc.net.au%2Fnews%2Ffeed%2F51120%2Frss.xml&_t=1758033501470
[NEWS SERVICE] Fetching BBC news from URL: https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ffeeds.bbci.co.uk%2Fnews%2Frss.xml&_t=1758033501471
[NEWS SERVICE] BBC RSS API response status: ok
[NEWS SERVICE] Processing BBC News RSS items, total count: 10
[NEWS SERVICE] ABC RSS API response status: ok
[NEWS SERVICE] Processing ABC News RSS items, total count: 10
[NEWS SERVICE] ABC News Item 1: {
  title: 'Breaking: Donald Trump confirms meeting with Antho...',
  pubDate: '2025-09-16 14:13:35',
  formattedDate: 'Sep 16, 2025',
  source: 'ABC News'
}
 GET /api/news 200 in 484ms
💥 Audio generation failed for task task-1758033374771-0: TTS generation timeout after 60 seconds
Task task-1758033374771-0 updated: { status: 'FAILED', error: 'TTS generation timeout after 60 seconds' }
Publishing event: task:failed for task: task-1758033374771-0
[WebSocket] Task task-1758033374771-0 updated
❌ Audio generation failed for task: task-1758033374771-0 TTS generation timeout after 60 seconds
[IndexTTS-Client] 📊 Parsing API response...
[IndexTTS-Client] ✅ Found nested audio URL: https://tom1986-indextts2.hf.space/gradio_api/file=/tmp/gradio/93c0745f8ed4f23074a7fcb40bb72bf165c285fbf40f9d00ba65e3c30f8c1143/spk_1758033499.wav
[IndexTTS-Client] ✅ Processing completed in 20029ms
[IndexTTS-Integrated] ✅ Segment 3 completed successfully
[IndexTTS-Integrated] 📋 Processing segment 4/4
[IndexTTS-Integrated] 🎯 Generating speech for moderator: "A crucial meeting, with paneli..."
[IndexTTS-Integrated] 🎵 Using voice: Tom (tom)
[IndexTTS-Client] 🚀 Starting speech generation: "A crucial meeting, with panelists highlighting bot..."
[IndexTTS-Client] 📋 Attempt 1/1
[IndexTTS-Client] 📥 Downloading network file...
[IndexTTS-Client] ✅ Downloaded 171620 bytes
[IndexTTS-Client] 🔄 Processing with handle_file...
[IndexTTS-Client] ✅ File processed successfully
[IndexTTS-Client] 🔧 Built 24 parameters
[IndexTTS-Client] 🔄 Calling /gen_single...
[IndexTTS-Client] 📊 Parsing API response...
[IndexTTS-Client] ✅ Found nested audio URL: https://tom1986-indextts2.hf.space/gradio_api/file=/tmp/gradio/c8bb37566a540f8eb927fdfac1d4aa315e80dcaab1f1de5ccae49192c3064387/spk_1758033520.wav
[IndexTTS-Client] ✅ Processing completed in 19784ms
[IndexTTS-Integrated] ✅ Segment 4 completed successfully
[IndexTTS-Integrated] ✅ Batch completed: 4/4 successful