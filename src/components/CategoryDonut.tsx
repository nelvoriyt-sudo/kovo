import { useId, useState } from 'react'
import { useFormatCurrency } from '@/lib/currencyContext'
import { rampStep } from '@/lib/themes'
import { cn } from '@/lib/utils'

export type Slice = { id: string; name: string; amount: number }

const SIZE = 184
const RING = 27
const GAP = 0.02 // radians of surface showing between adjacent arcs

function arcPath(cx: number, cy: number, rOuter: number, width: number, a0: number, a1: number) {
  const rInner = rOuter - width
  const point = (angle: number, r: number) => [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
  const large = a1 - a0 > Math.PI ? 1 : 0
  const [x1, y1] = point(a0, rOuter)
  const [x2, y2] = point(a1, rOuter)
  const [x3, y3] = point(a1, rInner)
  const [x4, y4] = point(a0, rInner)
  return `M${x1},${y1} A${rOuter},${rOuter} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${rInner},${rInner} 0 ${large} 0 ${x4},${y4} Z`
}

/**
 * Part-to-whole spending. Hovering or focusing a slice names it in the middle of
 * the ring and highlights its legend row, so a slice's identity never rests on
 * its color alone -- the ramp is a single hue by design, since the palette is
 * only ever two colors.
 */
export function CategoryDonut({
  slices,
  onSelect,
  maxSlices = 6,
}: {
  slices: Slice[]
  onSelect?: (id: string) => void
  maxSlices?: number
}) {
  const formatCurrency = useFormatCurrency()
  const [active, setActive] = useState<number | null>(null)
  const titleId = useId()

  const sorted = [...slices].sort((a, b) => b.amount - a.amount)
  const shown =
    sorted.length > maxSlices
      ? [
          ...sorted.slice(0, maxSlices - 1),
          {
            id: '__rest__',
            name: `${sorted.length - maxSlices + 1} smaller categories`,
            amount: sorted.slice(maxSlices - 1).reduce((sum, s) => sum + s.amount, 0),
          },
        ]
      : sorted

  const total = shown.reduce((sum, s) => sum + s.amount, 0)
  if (total <= 0) {
    return <p className="text-[14px] text-muted">No spending recorded for this period yet.</p>
  }

  const cx = SIZE / 2
  const rOuter = SIZE / 2 - 4
  let angle = -Math.PI / 2

  const arcs = shown.map((slice, i) => {
    const fraction = slice.amount / total
    const sweep = fraction * Math.PI * 2
    const full = fraction > 0.9995
    const a0 = angle + (full ? 0 : GAP / 2)
    const a1 = angle + sweep - (full ? 0 : GAP / 2)
    angle += sweep
    return { slice, i, a0, a1, full, fraction }
  })

  const focused = active === null ? null : shown[active]

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="block overflow-visible"
          role="img"
          aria-labelledby={titleId}
          onMouseLeave={() => setActive(null)}
        >
          <title id={titleId}>Spending by category</title>
          {arcs.map(({ slice, i, a0, a1, full, fraction }) => {
            const isActive = active === i
            const dimmed = active !== null && !isActive
            const common = {
              fill: rampStep(i, shown.length),
              tabIndex: 0,
              role: 'button',
              'aria-label': `${slice.name}: ${formatCurrency(slice.amount)}, ${Math.round(fraction * 100)} percent of spending`,
              onMouseEnter: () => setActive(i),
              onFocus: () => setActive(i),
              onBlur: () => setActive(null),
              onClick: () => slice.id !== '__rest__' && onSelect?.(slice.id),
              onKeyDown: (e: React.KeyboardEvent) => {
                if ((e.key === 'Enter' || e.key === ' ') && slice.id !== '__rest__') {
                  e.preventDefault()
                  onSelect?.(slice.id)
                }
              },
              className: cn(
                'origin-center transition-[transform,opacity] duration-200 ease-out',
                onSelect && slice.id !== '__rest__' && 'cursor-pointer',
                isActive && 'scale-[1.045]',
                dimmed && 'opacity-35',
              ),
            }
            return full ? (
              <circle
                key={slice.id}
                {...common}
                cx={cx}
                cy={cx}
                r={rOuter - RING / 2}
                fill="none"
                stroke={rampStep(i, shown.length)}
                strokeWidth={RING}
              />
            ) : (
              <path key={slice.id} {...common} d={arcPath(cx, cx, rOuter, RING, a0, a1)} />
            )
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <span className="max-w-full truncate text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
            {focused ? focused.name : 'Total'}
          </span>
          <span className="tnum mt-1 text-[20px] font-medium text-ink">
            {formatCurrency(focused ? focused.amount : total)}
          </span>
          <span className="mt-0.5 text-[11.5px] text-muted">
            {focused
              ? `${Math.round((focused.amount / total) * 100)}% of spending`
              : `${shown.length} categories`}
          </span>
        </div>
      </div>

      <ul className="flex w-full min-w-0 flex-col gap-px">
        {shown.map((slice, i) => (
          <li key={slice.id}>
            <button
              type="button"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              onClick={() => slice.id !== '__rest__' && onSelect?.(slice.id)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-[3px] px-2 py-1.5 text-left text-[13px] transition-colors duration-150',
                active === i && 'bg-raise',
                onSelect && slice.id !== '__rest__' ? 'cursor-pointer' : 'cursor-default',
              )}
            >
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{ background: rampStep(i, shown.length) }}
              />
              <span className="min-w-0 flex-1 truncate text-ink">{slice.name}</span>
              <span className="tnum shrink-0 font-medium text-ink">
                {formatCurrency(slice.amount)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
