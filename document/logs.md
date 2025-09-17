PS C:\Users\tj169\OneDrive - Flinders\work\IT\AI-NEWS> npm run dev

> aitv-news-commentary@0.1.0 dev
> next dev

 ⚠ Port 3000 is in use, trying 3001 instead.
  ▲ Next.js 14.2.32
  - Local:        http://localhost:3001
  - Environments: .env.local, .env

 ✓ Starting...
 ✓ Ready in 2.2s
 ○ Compiling / ...
SERVICE] BBC RSS API response status: ok
[NEWS SERVICE] Processing BBC News RSS items, total count: 10
 GET /api/news 200 in 1256ms
[NEWS SERVICE] Fetching ABC news from URL: https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.abc.net.au%2Fnews%2Ffeed%2F51120%2Frss.xml&_t=1758106594655
[NEWS SERVICE] Fetching BBC news from URL: https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ffeeds.bbci.co.uk%2Fnews%2Frss.xml&_t=1758106594656
[NEWS SERVICE] BBC RSS API response status: ok
[NEWS SERVICE] Processing BBC News RSS items, total count: 10
[NEWS SERVICE] ABC RSS API response status: ok
[NEWS SERVICE] Processing ABC News RSS items, total count: 10
[NEWS SERVICE] ABC News Item 1: {
  title: "Ben &amp; Jerry's co-founder quits over Gaza dispu...",
  pubDate: '2025-09-17 10:18:43',
  formattedDate: 'Sep 17, 2025',
  source: 'ABC News'
}
 GET /api/news 200 in 857ms
 ○ Compiling /api/pipeline/status ...
 ✓ Compiled /api/pipeline/status in 1490ms (975 modules)
 ✓ Compiled (977 modules)
Subscribed to event: task:updated
Subscribed to event: task:created
Subscribed to event: task:completed
Subscribed to event: task:failed
(node:27104) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
 GET /api/pipeline/status 200 in 2268ms
[Pipeline API] Received POST request to start pipeline
[Pipeline API] Request body: {
  "newsTopics": [
    "Title: Ben &amp; Jerry's co-founder quits over Gaza dispute with parent company Unilever. Summary: Ben &amp; Jerry's co-founder, Jerry Greenfield, has resigned after a feud with parent company Unilever over Gaza conflict."
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
📋 Tasks created: task-1758106599029-0:PENDING_TEXT:en-US
Publishing event: task:created for task: task-1758106599029-0
[WebSocket] Task task-1758106599029-0 updated
🔄 Starting task processing...
🎯 Assigning task task-1758106599029-0 to worker Gemini
Worker Gemini assigned to task: task-1758106599029-0
Task task-1758106599029-0 updated: { status: 'GENERATING_TEXT' }
Publishing event: task:updated for task: task-1758106599029-0
[WebSocket] Task task-1758106599029-0 updated
✅ processTasks() called successfully
[Pipeline API] Pipeline started successfully
[Pipeline API] New pipeline state: { isActive: true, totalTasks: 1 }
🚀 Starting text generation for task: task-1758106599029-0 with worker: Gemini
 POST /api/pipeline/start 200 in 2295ms
🔄 Starting text generation for task-1758106599029-0 with Gemini (retry: 0)
📞 Calling aiWorkerPool.assignTask for task-1758106599029-0
🤖 Starting one-shot generation for task task-1758106599029-0 with Gemini
📝 Generated prompt for task-1758106599029-0 (2703 characters)
 GET /api/pipeline/status 200 in 12ms
Gemini API response: {
  hasText: true,
  textLength: 748,
  textPreview: '```json\n' +
    '{\n' +
    `  "moderator_intro": "Today, we discuss Jerry Greenfield's exit from Ben & Jerry's over the Gaza dispute with Unilever. What does this mean for corporate ethics?",\n` +
    '  "conversation": [\n' +
    '    {\n' +
    '      "speaker": "tom",\n' +
    `      "text": "Unilever's global strategy often requires consistent policy. Greenfield's departure, while personal, reflects a clash of priorities, not a flaw in governance."\n` +
    '    },\n' +
    '    {\n' +
    '      "speaker": "mark",\n' +
    `      "text": "It's a stark reminder that corporate ownership c`
}
🔍 Extracted JSON for task task-1758106599029-0 (736 characters)
✅ Successfully parsed script for task task-1758106599029-0: { hasIntro: true, conversationLength: 2, hasOutro: true }
✅ One-shot generation completed for task task-1758106599029-0 in 14236ms
📋 AI task result for task-1758106599029-0: { success: true, hasScript: true, error: undefined, duration: 14236 }
✅ Text generation completed for task: task-1758106599029-0
Task task-1758106599029-0 updated: {
  script: {
    moderator_intro: "Today, we discuss Jerry Greenfield's exit from Ben & Jerry's over the Gaza dispute with Unilever. What does this mean for corporate ethics?",
    conversation: [ [Object], [Object] ],
    moderator_outro: 'A complex issue of corporate control versus brand ethics. Thank you, Tom and Mark, for this insightful discussion.'
  }
}
Task task-1758106599029-0 updated: { status: 'PENDING_AUDIO' }
Publishing event: task:updated for task: task-1758106599029-0
[WebSocket] Task task-1758106599029-0 updated
✅ Text generation completed for task: task-1758106599029-0
Worker Gemini released
 GET /api/pipeline/status 200 in 7ms
 GET /api/pipeline/status 200 in 7ms
Task task-1758106599029-0 updated: { status: 'GENERATING_AUDIO' }
Publishing event: task:updated for task: task-1758106599029-0
[WebSocket] Task task-1758106599029-0 updated
🎵 Starting audio generation for task: task-1758106599029-0
🎵 Starting audio generation for task: task-1758106599029-0 in language: en-US
[IndexTTS-Client] ✅ Client initialized with 90s timeout
[VoiceConfigManager] Initialized with mapping: { moderator: 'tom', tom: 'guodegang', mark: 'cillian' }
[IndexTTS-Integrated] Service initialized
🎵 Generating 4 audio items for task: task-1758106599029-0 using IndexTTS
🕐 Starting batch speech generation (timeout handled by IndexTTS service)
[IndexTTS-Integrated] 🎪 Generating batch speech: 4 segments
[IndexTTS-Integrated] 📋 Processing segment 1/4
[IndexTTS-Integrated] 🎯 Generating speech for moderator: "Today, we discuss Jerry Greenf..."
[IndexTTS-Integrated] 🎵 Using voice: Tom (tom)
[IndexTTS-Client] 🚀 Starting speech generation: "Today, we discuss Jerry Greenfield's exit from Ben..."
[IndexTTS-Client] 📋 Attempt 1/1
[IndexTTS-Client] 🔐 Connecting to private Space: Tom1986/indextts2
 GET /api/pipeline/status 200 in 6ms
[IndexTTS-Client] ✅ Connected successfully
[IndexTTS-Client] 📥 Downloading network file...
[IndexTTS-Client] ✅ Downloaded 171620 bytes
[IndexTTS-Client] 🔄 Processing with handle_file...
[IndexTTS-Client] ✅ File processed successfully
[IndexTTS-Client] 🔧 Built 24 parameters
[IndexTTS-Client] 🔄 Calling /gen_single...
 GET /api/pipeline/status 200 in 8ms
[IndexTTS-Client] 📊 Parsing API response...
[IndexTTS-Client] ✅ Found nested audio URL: https://tom1986-indextts2.hf.space/gradio_api/file=/tmp/gradio/558a14f997334abc4cfdef476402cc64ba03bc3330be1f020aad230de4430327/spk_1758106622.wav
 GET /api/pipeline/status 200 in 8ms
 GET /api/pipeline/status 200 in 7ms
[IndexTTS-Client] ✅ Processing completed in 21691ms
[IndexTTS-Integrated] ✅ Segment 1 completed successfully
[IndexTTS-Integrated] 📋 Processing segment 2/4
[IndexTTS-Integrated] 🎯 Generating speech for tom: "Unilever's global strategy oft..."    
[IndexTTS-Integrated] 🎵 Using voice: 郭德纲 (guodegang)
[IndexTTS-Client] 🚀 Starting speech generation: "Unilever's global strategy often requires consiste..."
[IndexTTS-Client] 📋 Attempt 1/1
[IndexTTS-Client] 📥 Downloading network file...
[IndexTTS-Client] ✅ Downloaded 216960 bytes
[IndexTTS-Client] 🔄 Processing with handle_file...
[IndexTTS-Client] ✅ File processed successfully
[IndexTTS-Client] 🔧 Built 24 parameters
[IndexTTS-Client] 🔄 Calling /gen_single...
 GET /api/pipeline/status 200 in 6ms
[IndexTTS-Client] 📊 Parsing API response...
[IndexTTS-Client] ✅ Found nested audio URL: https://tom1986-indextts2.hf.space/gradio_api/file=/tmp/gradio/be7a9d4460e3629ad039370cb334af2cce37e144427c8d4e10923009a19e54b0/spk_1758106641.wav
[IndexTTS-Client] ✅ Processing completed in 16406ms
[IndexTTS-Integrated] ✅ Segment 2 completed successfully
 GET /api/pipeline/status 200 in 7ms
 GET /api/pipeline/status 200 in 7ms
[IndexTTS-Integrated] 📋 Processing segment 3/4
[IndexTTS-Integrated] 🎯 Generating speech for mark: "It's a stark reminder that cor..."   
[IndexTTS-Integrated] 🎵 Using voice: Cillian Murphy (cillian)
[IndexTTS-Client] 🚀 Starting speech generation: "It's a stark reminder that corporate ownership can..."
[IndexTTS-Client] 📋 Attempt 1/1
[IndexTTS-Client] 📥 Downloading network file...
[IndexTTS-Client] ✅ Downloaded 178560 bytes
[IndexTTS-Client] 🔄 Processing with handle_file...
[IndexTTS-Client] ✅ File processed successfully
[IndexTTS-Client] 🔧 Built 24 parameters
[IndexTTS-Client] 🔄 Calling /gen_single...
 GET /api/pipeline/status 200 in 10ms
 GET /api/pipeline/status 200 in 12ms
 GET /api/pipeline/status 200 in 7ms
 GET /api/pipeline/status 200 in 8ms
[IndexTTS-Client] 📊 Parsing API response...
[IndexTTS-Client] ✅ Found nested audio URL: https://tom1986-indextts2.hf.space/gradio_api/file=/tmp/gradio/15cabac9809b453e106d681f30840f339a3c41b508d4a331394a1222626346c8/spk_1758106659.wav
[IndexTTS-Client] ✅ Processing completed in 12769ms
[IndexTTS-Integrated] ✅ Segment 3 completed successfully
[IndexTTS-Integrated] 📋 Processing segment 4/4
[IndexTTS-Integrated] 🎯 Generating speech for moderator: "A complex issue of corporate c..."
[IndexTTS-Integrated] 🎵 Using voice: Tom (tom)
[IndexTTS-Client] 🚀 Starting speech generation: "A complex issue of corporate control versus brand ..."
[IndexTTS-Client] 📋 Attempt 1/1
[IndexTTS-Client] 📥 Downloading network file...
[IndexTTS-Client] ✅ Downloaded 171620 bytes
[IndexTTS-Client] 🔄 Processing with handle_file...
[IndexTTS-Client] ✅ File processed successfully
[IndexTTS-Client] 🔧 Built 24 parameters
[IndexTTS-Client] 🔄 Calling /gen_single...
[IndexTTS-Client] 📊 Parsing API response...
[IndexTTS-Client] ✅ Found nested audio URL: https://tom1986-indextts2.hf.space/gradio_api/file=/tmp/gradio/503a4a99daa9e4c448a3536a63960b6921ccec2b54f14847c4ecd38d500303dd/spk_1758106672.wav
[IndexTTS-Client] ✅ Processing completed in 15498ms
[IndexTTS-Integrated] ✅ Segment 4 completed successfully
[IndexTTS-Integrated] ✅ Batch completed: 4/4 successful
✅ Audio generation completed for task: task-1758106599029-0 (4/4 successful)
Task task-1758106599029-0 updated: {
  audioPlaylist: {
    moderator_intro: 'https://tom1986-indextts2.hf.space/gradio_api/file=/tmp/gradio/558a14f997334abc4cfdef476402cc64ba03bc3330be1f020aad230de4430327/spk_1758106622.wav',
    conversation: [ [Object], [Object] ],
    moderator_outro: 'https://tom1986-indextts2.hf.space/gradio_api/file=/tmp/gradio/503a4a99daa9e4c448a3536a63960b6921ccec2b54f14847c4ecd38d500303dd/spk_1758106672.wav'
  }
}
Task task-1758106599029-0 updated: { status: 'READY_TO_PLAY' }
Publishing event: task:completed for task: task-1758106599029-0
[WebSocket] Task task-1758106599029-0 updated
✅ Audio generation completed for task: task-1758106599029-0
 GET /api/pipeline/status 200 in 11ms
 GET /api/pipeline/status 200 in 10ms
 ✓ Compiled /api/pipeline/task/[taskId]/audio in 253ms (973 modules)
Subscribed to event: task:updated
Subscribed to event: task:created
Subscribed to event: task:completed
Subscribed to event: task:failed
 GET /api/pipeline/status 200 in 330ms
Subscribed to event: task:updated
Subscribed to event: task:created
Subscribed to event: task:completed
Subscribed to event: task:failed
[Task Audio API] 🎵 Getting audio for task: task-1758106599029-0
 GET /api/pipeline/task/task-1758106599029-0/audio 404 in 1157ms
(node:32536) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
 GET /api/pipeline/status 200 in 6ms