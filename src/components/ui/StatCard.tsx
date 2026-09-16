import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

type Tone = 'default' | 'positive' | 'negative'

/**
 * A row of these reads as one ruled band rather than three floating cards, so
 * the figures line up and the eye compares them directly.
 */
export function StatRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 border-y border-line sm:grid-cols-3">{children}</div>
  )
}

export function StatCard({
  label,
  value,
  note,
  tone = 'default',
  to,
}: {
  label: string
  value: string
  note?: string
  tone?: Tone
  to?: string
}) {
  const body = (
    <>
      <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">
        {label}
      </span>
      <span
        className={cn(
          'tnum mt-2 block text-[30px] font-medium leading-[1.04] sm:text-[34px]',
          tone === 'default' && 'text-ink',
          tone === 'positive' && 'text-pos',
          tone === 'negative' && 'text-neg',
        )}
      >
        {value}
      </span>
      {note && (
        <span className={cn('mt-1.5 block text-[12.5px]', tone === 'negative' ? 'text-neg' : 'text-muted')}>
          {note}
        </span>
      )}
    </>
  )

  const shared =
    'block border-t border-line px-0 py-5 transition-colors duration-150 first:border-t-0 sm:border-l sm:border-t-0 sm:px-6 sm:py-5 sm:first:border-l-0 sm:first:pl-0'

  if (to) {
    return (
      <Link to={to} className={cn(shared, 'hover:bg-raise')}>
        {body}
      </Link>
    )
  }
  return <div className={shared}>{body}</div>
}
