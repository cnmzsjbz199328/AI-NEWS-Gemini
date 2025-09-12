/**
 * 测试单个AI Provider调用
 */

const BASE_URL = 'http://localhost:3000/api'

async function testSingleAI() {
  console.log('🧠 Testing single AI provider call...\n')

  try {
    // 测试现有的AI生成端点
    const testPayload = {
      speaker: 'moderator',
      prompt: 'Please introduce a debate about AI technology in healthcare',
      topic: 'AI技术在医疗领域的最新突破',
      conversation: []
    }

    console.log('📞 Calling existing AI generate endpoint...')
    const response = await fetch(`${BASE_URL}/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ AI call successful!')
      console.log('Response:', data)
    } else {
      console.log('❌ AI call failed with status:', response.status)
      const errorText = await response.text()
      console.log('Error:', errorText)
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// 运行测试
testSingleAI()