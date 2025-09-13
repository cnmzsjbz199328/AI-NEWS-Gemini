interface ProgressBarProps {
  progress: number
  showPercentage?: boolean
  className?: string
  barClassName?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function ProgressBar({ 
  progress, 
  showPercentage = false, 
  className = '', 
  barClassName = '',
  size = 'md'
}: ProgressBarProps) {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const clampedProgress = Math.min(Math.max(progress, 0), 100)

  return (
    <div className={`space-y-1 ${className}`}>
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div 
          className={`bg-blue-600 ${sizeClasses[size]} rounded-full transition-all duration-300 ${barClassName}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <p className="text-xs text-gray-500 text-center">
          {Math.round(clampedProgress)}%
        </p>
      )}
    </div>
  )
}