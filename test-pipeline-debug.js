/**
 * 详细调试流水线执行
 */

const BASE_URL = 'http://localhost:3001/api'

async function debugPipelineExecution() {
  console.log('🔍 Debugging Pipeline Execution in Detail...\n')

  try {
    // 1. 启动一个简单的中文流水线
    console.log('1️⃣ Starting Chinese pipeline')
    const startResponse = await fetch(`${BASE_URL}/pipeline/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newsTopics: ['AI技术测试'],
        debateRounds: 1,
        language: 'zh-CN'
      })
    })
    
    const startData = await startResponse.json()
    console.log('Start response:', JSON.stringify(startData, null, 2))

    if (!startData.success) {
      console.error('❌ Failed to start pipeline')
      return
    }

    // 2. 立即检查详细状态
    console.log('\n2️⃣ Immediate detailed status check')
    const statusResponse1 = await fetch(`${BASE_URL}/pipeline/status`)
    const statusData1 = await statusResponse1.json()
    
    console.log('Immediate status:', JSON.stringify({
      isActive: statusData1.pipeline?.isActive,
      totalTasks: statusData1.pipeline?.totalTasks,
      statusCounts: statusData1.statusCounts,
      workers: statusData1.workers,
      tasks: statusData1.tasks
    }, null, 2))

    // 3. 等待5秒后再次检查
    console.log('\n3️⃣ Waiting 5 seconds and checking again...')
    await new Promise(resolve => setTimeout(resolve, 5000))

    const statusResponse2 = await fetch(`${BASE_URL}/pipeline/status`)
    const statusData2 = await statusResponse2.json()
    
    console.log('After 5 seconds:', JSON.stringify({
      isActive: statusData2.pipeline?.isActive,
      statusCounts: statusData2.statusCounts,
      workers: statusData2.workers,
      tasks: statusData2.tasks?.map(t => ({
        id: t.id,
        status: t.status,
        hasScript: t.hasScript,
        hasAudioPlaylist: t.hasAudioPlaylist,
        error: t.error
      }))
    }, null, 2))

    // 4. 检查是否流水线仍然活跃
    if (!statusData2.pipeline?.isActive) {
      console.log('\n❌ Pipeline became inactive! This indicates an issue.')
    } else {
      console.log('\n✅ Pipeline is still active, continuing monitoring...')
      
      // 继续监控更长时间
      for (let i = 1; i <= 6; i++) {
        await new Promise(resolve => setTimeout(resolve, 10000)) // 等待10秒
        
        const statusResponse = await fetch(`${BASE_URL}/pipeline/status`)
        const statusData = await statusResponse.json()
        
        console.log(`\n${i * 10}s update:`, {
          statusCounts: statusData.statusCounts,
          workers: statusData.workers?.map(w => `${w.type}:${w.isIdle ? 'idle' : 'busy'}`).join(', ')
        })
        
        // 如果有任务完成，尝试获取
        if (statusData.statusCounts?.READY_TO_PLAY > 0) {
          console.log('🎉 Task completed! Fetching result...')
          
          const nextResponse = await fetch(`${BASE_URL}/pipeline/next`)
          const nextData = await nextResponse.json()
          
          console.log('Completed task:', {
            status: nextData.status,
            hasData: !!nextData.data,
            topic: nextData.data?.newsTopic,
            language: nextData.data?.language,
            hasScript: !!nextData.data?.script,
            hasAudio: !!nextData.data?.audioPlaylist
          })
          break
        }
      }
    }

    // 5. 停止流水线
    console.log('\n5️⃣ Stopping pipeline')
    const stopResponse = await fetch(`${BASE_URL}/pipeline/status`, { method: 'DELETE' })
    const stopData = await stopResponse.json()
    console.log('Stop result:', stopData)

  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

// 运行调试
debugPipelineExecution()