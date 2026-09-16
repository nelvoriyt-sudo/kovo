import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'touch-manipulation h-[46px] w-full rounded-[4px] border border-line bg-canvas px-3.5 text-[15px] text-ink placeholder:text-muted',
        'transition-colors focus-visible:border-transparent focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-accent',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
