○ Compiling /api/pipeline/start ...
 ✓ Compiled /api/pipeline/start in 882ms (739 modules)
[API /start] Received request to start pipeline
[TaskManager] Task created: task-1758357183627-2jgxc8e6z (expecting 4 audio items)
[API /start] Task task-1758357183627-2jgxc8e6z created. Triggering background orchestration.
[Orchestrator] Creating task for topic: "Test reuse feature"
 POST /api/pipeline/start 200 in 2611ms
[TaskManager] Task created: task-1758357184057-720gfirjf (expecting 4 audio items)
[Orchestrator] Task task-1758357184057-720gfirjf created.
[TaskManager] Task task-1758357184057-720gfirjf updated: { status: 'GENERATING_TEXT' }
[Orchestrator] Task task-1758357184057-720gfirjf: Generating script...
🔄 Starting text generation for text-gen-task-1758357184229 with Gemini (retry: 0)
📞 Calling aiWorkerPool.assignTask for text-gen-task-1758357184229
🤖 Starting one-shot generation for task text-gen-task-1758357184229 with Gemini
📝 Generated prompt for text-gen-task-1758357184229 (2500 characters)
Gemini API response: {
  hasText: true,
  textLength: 768,
  textPreview: '```json\n' +
    '{\n' +
    `  "moderator_intro": "Welcome. Today we discuss AI's role in content reuse for journalism. Can it enhance efficiency or compromise integrity?",\n` +
    '  "conversation": [\n' +
    '    {\n' +
    '      "speaker": "tom",\n' +
    '      "text": "AI excels at identifying and reusing factual data, ensuring consistency & speed. It frees journalists for deeper investigations, enhancing output significantly."\n' +
    '    },\n' +
    '    {\n' +
    '      "speaker": "mark",\n' +
    '      "text": "But AI-driven reuse risks losing human context and nuance. It coul'
}
🔍 Extracted JSON for task text-gen-task-1758357184229 (756 characters)
✅ Successfully parsed script for task text-gen-task-1758357184229: { hasIntro: true, conversationLength: 2, hasOutro: true }
✅ One-shot generation completed for task text-gen-task-1758357184229 in 5686ms
📋 AI task result for text-gen-task-1758357184229: { success: true, hasScript: true, error: undefined, duration: 5686 }
✅ Text generation completed for task: text-gen-task-1758357184229
[Orchestrator] Task task-1758357184057-720gfirjf: Script generated and saved.
[TaskManager] Task task-1758357184057-720gfirjf updated: { status: 'GENERATING_AUDIO' }
[Orchestrator] Task task-1758357184057-720gfirjf: Starting audio generation...
[AudioService] Generating audio for speaker "test_speaker"...
[IndexTTS-Client] ✅ Client initialized with 90s timeout
[VoiceConfigManager] Initialized with mapping: { moderator: 'tom', tom: 'guodegang', mark: 'cillian' }      
[IndexTTS-Integrated] Service initialized
[IndexTTS-Integrated] 🎯 Generating speech for test_speaker: "Welcome. Today we discuss AI's..."
[VoiceConfigManager] Voice not found for role test_speaker, using fallback
[IndexTTS-Integrated] 🎵 Using voice: Tom (tom)       
[IndexTTS-Client] 🚀 Starting speech generation: "Welcome. Today we discuss AI's role in content reu..."    
[IndexTTS-Client] 📋 Attempt 1/1
[IndexTTS-Client] 🔐 Connecting to private Space: Tom1986/indextts2
[IndexTTS-Client] ✅ Connected successfully
[IndexTTS-Client] 📥 Downloading network file...      
[IndexTTS-Client] ✅ Downloaded 171620 bytes
[IndexTTS-Client] 🔄 Processing with handle_file...   
[IndexTTS-Client] ✅ File processed successfully      
[IndexTTS-Client] 🔧 Built 24 parameters
[IndexTTS-Client] 🔄 Calling /gen_single...
 GET /api/pipeline/status 200 in 21ms
[IndexTTS-Client] 📊 Parsing API response...
[IndexTTS-Client] ✅ Found nested audio URL: https://tom1986-indextts2.hf.space/gradio_api/file=/tmp/gradio/62377d43686ff304bfb930741c4b2b082f8eb9f03b21afded0895dfb51d69e6d/spk_1758357199.wav
[IndexTTS-Client] ✅ Processing completed in 19263ms
[AudioService] ✅ Audio generated successfully for speaker "test_speaker".
[AudioService] 🔄 Converted HF URL to proxy: /api/audio/https://tom1986-indextts2.hf.space/gradio_api/file=/tmp/gradio/62377d43686ff304bfb930741c4b2b082f8eb9f03b21afded0895dfb51d69e6d/spk_1758357199.wav
[TaskManager] 🎵 Audio added to task-1758357184057-720gfirjf: (1/4)
[AudioService] Generating audio for speaker "tom"...  
[IndexTTS-Integrated] 🎯 Generating speech for tom: "AI excels at identifying and r..."
[IndexTTS-Integrated] 🎵 Using voice: 郭德纲 (guodegang)
[IndexTTS-Client] 🚀 Starting speech generation: "AI excels at identifying and reusing factual data,..."    
[IndexTTS-Client] 📋 Attempt 1/1
[AudioService] Generating audio for speaker "mark"... 
[IndexTTS-Integrated] 🎯 Generating speech for mark: "But AI-driven reuse risks losi..."
[IndexTTS-Integrated] 🎵 Using voice: Cillian Murphy (cillian)
[IndexTTS-Client] 🚀 Starting speech generation: "But AI-driven reuse risks losing human context and..."    
[IndexTTS-Client] 📋 Attempt 1/1
[IndexTTS-Client] 📥 Downloading network file...      
[IndexTTS-Client] 📥 Downloading network file...      
[IndexTTS-Client] ✅ Downloaded 178560 bytes
[IndexTTS-Client] 🔄 Processing with handle_file...   
[IndexTTS-Client] ✅ File processed successfully      
[IndexTTS-Client] 🔧 Built 24 parameters
[IndexTTS-Client] 🔄 Calling /gen_single...
[IndexTTS-Client] ✅ Downloaded 216960 bytes
[IndexTTS-Client] 🔄 Processing with handle_file...   
[IndexTTS-Client] ✅ File processed successfully      
[IndexTTS-Client] 🔧 Built 24 parameters
[IndexTTS-Client] 🔄 Calling /gen_single...
[IndexTTS-Client] 📊 Parsing API response...
[IndexTTS-Client] ✅ Found nested audio URL: https://tom1986-indextts2.hf.space/gradio_api/file=/tmp/gradio/7ecc40456e05d8abef9ff6788ef4483a41f5604c1cb5e0e5250ddcf072cdba2f/spk_1758357214.wav
[IndexTTS-Client] ✅ Processing completed in 14285ms
[AudioService] ✅ Audio generated successfully for speaker "mark".
[AudioService] 🔄 Converted HF URL to proxy: /api/audio/https://tom1986-indextts2.hf.space/gradio_api/file=/tmp/gradio/7ecc40456e05d8abef9ff6788ef4483a41f5604c1cb5e0e5250ddcf072cdba2f/spk_1758357214.wav
[TaskManager] 🎵 Audio added to task-1758357184057-720gfirjf: (2/4)
[IndexTTS-Client] 📊 Parsing API response...
[IndexTTS-Client] ✅ Found nested audio URL: https://tom1986-indextts2.hf.space/gradio_api/file=/tmp/gradio/1a9277e965d5869cc1b05d4080f929fc40e93e9fafce7aea14464c7292d084ce/spk_1758357217.wav
[IndexTTS-Client] ✅ Processing completed in 18042ms
[AudioService] ✅ Audio generated successfully for speaker "tom".
[AudioService] 🔄 Converted HF URL to proxy: /api/audio/https://tom1986-indextts2.hf.space/gradio_api/file=/tmp/gradio/1a9277e965d5869cc1b05d4080f929fc40e93e9fafce7aea14464c7292d084ce/spk_1758357217.wav
[TaskManager] 🎵 Audio added to task-1758357184057-720gfirjf: (3/4)
[AudioService] Generating audio for speaker "test_speaker"...
[IndexTTS-Integrated] 🎯 Generating speech for test_speaker: "An insightful debate on AI's p..."
[VoiceConfigManager] Voice not found for role test_speaker, using fallback
[IndexTTS-Integrated] 🎵 Using voice: Tom (tom)       
[IndexTTS-Client] 🚀 Starting speech generation: "An insightful debate on AI's potential for content..."    
[IndexTTS-Client] 📋 Attempt 1/1
[IndexTTS-Client] 📥 Downloading network file...      
[IndexTTS-Client] ✅ Downloaded 171620 bytes
[IndexTTS-Client] 🔄 Processing with handle_file...   
[IndexTTS-Client] ✅ File processed successfully      
[IndexTTS-Client] 🔧 Built 24 parameters
[IndexTTS-Client] 🔄 Calling /gen_single..