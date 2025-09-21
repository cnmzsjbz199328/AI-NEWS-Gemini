/**
 * 清理预定义内容和测试数据的脚本
 * 用于移除系统中的硬编码测试内容，确保只使用真实新闻
 */

import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

async function cleanupTestData() {
  console.log('🧹 开始清理预定义测试数据...')

  try {
    // 1. 获取所有任务键
    const taskKeys = await redis.keys('task:*')
    console.log(`📋 找到 ${taskKeys.length} 个任务键`)

    let cleanedCount = 0
    let testTasksRemoved = 0

    for (const key of taskKeys) {
      try {
        const taskData = await redis.hgetall(key)
        
        if (taskData && typeof taskData.newsTopic === 'string') {
          const topic = taskData.newsTopic.toLowerCase()
          
          // 检测测试内容关键词
          const testKeywords = [
            'brazilian race walker',
            'wedding ring',
            'status api test',
            'test reuse feature',
            'test: the future',
            'alice',
            'bob',
            'fake-audio',
            'demo',
            'sample',
            'testing',
            'hello, this is',
            'greetings, this is'
          ]
          
          const isTestContent = testKeywords.some(keyword => topic.includes(keyword))
          
          if (isTestContent) {
            console.log(`❌ 删除测试任务: ${key} - ${taskData.newsTopic}`)
            
            // 删除相关的所有数据
            const taskId = key.replace('task:', '')
            await Promise.all([
              redis.del(key),
              redis.del(`script:${taskId}`),
              redis.del(`audio:${taskId}`),
              redis.del(`latest:${taskId}`)
            ])
            
            testTasksRemoved++
          } else {
            console.log(`✅ 保留真实新闻任务: ${taskData.newsTopic?.substring(0, 50)}...`)
            cleanedCount++
          }
        }
      } catch (error) {
        console.error(`处理任务 ${key} 时出错:`, error)
      }
    }

    // 2. 清理其他测试相关的键
    const allKeys = await redis.keys('*')
    const testKeys = allKeys.filter(key => {
      const keyStr = key.toString().toLowerCase()
      return keyStr.includes('test') || 
             keyStr.includes('demo') || 
             keyStr.includes('sample') ||
             keyStr.includes('alice') ||
             keyStr.includes('bob')
    })

    if (testKeys.length > 0) {
      console.log(`🗑️ 删除 ${testKeys.length} 个测试相关键:`)
      testKeys.forEach(key => console.log(`  - ${key}`))
      await Promise.all(testKeys.map(key => redis.del(key)))
    }

    console.log('\n📊 清理结果:')
    console.log(`✅ 保留的真实新闻任务: ${cleanedCount}`)
    console.log(`❌ 删除的测试任务: ${testTasksRemoved}`)
    console.log(`🗑️ 删除的其他测试键: ${testKeys.length}`)
    console.log('🎉 清理完成！')

  } catch (error) {
    console.error('❌ 清理过程中出现错误:', error)
    process.exit(1)
  }
}

// 运行清理脚本
if (require.main === module) {
  cleanupTestData()
    .then(() => {
      console.log('✨ 清理脚本执行完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 清理脚本执行失败:', error)
      process.exit(1)
    })
}

export { cleanupTestData }