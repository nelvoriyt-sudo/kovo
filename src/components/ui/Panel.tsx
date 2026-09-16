import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Panel({
  title,
  action,
  actionTo,
  children,
  className,
}: {
  title?: string
  action?: string
  actionTo?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-[4px] border border-line bg-surface p-5 sm:p-6', className)}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-[15.5px] font-semibold tracking-[-0.01em] text-ink">
            {title}
          </h2>
          {action && actionTo && (
            <Link
              to={actionTo}
              className="shrink-0 text-[12.5px] font-semibold text-accent hover:underline"
            >
              {action} →
            </Link>
          )}
        </div>
      )}
      {children}
    </section>
  )
}
