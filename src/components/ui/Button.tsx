import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

const base =
  'inline-flex h-12 w-full touch-manipulation items-center justify-center gap-2.5 rounded-[4px] px-4 font-sans text-[15px] font-semibold transition-[transform,background-color,filter] duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:-translate-y-px hover:brightness-110',
  secondary: 'border border-line bg-surface text-ink hover:-translate-y-px hover:bg-raise',
  ghost: 'text-muted hover:bg-raise hover:text-ink',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => (
    <button ref={ref} className={cn(base, variants[variant], className)} {...props} />
  ),
)
Button.displayName = 'Button'
