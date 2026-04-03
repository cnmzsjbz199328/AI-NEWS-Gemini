interface PipelineStatusWidgetProps {
  pipelineStatus: any // eslint-disable-line @typescript-eslint/no-explicit-any
  isVisible: boolean
}

const getTaskBgClass = (status: string): string => {
  if (status.includes('GENERATING')) return 'bg-[#333]'
  if (status === 'READY_TO_PLAY')    return 'bg-[#006600]'
  if (status === 'DONE')             return 'bg-[#666]'
  if (status === 'FAILED')           return 'bg-[#660000]'
  return 'bg-[#444]'
}

export function PipelineStatusWidget({ pipelineStatus, isVisible }: PipelineStatusWidgetProps) {
  if (!isVisible || !pipelineStatus) {
    return null
  }

  return (
    <div className="fixed top-3 right-3 z-[1000] min-w-[200px] bg-black/80 backdrop-blur-md text-white text-xs p-3 rounded-xl border border-white/10 shadow-2xl">
      <div><strong>流水线状态</strong></div>
      <div>总任务: {pipelineStatus.totalTasks}</div>
      <div>已完成: {pipelineStatus.completedTasks}</div>
      <div>进度: {pipelineStatus.progressPercentage}%</div>
      <div>活跃状态: {pipelineStatus.isActive ? '运行中' : '已停止'}</div>
      {pipelineStatus.tasks && pipelineStatus.tasks.length > 0 && (
        <div className="mt-1 text-[10px]">
          <strong>当前任务:</strong>
          {pipelineStatus.tasks.map((task: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
            <div
              key={task.id}
              className={`px-0.5 py-px rounded my-px ${getTaskBgClass(task.status)}`}
            >
              {task.status}: {task.newsTopic}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
