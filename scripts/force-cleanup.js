"use strict";
/**
 * 强力清理脚本 - 完全清空所有任务数据
 * 用于彻底清除系统中的所有预定义测试内容
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.forceCleanupAllTasks = forceCleanupAllTasks;
const redis_1 = require("@upstash/redis");
const redis = redis_1.Redis.fromEnv();
async function forceCleanupAllTasks() {
    console.log('🧹 开始强力清理所有任务数据...');
    console.log('⚠️  警告：这将删除所有现有任务，包括真实新闻任务！');
    try {
        // 1. 获取所有任务相关的键
        const patterns = [
            'ainews:v2:task:*',
            'ainews:v2:script:*',
            'ainews:v2:audio:*',
            'ainews:v2:latest:*',
            'task:*',
            'script:*',
            'audio:*',
            'latest:*'
        ];
        let totalDeleted = 0;
        for (const pattern of patterns) {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                console.log(`🗑️ 删除模式 "${pattern}" 的 ${keys.length} 个键`);
                // 批量删除，每次最多100个键
                const batchSize = 100;
                for (let i = 0; i < keys.length; i += batchSize) {
                    const batch = keys.slice(i, i + batchSize);
                    await Promise.all(batch.map(key => redis.del(key)));
                    totalDeleted += batch.length;
                    console.log(`  已删除 ${Math.min(i + batchSize, keys.length)}/${keys.length} 个键`);
                }
            }
        }
        // 2. 清理其他可能的测试数据
        const allKeys = await redis.keys('*');
        console.log(`📋 检查所有 ${allKeys.length} 个键...`);
        const testKeywords = [
            'test',
            'demo',
            'sample',
            'alice',
            'bob',
            'brazilian',
            'wedding',
            'status'
        ];
        const suspiciousKeys = allKeys.filter(key => {
            const keyStr = key.toString().toLowerCase();
            return testKeywords.some(keyword => keyStr.includes(keyword));
        });
        if (suspiciousKeys.length > 0) {
            console.log(`🔍 发现 ${suspiciousKeys.length} 个可疑的测试相关键:`);
            suspiciousKeys.forEach(key => console.log(`  - ${key}`));
            await Promise.all(suspiciousKeys.map(key => redis.del(key)));
            totalDeleted += suspiciousKeys.length;
        }
        console.log(`\n📊 清理结果:`);
        console.log(`🗑️ 总共删除键数: ${totalDeleted}`);
        console.log(`🎉 强力清理完成！`);
        // 3. 验证清理结果
        const remainingTaskKeys = await redis.keys('ainews:v2:task:*');
        const remainingAllKeys = await redis.keys('*');
        console.log(`\n✅ 验证结果:`);
        console.log(`📋 剩余任务键: ${remainingTaskKeys.length}`);
        console.log(`📋 剩余总键数: ${remainingAllKeys.length}`);
        if (remainingTaskKeys.length === 0) {
            console.log('🎯 任务数据已完全清理！');
        }
        else {
            console.log('⚠️ 仍有任务数据存在，请检查:');
            remainingTaskKeys.slice(0, 5).forEach(key => console.log(`  - ${key}`));
        }
    }
    catch (error) {
        console.error('❌ 强力清理过程中出现错误:', error);
        process.exit(1);
    }
}
// 运行强力清理脚本
if (require.main === module) {
    forceCleanupAllTasks()
        .then(() => {
        console.log('✨ 强力清理脚本执行完成');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 强力清理脚本执行失败:', error);
        process.exit(1);
    });
}
