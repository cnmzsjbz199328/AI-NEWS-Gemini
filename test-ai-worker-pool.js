/**
 * 测试AI工作池功能
 */

const BASE_URL = 'http://localhost:3000/api'

async function testAIWorkerPool() {
  console.log('🤖 Testing AI Worker Pool Functionality...\n')

  try {
    // 1. 启动流水线
    console.log('1️⃣ Starting pipeline with AI worker pool')
    const startPayload = {
      newsTopics: [
        'AI技术在医疗领域的最新突破',
        '全球气候变化的影响与对策',
        '数字货币的未来发展趋势',
        '太空探索的新里程碑',
        '可再生能源技术的进展'
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
    console.log('✅ Pipeline started:', startData.success ? 'SUCCESS' : 'FAILED')
    console.log(`   Total tasks: ${startData.pipelineState?.totalTasks}\n`)

    // 2. 监控任务进度
    console.log('2️⃣ Monitoring task progress...')
    let completedTasks = 0
    let maxIterations = 60 // 最多监控60秒
    let iteration = 0

    while (completedTasks < 5 && iteration < maxIterations) {
      await new Promise(resolve => setTimeout(resolve, 1000)) // 等待1秒
      
      const statusResponse = await fetch(`${BASE_URL}/pipeline/status`)
      const statusData = await statusResponse.json()
      
      if (statusData.success) {
        const counts = statusData.statusCounts
        const newCompletedTasks = counts.READY_TO_PLAY + counts.DONE
        
        if (newCompletedTasks > completedTasks) {
          completedTasks = newCompletedTasks
          console.log(`   Progress: ${completedTasks}/5 tasks completed`)
          console.log(`   Status: PENDING_TEXT:${counts.PENDING_TEXT}, GENERATING_TEXT:${counts.GENERATING_TEXT}, PENDING_AUDIO:${counts.PENDING_AUDIO}, GENERATING_AUDIO:${counts.GENERATING_AUDIO}, READY_TO_PLAY:${counts.READY_TO_PLAY}, DONE:${counts.DONE}`)
          console.log(`   Workers: ${statusData.workers?.map(w => `${w.type}:${w.isIdle ? 'idle' : 'busy'}`).join(', ')}`)
        }
      }
      
      iteration++
    }

    console.log()

    // 3. 测试获取已完成的任务
    console.log('3️⃣ Testing playback of completed tasks')
    let playedTasks = 0
    
    while (playedTasks < Math.min(completedTasks, 3)) { // 最多播放3个任务
      const nextResponse = await fetch(`${BASE_URL}/pipeline/next`)
      const nextData = await nextResponse.json()
      
      if (nextData.success && nextData.status === 'ready') {
        console.log(`   📺 Playing task: ${nextData.data.newsTopic.substring(0, 30)}...`)
        console.log(`   📝 Script has ${nextData.data.script?.conversation?.length || 0} conversation items`)
        console.log(`   🎵 Audio playlist has ${nextData.data.audioPlaylist?.conversation?.length || 0} audio items`)
        
        // 标记任务为已完成
        const completeResponse = await fetch(`${BASE_URL}/pipeline/next`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: nextData.data.taskId, action: 'complete' })
        })
        
        const completeData = await completeResponse.json()
        if (completeData.success) {
          playedTasks++
          console.log(`   ✅ Task marked as completed (${playedTasks} played)`)
        }
      } else if (nextData.status === 'waiting') {
        console.log('   ⏳ Waiting for next task to be ready...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      } else {
        console.log(`   ℹ️ Status: ${nextData.status} - ${nextData.message}`)
        break
      }
      
      console.log()
    }

    // 4. 最终状态检查
    console.log('4️⃣ Final status check')
    const finalStatusResponse = await fetch(`${BASE_URL}/pipeline/status`)
    const finalStatusData = await finalStatusResponse.json()
    
    if (finalStatusData.success) {
      console.log(`   Pipeline active: ${finalStatusData.pipeline?.isActive}`)
      console.log(`   Progress: ${finalStatusData.pipeline?.completedTasks}/${finalStatusData.pipeline?.totalTasks}`)
      console.log(`   Current play index: ${finalStatusData.pipeline?.currentPlayIndex}`)
      console.log(`   Final status counts:`, finalStatusData.statusCounts)
    }

    // 5. 停止流水线
    console.log('\n5️⃣ Stopping pipeline')
    const stopResponse = await fetch(`${BASE_URL}/pipeline/status`, {
      method: 'DELETE'
    })
    const stopData = await stopResponse.json()
    console.log('✅ Pipeline stopped:', stopData.success ? 'SUCCESS' : 'FAILED')

    console.log('\n🎉 AI Worker Pool test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// 运行测试
testAIWorkerPool()