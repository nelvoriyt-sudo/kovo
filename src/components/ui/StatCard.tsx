import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  tone = 'default',
  children,
}: {
  label: string
  value: string
  tone?: 'default' | 'positive' | 'negative'
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-border bg-surface p-6">
      <span className="text-[13px] font-semibold uppercase tracking-wide text-muted-light">
        {label}
      </span>
      <span
        className={cn(
          'font-display text-[28px] font-semibold leading-none',
          tone === 'default' && 'text-ink',
          tone === 'positive' && 'text-[#4d7358]',
          tone === 'negative' && 'text-[#a34c3f]',
        )}
      >
        {value}
      </span>
      {children}
    </div>
  )
}
