interface SliderProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  disabled?: boolean
  showValue?: boolean
  unit?: string
  className?: string
}

export default function Slider({ 
  value, 
  onChange, 
  min, 
  max, 
  step = 1, 
  disabled = false, 
  showValue = true, 
  unit = '', 
  className = '' 
}: SliderProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        className={`
          w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      />
      {showValue && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>{min}{unit}</span>
          <span className="font-medium">{value}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      )}
    </div>
  )
}