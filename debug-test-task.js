/**
 * 调试工具 - 测试新任务创建和播放
 */

// 在浏览器控制台中运行以下代码来创建测试任务

// 1. 重置 AudioManager 状态
console.log('[DEBUG] Testing new task creation and playback...')

// 2. 创建测试任务数据
const testTask = {
  id: `test-task-${Date.now()}`,
  status: 'READY_TO_PLAY',
  newsTopic: 'Test news topic for debugging',
  script: {
    moderator_intro: "Welcome to AI News TV. Today we have an interesting topic to discuss.",
    conversation: [
      {
        speaker: 'moderator',
        text: 'Let me introduce today\'s topic.'
      },
      {
        speaker: 'tom', 
        text: 'This is really exciting news!'
      },
      {
        speaker: 'mark',
        text: 'I completely agree with Tom\'s perspective.'
      }
    ],
    moderator_outro: "Thank you for watching AI News TV. We'll see you next time."
  },
  audioPlaylist: {
    moderator_intro: 'fake-audio-url-intro',
    conversation: [
      {
        speaker: 'moderator',
        audioUrl: 'fake-audio-url-moderator'
      },
      {
        speaker: 'tom',
        audioUrl: 'fake-audio-url-tom'
      },
      {
        speaker: 'mark', 
        audioUrl: 'fake-audio-url-mark'
      }
    ],
    moderator_outro: 'fake-audio-url-outro'
  },
  createdAt: Date.now()
}

// 3. 手动触发 playTask (需要在实际应用中调用)
console.log('[DEBUG] Test task created:', testTask)
console.log('[DEBUG] To test: Set this task in pipeline status and trigger usePlaybackController')