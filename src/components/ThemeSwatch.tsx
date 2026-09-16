import { useId } from 'react'
import type { Palette } from '@/lib/themes'
import { cn } from '@/lib/utils'

/**
 * A disc split on a diagonal, the two halves eased slightly apart, showing the
 * palette's two colors exactly as specified. The same motif is used as the
 * brand device on the sign-in panel.
 */
export function ThemeSwatch({
  palette,
  selected,
  onSelect,
}: {
  palette: Palette
  selected: boolean
  onSelect: () => void
}) {
  const id = useId()

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="group flex touch-manipulation flex-col items-center gap-2 rounded-[4px] p-1"
    >
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        className={cn(
          'h-14 w-14 rounded-full transition-transform duration-200 ease-out group-hover:-rotate-3 group-hover:scale-105',
          selected && 'ring-2 ring-ink ring-offset-2 ring-offset-canvas',
        )}
      >
        <defs>
          <clipPath id={`${id}-a`}>
            <path d="M-10,-10 L110,-10 L110,110 Z" />
          </clipPath>
          <clipPath id={`${id}-b`}>
            <path d="M-10,-10 L-10,110 L110,110 Z" />
          </clipPath>
        </defs>
        <circle cx="53" cy="47" r="46" fill={palette.accent} clipPath={`url(#${id}-a)`} />
        <circle cx="47" cy="53" r="46" fill={palette.base} clipPath={`url(#${id}-b)`} />
      </svg>
      <span
        className={cn(
          'text-[12px] transition-colors',
          selected ? 'font-semibold text-ink' : 'font-medium text-muted',
        )}
      >
        {palette.name}
      </span>
    </button>
  )
}
