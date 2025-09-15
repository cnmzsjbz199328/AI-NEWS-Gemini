/**
 * 简单的流水线测试脚本
 */

async function testPipelineAPI() {
  const baseUrl = 'http://localhost:3001'
  
  console.log('🧪 Testing Pipeline API...')
  
  try {
    // 1. 测试状态端点
    console.log('\n1. Testing /api/pipeline/status')
    const statusResponse = await fetch(`${baseUrl}/api/pipeline/status`)
    const statusData = await statusResponse.json()
    console.log('Status:', statusData)
    
    // 2. 测试音色端点
    console.log('\n2. Testing /api/voices')
    const voicesResponse = await fetch(`${baseUrl}/api/voices`)
    const voicesData = await voicesResponse.json()
    console.log('Voices:', voicesData)
    
    // 3. 测试启动流水线
    console.log('\n3. Testing /api/pipeline/start')
    const startPayload = {
      newsTopics: ['测试新闻1', '测试新闻2'],
      debateRounds: 2,
      language: 'zh-CN'
    }
    
    const startResponse = await fetch(`${baseUrl}/api/pipeline/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(startPayload)
    })
    
    const startData = await startResponse.json()
    console.log('Start response:', startData)
    
    if (startResponse.ok) {
      console.log('✅ Pipeline started successfully!')
      
      // 4. 检查状态变化
      console.log('\n4. Checking status after start')
      const newStatusResponse = await fetch(`${baseUrl}/api/pipeline/status`)
      const newStatusData = await newStatusResponse.json()
      console.log('New status:', newStatusData)
      
      // 5. 测试停止
      console.log('\n5. Testing /api/pipeline/stop')
      const stopResponse = await fetch(`${baseUrl}/api/pipeline/stop`, {
        method: 'POST'
      })
      const stopData = await stopResponse.json()
      console.log('Stop response:', stopData)
      
    } else {
      console.log('❌ Pipeline start failed:', startData)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// 运行测试
testPipelineAPI()