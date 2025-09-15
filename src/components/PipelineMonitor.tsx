/**
 * 流水线监控面板组件
 * 显示任务状态、工作者状态和系统指标
 */

'use client'

import React, { useEffect } from 'react'
import { 
  usePipelineStore, 
  usePipelineStatus, 
  usePipelineTasks, 
  usePipelineWorkers,
  usePipelineConnection,
  usePipelineActions 
} from '@/stores/pipeline-store'

// 任务状态卡片组件
const TaskCard: React.FC<{ task: any; isActive: boolean }> = ({ task, isActive }) => {
  const { retryTask } = usePipelineActions()
  const setSelectedTask = usePipelineStore(state => state.setSelectedTask)
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_TEXT': return 'bg-yellow-100 text-yellow-800'
      case 'GENERATING_TEXT': return 'bg-blue-100 text-blue-800'
      case 'PENDING_AUDIO': return 'bg-orange-100 text-orange-800'
      case 'GENERATING_AUDIO': return 'bg-purple-100 text-purple-800'
      case 'READY_TO_PLAY': return 'bg-green-100 text-green-800'
      case 'PLAYING': return 'bg-indigo-100 text-indigo-800'
      case 'DONE': return 'bg-gray-100 text-gray-800'
      default: return 'bg-red-100 text-red-800'
    }
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING_TEXT': return '📝'
      case 'GENERATING_TEXT': return '🤖'
      case 'PENDING_AUDIO': return '🎵'
      case 'GENERATING_AUDIO': return '🔊'
      case 'READY_TO_PLAY': return '▶️'
      case 'PLAYING': return '🎬'
      case 'DONE': return '✅'
      default: return '❌'
    }
  }
  
  return (
    <div 
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => setSelectedTask(task.id)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg">{getStatusIcon(task.status)}</span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
          {task.status.replace('_', ' ')}
        </span>
      </div>
      
      <h3 className="font-medium text-sm mb-2 line-clamp-2">
        {task.newsTopic}
      </h3>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {task.assignedWorker && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              {task.assignedWorker}
            </span>
          )}
        </span>
        <span>
          {task.hasScript && '📄'} {task.hasAudio && '🎵'}
        </span>
      </div>
      
      {task.error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {task.error}
          <button
            onClick={(e) => {
              e.stopPropagation()
              retryTask(task.id)
            }}
            className="ml-2 text-red-600 hover:text-red-800 underline"
          >
            重试
          </button>
        </div>
      )}
    </div>
  )
}

// 工作者状态组件
const WorkerStatus: React.FC<{ workers: Record<string, any> }> = ({ workers }) => {
  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="font-medium mb-3">AI工作者状态</h3>
      <div className="space-y-2">
        {Object.values(workers).map((worker: any) => (
          <div key={worker.type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${
                worker.isIdle ? 'bg-green-400' : 'bg-yellow-400'
              }`}></span>
              <span className="font-medium">{worker.type}</span>
            </div>
            <div className="text-sm text-gray-600">
              {worker.isIdle ? '空闲' : `处理中: ${worker.currentTaskId?.substring(0, 8)}...`}
              {worker.errorCount > 0 && (
                <span className="ml-2 text-red-600">
                  错误: {worker.errorCount}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 连接状态组件
const ConnectionStatus: React.FC = () => {
  const { wsConnected, wsReconnecting, lastUpdateTime } = usePipelineConnection()
  
  const getTimeSinceUpdate = () => {
    if (!lastUpdateTime) return '从未'
    const seconds = Math.floor((Date.now() - lastUpdateTime) / 1000)
    if (seconds < 60) return `${seconds}秒前`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}分钟前`
  }
  
  return (
    <div className="flex items-center space-x-4 text-sm">
      <div className="flex items-center space-x-2">
        <span className={`w-2 h-2 rounded-full ${
          wsConnected ? 'bg-green-400' : wsReconnecting ? 'bg-yellow-400' : 'bg-red-400'
        }`}></span>
        <span>
          {wsConnected ? '已连接' : wsReconnecting ? '重连中...' : '已断开'}
        </span>
      </div>
      <span className="text-gray-500">
        最后更新: {getTimeSinceUpdate()}
      </span>
    </div>
  )
}

// 主监控面板组件
export const PipelineMonitor: React.FC = () => {
  const { isActive, totalTasks, completedTasks, currentPlayIndex } = usePipelineStatus()
  const tasks = usePipelineTasks()
  const workers = usePipelineWorkers()
  const { 
    startPipeline, 
    stopPipeline, 
    nextTask, 
    connectWebSocket, 
    disconnectWebSocket
  } = usePipelineActions()
  const { showMonitorPanel, selectedTaskId, toggleMonitorPanel } = usePipelineStore()
  
  // 自动连接WebSocket
  useEffect(() => {
    if (isActive && !showMonitorPanel) {
      connectWebSocket()
    }
    
    return () => {
      if (!isActive) {
        disconnectWebSocket()
      }
    }
  }, [isActive, showMonitorPanel, connectWebSocket, disconnectWebSocket])
  
  const handleStartPipeline = async () => {
    const testTopics = [
      "人工智能在医疗领域的应用前景",
      "气候变化对全球经济的影响",
      "远程工作模式的利弊分析",
      "电动汽车普及的挑战与机遇",
      "社交媒体对青少年心理健康的影响"
    ]
    
    const success = await startPipeline(testTopics, 3)
    if (success) {
      console.log('Pipeline started successfully')
    }
  }
  
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
  
  return (
    <div className="fixed inset-0 bg-gray-100 z-50 overflow-auto">
      {/* 头部控制栏 */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">流水线监控面板</h1>
            <ConnectionStatus />
          </div>
          
          <div className="flex items-center space-x-4">
            {!isActive ? (
              <button
                onClick={handleStartPipeline}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                启动测试流水线
              </button>
            ) : (
              <>
                <button
                  onClick={nextTask}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  下一个任务
                </button>
                <button
                  onClick={stopPipeline}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  停止流水线
                </button>
              </>
            )}
            
            <button
              onClick={toggleMonitorPanel}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              关闭监控
            </button>
          </div>
        </div>
        
        {/* 进度条 */}
        {isActive && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>总进度: {completedTasks}/{totalTasks}</span>
              <span>当前播放: {currentPlayIndex + 1}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      
      {/* 主内容区域 */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 任务网格 */}
          <div className="lg:col-span-3">
            <h2 className="text-lg font-medium mb-4">任务状态 ({tasks.length})</h2>
            {tasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isActive={index === currentPlayIndex}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">📋</div>
                <p>暂无任务</p>
                <p className="text-sm">点击"启动测试流水线"开始</p>
              </div>
            )}
          </div>
          
          {/* 侧边栏 */}
          <div className="space-y-6">
            <WorkerStatus workers={workers} />
            
            {/* 系统指标 */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-medium mb-3">系统指标</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>活跃任务:</span>
                  <span>{tasks.filter(t => t.status.includes('GENERATING')).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>等待任务:</span>
                  <span>{tasks.filter(t => t.status.includes('PENDING')).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>失败任务:</span>
                  <span className="text-red-600">
                    {tasks.filter(t => t.error).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>完成率:</span>
                  <span>{progressPercentage.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            
            {/* 选中任务详情 */}
            {selectedTaskId && (
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-medium mb-3">任务详情</h3>
                {(() => {
                  const selectedTask = tasks.find(t => t.id === selectedTaskId)
                  if (!selectedTask) return <p className="text-gray-500">任务未找到</p>
                  
                  return (
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">ID:</span>
                        <span className="ml-2 font-mono text-xs">{selectedTask.id}</span>
                      </div>
                      <div>
                        <span className="font-medium">主题:</span>
                        <p className="mt-1 text-gray-700">{selectedTask.newsTopic}</p>
                      </div>
                      <div>
                        <span className="font-medium">状态:</span>
                        <span className="ml-2">{selectedTask.status}</span>
                      </div>
                      {selectedTask.assignedWorker && (
                        <div>
                          <span className="font-medium">工作者:</span>
                          <span className="ml-2">{selectedTask.assignedWorker}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium">资源:</span>
                        <div className="ml-2">
                          {selectedTask.hasScript ? '✅ 脚本' : '❌ 脚本'}
                          <br />
                          {selectedTask.hasAudio ? '✅ 音频' : '❌ 音频'}
                        </div>
                      </div>
                      {selectedTask.error && (
                        <div>
                          <span className="font-medium text-red-600">错误:</span>
                          <p className="mt-1 text-red-700 text-xs">{selectedTask.error}</p>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PipelineMonitor