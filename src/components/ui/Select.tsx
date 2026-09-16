import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'h-[46px] w-full rounded-[10px] border border-border bg-surface px-3.5 text-[15px] text-ink',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark focus-visible:border-tan-dark',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
)
Select.displayName = 'Select'
