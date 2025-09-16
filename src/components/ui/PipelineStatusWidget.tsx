interface PipelineStatusWidgetProps {
  pipelineStatus: any
  isVisible: boolean
}

export function PipelineStatusWidget({ pipelineStatus, isVisible }: PipelineStatusWidgetProps) {
  if (!isVisible || !pipelineStatus) {
    return null
  }

  return (
    <div className="pipeline-status-widget" style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 1000,
      minWidth: '200px'
    }}>
      <div><strong>流水线状态</strong></div>
      <div>总任务: {pipelineStatus.totalTasks}</div>
      <div>已完成: {pipelineStatus.completedTasks}</div>
      <div>进度: {pipelineStatus.progressPercentage}%</div>
      <div>活跃状态: {pipelineStatus.isActive ? '运行中' : '已停止'}</div>
      {pipelineStatus.tasks && pipelineStatus.tasks.length > 0 && (
        <div style={{ marginTop: '5px', fontSize: '10px' }}>
          <strong>当前任务:</strong>
          {pipelineStatus.tasks.map((task: any) => (
            <div key={task.id} style={{ 
              padding: '2px', 
              background: task.status.includes('GENERATING') ? '#333' : 
                         task.status === 'READY_TO_PLAY' ? '#006600' : 
                         task.status === 'DONE' ? '#666' : 
                         task.status === 'FAILED' ? '#660000' : '#444',
              margin: '1px 0',
              borderRadius: '2px'
            }}>
              {task.status}: {task.newsTopic}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}