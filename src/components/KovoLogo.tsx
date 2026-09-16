import kovoLogo from '@/assets/brand/kovo-logo.png'
import { cn } from '@/lib/utils'

/**
 * Icon + wordmark lockup. The source art is a dark silhouette on transparency,
 * so it is pushed to whichever solid tone it sits on rather than recolored per
 * theme: `ink` for the page canvas, `accent` for the navigation rail.
 */
export function KovoLogo({
  className,
  tone = 'ink',
}: {
  className?: string
  tone?: 'ink' | 'accent'
}) {
  return (
    <img
      src={kovoLogo}
      alt="kovo"
      style={{ filter: `var(--logo-${tone}-filter)` }}
      className={cn('select-none', className)}
    />
  )
}
