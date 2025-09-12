/**
 * 直接测试CosyVoice API
 */

async function testCosyVoiceDirect() {
  console.log('🎵 Testing CosyVoice API directly...\n')

  try {
    // 测试CosyVoice TTS服务
    const response = await fetch('http://localhost:3000/api/test-cosyvoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello, this is a test of the CosyVoice API.',
        voiceId: '英文女',
        language: 'en-US'
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ CosyVoice test result:', result)
    } else {
      console.log('❌ CosyVoice test failed:', response.status)
      const errorText = await response.text()
      console.log('Error:', errorText)
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// 运行测试
testCosyVoiceDirect()