/**
 * 测试多语言和TTS功能
 */

const BASE_URL = 'http://localhost:3000/api'

async function testMultiLanguageTTS() {
  console.log('🌍 Testing Multi-Language and TTS Functionality...\n')

  try {
    // 1. 测试获取支持的语言和音色
    console.log('1️⃣ Testing supported languages and voices')
    const voicesResponse = await fetch(`${BASE_URL}/voices`)
    const voicesData = await voicesResponse.json()
    
    if (voicesData.success) {
      console.log('✅ Voices API successful')
      console.log(`   Total voices: ${voicesData.total}`)
      console.log(`   Supported languages: ${voicesData.supportedLanguages?.map(l => `${l.code} (${l.nativeName})`).join(', ')}`)
      
      // 测试特定语言的音色
      const languages = ['zh-CN', 'en-US', 'ja-JP']
      for (const lang of languages) {
        const langVoicesResponse = await fetch(`${BASE_URL}/voices?language=${lang}`)
        const langVoicesData = await langVoicesResponse.json()
        console.log(`   ${lang}: ${langVoicesData.total} voices available`)
      }
    }

    // 2. 测试中文流水线
    console.log('\n2️⃣ Testing Chinese pipeline')
    await testLanguagePipeline('zh-CN', ['人工智能在教育领域的应用前景'])

    // 3. 测试英文流水线
    console.log('\n3️⃣ Testing English pipeline')
    await testLanguagePipeline('en-US', ['The Future of Artificial Intelligence in Healthcare'])

    console.log('\n🎉 Multi-language TTS test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

async function testLanguagePipeline(language, newsTopics) {
  try {
    console.log(`🚀 Starting ${language} pipeline with topics: ${newsTopics.join(', ')}`)
    
    // 启动流水线
    const startResponse = await fetch(`${BASE_URL}/pipeline/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newsTopics,
        debateRounds: 1,
        language
      })
    })
    
    const startData = await startResponse.json()
    if (!startData.success) {
      console.error(`❌ Failed to start ${language} pipeline:`, startData.error)
      return
    }
    
    console.log(`✅ ${language} pipeline started successfully`)

    // 监控进度
    let completed = false
    let attempts = 0
    const maxAttempts = 30 // 最多等待2.5分钟

    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // 等待5秒
      attempts++

      const statusResponse = await fetch(`${BASE_URL}/pipeline/status`)
      const statusData = await statusResponse.json()

      if (statusData.success) {
        const counts = statusData.statusCounts
        console.log(`   ${language} Progress (${attempts * 5}s):`, {
          GENERATING_TEXT: counts.GENERATING_TEXT,
          GENERATING_AUDIO: counts.GENERATING_AUDIO,
          READY_TO_PLAY: counts.READY_TO_PLAY
        })

        if (counts.READY_TO_PLAY > 0) {
          completed = true
          console.log(`✅ ${language} pipeline completed!`)

          // 获取完成的内容
          const nextResponse = await fetch(`${BASE_URL}/pipeline/next`)
          const nextData = await nextResponse.json()

          if (nextData.success && nextData.data) {
            console.log(`📺 ${language} content ready:`)
            console.log(`   Topic: ${nextData.data.newsTopic}`)
            console.log(`   Language: ${nextData.data.language || 'Not specified'}`)
            console.log(`   Script intro: ${nextData.data.script?.moderator_intro?.substring(0, 50)}...`)
            console.log(`   Conversation items: ${nextData.data.script?.conversation?.length}`)
            console.log(`   Audio items: ${nextData.data.audioPlaylist?.conversation?.length}`)
            
            // 检查音频URL
            if (nextData.data.audioPlaylist) {
              const hasValidAudio = nextData.data.audioPlaylist.conversation.some(item => 
                item.audioUrl && item.audioUrl.startsWith('http')
              )
              console.log(`   Valid audio URLs: ${hasValidAudio ? 'Yes' : 'No'}`)
            }
          }
        }
      }
    }

    if (!completed) {
      console.log(`⏰ ${language} pipeline did not complete within time limit`)
    }

    // 停止流水线
    await fetch(`${BASE_URL}/pipeline/status`, { method: 'DELETE' })
    console.log(`🛑 ${language} pipeline stopped`)

  } catch (error) {
    console.error(`❌ ${language} pipeline test failed:`, error)
  }
}

// 运行测试
testMultiLanguageTTS()