Failed to load resource: the server responded with a status of 404 (Not Found)Understand this error
:3000/voices/moderator_reference.wav:1  Failed to load resource: the server responded with a status of 404 (Not Found)Understand this error
:3000/voices/moderator_reference.wav:1  Failed to load resource: the server responded with a status of 404 (Not Found)Understand this error
:3000/voices/moderator_reference.wav:1  Failed to load resource: the server responded with a status of 404 (Not Found)Understand this error
cosyvoice-tts-service.ts:128 ❌ Speech generation failed for moderator: CosyVoice API failed after 3 attempts: TypeError: Failed to fetch
window.console.error @ app-index.js:33
console.error @ hydration-error-info.js:63
generateSpeech @ cosyvoice-tts-service.ts:128Understand this error
fallback-tts.ts:144 [FallbackTTS] Speech error for moderator: interrupted
window.console.error @ app-index.js:33
console.error @ hydration-error-info.js:63
utterance.onerror @ fallback-tts.ts:144Understand this error
audio-manager.ts:171 [AudioManager] Fallback TTS error for moderator: Error: Speech synthesis failed: interrupted
    at utterance.onerror (fallback-tts.ts:145:18)
window.console.error @ app-index.js:33
console.error @ hydration-error-info.js:63
playWithFallbackTTS @ audio-manager.ts:171Understand this error
app-index.js:33 [FallbackTTS] Speech error for tom: interrupted
window.console.error @ app-index.js:33Understand this error
app-index.js:33 [AudioManager] Fallback TTS error for tom: Error: Speech synthesis failed: interrupted
    at utterance.onerror (fallback-tts.ts:145:18)
window.console.error @ app-index.js:33Understand this error
app-index.js:33 [FallbackTTS] Speech error for mark: interrupted
window.console.error @ app-index.js:33Understand this error
app-index.js:33 [GenerationManager] All TTS services failed for mark: All TTS services failed. Last error: Speech synthesis failed: interrupted
window.console.error @ app-index.js:33Understand this error
app-index.js:33 [GenerationManager] All TTS services failed for moderator: All TTS services failed. Last error: undefined
window.console.error @ app-index.js:33Understand this error
app-index.js:33 Failed to download preset voice: TypeError: Failed to fetch
    at handleSelectPreset (PresetVoices.tsx:45:30)
    at onClick (PresetVoices.tsx:112:36)
    at HTMLUnknownElement.callCallback (react-dom.development.js:20565:14)
    at Object.invokeGuardedCallbackImpl (react-dom.development.js:20614:16)
    at invokeGuardedCallback (react-dom.development.js:20689:29)
    at invokeGuardedCallbackAndCatchFirstError (react-dom.development.js:20703:25)
    at executeDispatch (react-dom.development.js:32128:3)
    at processDispatchQueueItemsInOrder (react-dom.development.js:32160:7)
    at processDispatchQueue (react-dom.development.js:32173:5)
    at dispatchEventsForPlugins (react-dom.development.js:32184:3)
    at eval (react-dom.development.js:32374:12)
    at batchedUpdates$1 (react-dom.development.js:24953:12)
    at batchedUpdates (react-dom.development.js:28844:12)
    at dispatchEventForPluginEventSystem (react-dom.development.js:32373:3)
    at dispatchEvent (react-dom.development.js:30141:5)
    at dispatchDiscreteEvent (react-dom.development.js:30112:5)