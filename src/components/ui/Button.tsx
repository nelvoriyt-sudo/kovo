import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

const base =
  'touch-manipulation inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-[10px] px-4 text-[15px] font-semibold font-sans transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-tan-dark'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-on-ink hover:bg-ink-light',
  secondary:
    'border border-border bg-surface text-ink hover:bg-paper-dim/60',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => (
    <button ref={ref} className={cn(base, variants[variant], className)} {...props} />
  ),
)
Button.displayName = 'Button'
