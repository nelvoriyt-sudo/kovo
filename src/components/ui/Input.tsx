import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'touch-manipulation h-[46px] w-full rounded-[10px] border border-border bg-surface px-3.5 text-[15px] text-ink placeholder:text-muted-light',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark focus-visible:border-tan-dark',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
