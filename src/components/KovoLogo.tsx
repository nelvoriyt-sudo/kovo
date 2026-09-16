import kovoLogo from '@/assets/brand/kovo-logo.png'

/** Icon + wordmark lockup. Designed for light backgrounds. */
export function KovoLogo({ className }: { className?: string }) {
  return <img src={kovoLogo} alt="kovo" className={className} />
}
