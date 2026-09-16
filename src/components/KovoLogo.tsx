import kovoLogo from '@/assets/brand/kovo-logo.png'
import { cn } from '@/lib/utils'

/**
 * Icon + wordmark lockup. The source art is dark-on-transparent, so it's inverted
 * to a light silhouette when rendered inside the dark theme (see .theme-dark scope).
 */
export function KovoLogo({ className }: { className?: string }) {
  return (
    <img
      src={kovoLogo}
      alt="kovo"
      className={cn('[.theme-dark_&]:brightness-0 [.theme-dark_&]:invert', className)}
    />
  )
}
