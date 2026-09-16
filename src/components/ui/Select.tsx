import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'h-[46px] w-full touch-manipulation rounded-[4px] border border-line bg-canvas px-3.5 text-[15px] text-ink',
        'transition-colors focus-visible:border-transparent focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-accent',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
)
Select.displayName = 'Select'
