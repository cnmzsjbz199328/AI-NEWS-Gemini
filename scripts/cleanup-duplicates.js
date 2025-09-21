/**
 * 清理重复任务脚本
 * 删除重复创建的PENDING_TEXT任务
 */

const { Redis } = require('@upstash/redis')

const redis = Redis.fromEnv()

async function cleanupDuplicateTasks() {
  console.log('🧹 开始清理重复的PENDING_TEXT任务...')

  try {
    // 获取所有任务
    const taskKeys = await redis.keys('ainews:v2:task:*')
    console.log(`📋 找到 ${taskKeys.length} 个任务键`)

    const tasks = []
    for (const key of taskKeys) {
      const task = await redis.get(key)
      if (task) {
        tasks.push({ key, ...task })
      }
    }

    console.log(`📋 成功读取 ${tasks.length} 个任务`)

    // 按新闻主题分组
    const topicGroups = {}
    tasks.forEach(task => {
      const topic = task.newsTopic
      if (!topicGroups[topic]) {
        topicGroups[topic] = []
      }
      topicGroups[topic].push(task)
    })

    console.log(`📊 找到 ${Object.keys(topicGroups).length} 个不同的新闻主题`)

    let deletedCount = 0

    // 处理每个主题组
    for (const [topic, groupTasks] of Object.entries(topicGroups)) {
      console.log(`\n🎯 处理主题组 (${groupTasks.length} 个任务):`, topic.substring(0, 50) + '...')
      
      // 按创建时间排序
      groupTasks.sort((a, b) => a.createdAt - b.createdAt)
      
      // 分别处理DONE和PENDING_TEXT任务
      const doneTasks = groupTasks.filter(t => t.status === 'DONE')
      const pendingTasks = groupTasks.filter(t => t.status === 'PENDING_TEXT')
      
      console.log(`  📋 DONE任务: ${doneTasks.length}, PENDING_TEXT任务: ${pendingTasks.length}`)
      
      // 如果有DONE任务，删除所有PENDING_TEXT任务
      if (doneTasks.length > 0 && pendingTasks.length > 0) {
        console.log(`  🗑️ 删除 ${pendingTasks.length} 个多余的PENDING_TEXT任务`)
        for (const task of pendingTasks) {
          await redis.del(task.key)
          console.log(`    ✅ 删除任务: ${task.id}`)
          deletedCount++
        }
      }
      
      // 如果有多个DONE任务，保留最新的，删除旧的
      if (doneTasks.length > 1) {
        const tasksToDelete = doneTasks.slice(0, -1) // 保留最后一个（最新的）
        console.log(`  🗑️ 删除 ${tasksToDelete.length} 个重复的DONE任务`)
        for (const task of tasksToDelete) {
          // 同时删除相关的脚本和音频数据
          await redis.del(task.key)
          await redis.del(`ainews:v2:script:${task.id}`)
          await redis.del(`ainews:v2:audio:${task.id}`)
          console.log(`    ✅ 删除重复DONE任务: ${task.id}`)
          deletedCount++
        }
      }
    }

    console.log(`\n✅ 清理完成！`)
    console.log(`🗑️ 总计删除了 ${deletedCount} 个重复任务`)
    
    // 验证结果
    const remainingKeys = await redis.keys('ainews:v2:task:*')
    console.log(`📋 剩余任务数: ${remainingKeys.length}`)

  } catch (error) {
    console.error('❌ 清理过程中发生错误:', error)
  }
}

cleanupDuplicateTasks()
  .then(() => {
    console.log('✨ 重复任务清理完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 清理失败:', error)
    process.exit(1)
  })