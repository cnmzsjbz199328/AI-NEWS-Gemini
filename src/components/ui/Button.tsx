import React from 'react'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'info' | 'danger' | 'warning'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  children: React.ReactNode
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  children,
  className = '',
  type = 'button'
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantClasses = {
    primary:   'bg-white/[0.08] border border-white/20 text-white hover:bg-white/[0.14] focus:ring-white/30 backdrop-blur-sm',
    secondary: 'bg-white/[0.05] border border-white/10 text-white/60 hover:bg-white/[0.10] focus:ring-white/20 backdrop-blur-sm',
    outline:   'border border-white/20 text-white/80 hover:bg-white/[0.08] focus:ring-white/20 backdrop-blur-sm',
    ghost:     'text-white/60 hover:bg-white/[0.08] focus:ring-white/20',
    success:   'bg-white/[0.06] border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400/50 focus:ring-emerald-400/30 backdrop-blur-sm',
    info:      'bg-white/[0.06] border border-sky-400/30 text-sky-300 hover:bg-sky-500/20 hover:border-sky-400/50 focus:ring-sky-400/30 backdrop-blur-sm',
    danger:    'bg-white/[0.06] border border-rose-400/30 text-rose-300 hover:bg-rose-500/20 hover:border-rose-400/50 focus:ring-rose-400/30 backdrop-blur-sm',
    warning:   'bg-white/[0.06] border border-amber-400/30 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400/50 focus:ring-amber-400/30 backdrop-blur-sm',
  }

  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
    xl: 'px-6 py-3 text-base'
  }

  return (
    <button
      type={type}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
          加载中...
        </>
      ) : (
        children
      )}
    </button>
  )
}

export default Button
