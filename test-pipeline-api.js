/**
 * 测试流水线API端点
 */

const BASE_URL = 'http://localhost:3000/api'

async function testAPI() {
  console.log('🧪 Testing Pipeline API Endpoints...\n')

  try {
    // 1. 测试获取音色列表
    console.log('1️⃣ Testing GET /api/voices')
    const voicesResponse = await fetch(`${BASE_URL}/voices`)
    const voicesData = await voicesResponse.json()
    console.log('✅ Voices API:', voicesData.success ? 'SUCCESS' : 'FAILED')
    console.log(`   Found ${voicesData.total} voices\n`)

    // 2. 测试流水线状态（应该是未激活）
    console.log('2️⃣ Testing GET /api/pipeline/status (before start)')
    const statusResponse1 = await fetch(`${BASE_URL}/pipeline/status`)
    const statusData1 = await statusResponse1.json()
    console.log('✅ Status API:', statusData1.success ? 'SUCCESS' : 'FAILED')
    console.log(`   Pipeline active: ${statusData1.pipeline?.isActive}\n`)

    // 3. 测试启动流水线
    console.log('3️⃣ Testing POST /api/pipeline/start')
    const startPayload = {
      newsTopics: [
        'AI技术在医疗领域的最新突破',
        '全球气候变化的影响与对策',
        '数字货币的未来发展趋势'
      ],
      debateRounds: 2,
      voiceConfig: {
        moderator: { voiceId: 'cosy-zh-female-1' },
        tom: { voiceId: 'cosy-en-male-1' },
        mark: { voiceId: 'cosy-en-male-2' }
      }
    }

    const startResponse = await fetch(`${BASE_URL}/pipeline/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(startPayload)
    })
    const startData = await startResponse.json()
    console.log('✅ Start API:', startData.success ? 'SUCCESS' : 'FAILED')
    console.log(`   Total tasks: ${startData.pipelineState?.totalTasks}\n`)

    // 4. 测试流水线状态（应该是激活的）
    console.log('4️⃣ Testing GET /api/pipeline/status (after start)')
    const statusResponse2 = await fetch(`${BASE_URL}/pipeline/status`)
    const statusData2 = await statusResponse2.json()
    console.log('✅ Status API:', statusData2.success ? 'SUCCESS' : 'FAILED')
    console.log(`   Pipeline active: ${statusData2.pipeline?.isActive}`)
    console.log(`   Total tasks: ${statusData2.pipeline?.totalTasks}`)
    console.log(`   Status counts:`, statusData2.statusCounts)
    console.log(`   Workers:`, statusData2.workers?.map(w => `${w.type}:${w.isIdle ? 'idle' : 'busy'}`).join(', '))
    console.log()

    // 5. 测试获取下一个播放内容（应该是等待状态）
    console.log('5️⃣ Testing GET /api/pipeline/next')
    const nextResponse = await fetch(`${BASE_URL}/pipeline/next`)
    const nextData = await nextResponse.json()
    console.log('✅ Next API:', nextData.success ? 'SUCCESS' : 'FAILED')
    console.log(`   Status: ${nextData.status}`)
    console.log(`   Message: ${nextData.message}`)
    console.log(`   Full response:`, JSON.stringify(nextData, null, 2))
    console.log()

    // 6. 测试重复启动（应该失败）
    console.log('6️⃣ Testing duplicate start (should fail)')
    const duplicateStartResponse = await fetch(`${BASE_URL}/pipeline/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(startPayload)
    })
    const duplicateStartData = await duplicateStartResponse.json()
    console.log('✅ Duplicate start:', duplicateStartResponse.status === 409 ? 'CORRECTLY FAILED' : 'UNEXPECTED')
    console.log(`   Error: ${duplicateStartData.error}\n`)

    // 7. 测试停止流水线
    console.log('7️⃣ Testing DELETE /api/pipeline/status (stop)')
    const stopResponse = await fetch(`${BASE_URL}/pipeline/status`, {
      method: 'DELETE'
    })
    const stopData = await stopResponse.json()
    console.log('✅ Stop API:', stopData.success ? 'SUCCESS' : 'FAILED')
    console.log(`   Message: ${stopData.message}\n`)

    // 8. 测试停止后的状态
    console.log('8️⃣ Testing status after stop')
    const statusResponse3 = await fetch(`${BASE_URL}/pipeline/status`)
    const statusData3 = await statusResponse3.json()
    console.log('✅ Final Status:', statusData3.success ? 'SUCCESS' : 'FAILED')
    console.log(`   Pipeline active: ${statusData3.pipeline?.isActive}\n`)

    console.log('🎉 All tests completed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// 运行测试
testAPI()