/**
 * 调试流水线执行
 */

const BASE_URL = 'http://localhost:3000/api'

async function debugPipeline() {
  console.log('🔍 Debugging Pipeline Execution...\n')

  try {
    // 1. 启动一个简单的流水线
    console.log('1️⃣ Starting simple pipeline')
    const startPayload = {
      newsTopics: ['AI技术测试'],
      debateRounds: 1
    }

    const startResponse = await fetch(`${BASE_URL}/pipeline/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(startPayload)
    })
    const startData = await startResponse.json()
    console.log('Pipeline started:', startData)

    // 2. 立即检查状态
    console.log('\n2️⃣ Immediate status check')
    const statusResponse1 = await fetch(`${BASE_URL}/pipeline/status`)
    const statusData1 = await statusResponse1.json()
    console.log('Immediate status:', {
      isActive: statusData1.pipeline?.isActive,
      totalTasks: statusData1.pipeline?.totalTasks,
      statusCounts: statusData1.statusCounts,
      workers: statusData1.workers?.map(w => `${w.type}:${w.isIdle ? 'idle' : 'busy'}`).join(', ')
    })

    // 3. 等待几秒后再检查
    console.log('\n3️⃣ Waiting 5 seconds...')
    await new Promise(resolve => setTimeout(resolve, 5000))

    const statusResponse2 = await fetch(`${BASE_URL}/pipeline/status`)
    const statusData2 = await statusResponse2.json()
    console.log('After 5 seconds:', {
      isActive: statusData2.pipeline?.isActive,
      statusCounts: statusData2.statusCounts,
      workers: statusData2.workers?.map(w => `${w.type}:${w.isIdle ? 'idle' : 'busy'}`).join(', ')
    })

    // 4. 再等待几秒
    console.log('\n4️⃣ Waiting another 10 seconds...')
    await new Promise(resolve => setTimeout(resolve, 10000))

    const statusResponse3 = await fetch(`${BASE_URL}/pipeline/status`)
    const statusData3 = await statusResponse3.json()
    console.log('After 15 seconds total:', {
      isActive: statusData3.pipeline?.isActive,
      statusCounts: statusData3.statusCounts,
      workers: statusData3.workers?.map(w => `${w.type}:${w.isIdle ? 'idle' : 'busy'}`).join(', '),
      tasks: statusData3.tasks?.map(t => `${t.id}:${t.status}`).join(', ')
    })

    // 5. 检查是否有任务准备播放
    console.log('\n5️⃣ Checking for playable content')
    const nextResponse = await fetch(`${BASE_URL}/pipeline/next`)
    const nextData = await nextResponse.json()
    console.log('Next content status:', nextData.status)
    console.log('Next content message:', nextData.message)
    if (nextData.data) {
      console.log('Content available:', {
        taskId: nextData.data.taskId,
        topic: nextData.data.newsTopic,
        hasScript: !!nextData.data.script,
        hasAudio: !!nextData.data.audioPlaylist
      })
    }

    // 6. 停止流水线
    console.log('\n6️⃣ Stopping pipeline')
    const stopResponse = await fetch(`${BASE_URL}/pipeline/status`, {
      method: 'DELETE'
    })
    const stopData = await stopResponse.json()
    console.log('Stop result:', stopData)

  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

// 运行调试
debugPipeline()