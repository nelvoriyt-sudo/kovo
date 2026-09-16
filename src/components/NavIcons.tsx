type IconProps = { className?: string }

const base = { fill: 'none', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export function DashboardIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" className={className} aria-hidden="true" {...base} stroke="currentColor">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="12" y="3" width="7" height="4.5" rx="1.5" />
      <rect x="12" y="9.5" width="7" height="9.5" rx="1.5" />
      <rect x="3" y="12" width="7" height="7" rx="1.5" />
    </svg>
  )
}

export function PieIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" className={className} aria-hidden="true" {...base} stroke="currentColor">
      <path d="M11 3v8l6.5 4.2A8 8 0 1 1 11 3Z" />
      <path d="M14 4.2A8 8 0 0 1 18.7 11H11L14 4.2Z" />
    </svg>
  )
}

export function TrendIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" className={className} aria-hidden="true" {...base} stroke="currentColor">
      <path d="M3 17l5-5 3.5 3L19 6" />
      <path d="M14 6h5v5" />
    </svg>
  )
}

export function BudgetIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" className={className} aria-hidden="true" {...base} stroke="currentColor">
      <rect x="3" y="5" width="16" height="12" rx="2" />
      <path d="M3 10h16" />
      <path d="M6.5 13.5h3" />
    </svg>
  )
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" className={className} aria-hidden="true" {...base} stroke="currentColor">
      <rect x="3" y="4.5" width="16" height="14" rx="2" />
      <path d="M3 9h16" />
      <path d="M7 3v3M15 3v3" />
      <circle cx="7.5" cy="13" r="1" fill="currentColor" stroke="none" />
      <circle cx="11" cy="13" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ListIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" className={className} aria-hidden="true" {...base} stroke="currentColor">
      <path d="M7 6h12M7 11h12M7 16h12" />
      <circle cx="3.5" cy="6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="11" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="16" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function MoreIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" className={className} aria-hidden="true" {...base} stroke="currentColor">
      <circle cx="5" cy="11" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="11" cy="11" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="17" cy="11" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function TagIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" className={className} aria-hidden="true" {...base} stroke="currentColor">
      <path d="M11 3h6a2 2 0 0 1 2 2v6l-9 9-8-8 9-9Z" />
      <circle cx="14.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" className={className} aria-hidden="true" {...base} stroke="currentColor">
      <circle cx="11" cy="11" r="3" />
      <path d="M11 2.5v2.2M11 17.3v2.2M19.5 11h-2.2M4.7 11H2.5M16.8 5.2l-1.6 1.6M6.8 15.2l-1.6 1.6M16.8 16.8l-1.6-1.6M6.8 6.8 5.2 5.2" />
    </svg>
  )
}
