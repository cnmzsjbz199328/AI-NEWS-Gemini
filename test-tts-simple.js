/**
 * 简单的TTS测试
 */

async function testTTSSimple() {
  console.log('🎵 Testing TTS generation...\n')

  try {
    console.log('📞 Calling TTS service...')
    const startTime = Date.now()
    
    const response = await fetch('http://localhost:3000/api/test-cosyvoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '你好，这是一个测试。',
        voiceId: '中文女',
        language: 'zh-CN'
      })
    })

    const duration = Date.now() - startTime
    console.log(`⏱️ Request completed in ${duration}ms`)

    if (response.ok) {
      const result = await response.json()
      console.log('✅ TTS test successful:', {
        success: result.success,
        hasAudioUrl: !!result.result?.audioUrl,
        audioUrl: result.result?.audioUrl?.substring(0, 80) + '...',
        duration: result.result?.duration
      })
    } else {
      console.log('❌ TTS test failed:', response.status)
      const errorText = await response.text()
      console.log('Error:', errorText)
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// 运行测试
testTTSSimple()