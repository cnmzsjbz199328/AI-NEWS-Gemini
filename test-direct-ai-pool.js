/**
 * 直接测试AI工作池
 */

async function testDirectAIPool() {
  console.log('🧪 Testing AI Worker Pool directly...\n')

  try {
    // 创建一个测试任务
    const testTask = {
      id: 'test-task-1',
      newsTopic: 'AI技术在医疗领域的应用',
      debateRounds: 1,
      status: 'PENDING_TEXT',
      script: null,
      audioPlaylist: null,
      voiceConfig: {
        moderator: { voiceId: 'cosy-zh-female-1' },
        tom: { voiceId: 'cosy-en-male-1' },
        mark: { voiceId: 'cosy-en-male-2' }
      },
      assignedWorker: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    console.log('📋 Test task created:', testTask.id)

    // 测试通过API调用AI工作池
    const response = await fetch('http://localhost:3000/api/test-ai-pool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: testTask, workerType: 'Gemini' })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ AI Pool test result:', result)
    } else {
      console.log('❌ AI Pool test failed:', response.status)
      const errorText = await response.text()
      console.log('Error:', errorText)
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// 运行测试
testDirectAIPool()