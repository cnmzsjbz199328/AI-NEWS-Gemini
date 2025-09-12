/**
 * 长时间等待测试
 */

const BASE_URL = 'http://localhost:3000/api'

async function longWaitTest() {
  console.log('⏳ Long wait test for AI task completion...\n')

  try {
    // 启动流水线
    console.log('1️⃣ Starting pipeline')
    const startResponse = await fetch(`${BASE_URL}/pipeline/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newsTopics: ['AI技术测试'],
        debateRounds: 1
      })
    })
    const startData = await startResponse.json()
    console.log('Pipeline started:', startData.success)

    // 每5秒检查一次状态，最多等待2分钟
    let iteration = 0
    const maxIterations = 24 // 2分钟
    let taskCompleted = false

    while (iteration < maxIterations && !taskCompleted) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // 等待5秒
      iteration++

      const statusResponse = await fetch(`${BASE_URL}/pipeline/status`)
      const statusData = await statusResponse.json()

      if (statusData.success) {
        const counts = statusData.statusCounts
        console.log(`⏰ ${iteration * 5}s - Status:`, {
          PENDING_TEXT: counts.PENDING_TEXT,
          GENERATING_TEXT: counts.GENERATING_TEXT,
          PENDING_AUDIO: counts.PENDING_AUDIO,
          GENERATING_AUDIO: counts.GENERATING_AUDIO,
          READY_TO_PLAY: counts.READY_TO_PLAY,
          DONE: counts.DONE
        })

        // 检查是否有任务完成
        if (counts.READY_TO_PLAY > 0 || counts.DONE > 0) {
          taskCompleted = true
          console.log('✅ Task completed!')
          
          // 尝试获取完成的任务
          const nextResponse = await fetch(`${BASE_URL}/pipeline/next`)
          const nextData = await nextResponse.json()
          
          if (nextData.success && nextData.data) {
            console.log('📺 Completed task details:')
            console.log('  Topic:', nextData.data.newsTopic)
            console.log('  Has script:', !!nextData.data.script)
            console.log('  Has audio:', !!nextData.data.audioPlaylist)
            
            if (nextData.data.script) {
              console.log('  Script intro:', nextData.data.script.moderator_intro?.substring(0, 50) + '...')
              console.log('  Conversation items:', nextData.data.script.conversation?.length)
            }
          }
        }
      }
    }

    if (!taskCompleted) {
      console.log('❌ Task did not complete within 2 minutes')
    }

    // 停止流水线
    console.log('\n🛑 Stopping pipeline')
    await fetch(`${BASE_URL}/pipeline/status`, { method: 'DELETE' })

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// 运行测试
longWaitTest()