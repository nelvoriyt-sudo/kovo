import { useState } from 'react'
import { useFormatCurrency } from '@/lib/currencyContext'
import { cn } from '@/lib/utils'

export type MonthPoint = { label: string; income: number; expenses: number }

/**
 * Income and expenses side by side per month. The whole column is the hit
 * target rather than the individual bars, so a short bar is still easy to
 * inspect, and the readout gives exact figures instead of making anyone
 * estimate against a gridline.
 */
export function MonthlyTrendChart({
  points,
  height = 190,
}: {
  points: MonthPoint[]
  height?: number
}) {
  const formatCurrency = useFormatCurrency()
  const [active, setActive] = useState<number | null>(null)
  const max = Math.max(...points.map((p) => Math.max(p.income, p.expenses)), 1)

  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {points.map((p, i) => {
          const net = p.income - p.expenses
          const isActive = active === i
          const align =
            i === 0 ? 'left-0' : i === points.length - 1 ? 'right-0' : 'left-1/2 -translate-x-1/2'
          return (
            <button
              key={p.label}
              type="button"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              aria-label={`${p.label}: income ${formatCurrency(p.income)}, expenses ${formatCurrency(p.expenses)}`}
              className={cn(
                'relative flex h-full flex-1 flex-col justify-end rounded-[3px] transition-colors duration-150',
                isActive && 'bg-raise',
              )}
            >
              <div className="flex h-full w-full items-end justify-center gap-[3px] px-1">
                <span
                  aria-hidden="true"
                  className="block w-1/2 max-w-[24px] rounded-t-[3px] bg-[color-mix(in_oklab,var(--ink)_45%,var(--canvas))] transition-[height] duration-500 ease-out"
                  style={{ height: `${Math.max((p.income / max) * 100, p.income > 0 ? 1.5 : 0)}%` }}
                />
                <span
                  aria-hidden="true"
                  className="block w-1/2 max-w-[24px] rounded-t-[3px] bg-accent transition-[height] duration-500 ease-out"
                  style={{
                    height: `${Math.max((p.expenses / max) * 100, p.expenses > 0 ? 1.5 : 0)}%`,
                  }}
                />
              </div>
              <span className="pt-2 text-[11px] text-muted">{p.label}</span>

              {isActive && (
                <span
                  role="status"
                  className={cn(
                    'pointer-events-none absolute bottom-[calc(100%+6px)] z-10 whitespace-nowrap rounded-[4px] bg-ink px-2.5 py-1.5 text-[11.5px] text-canvas',
                    align,
                  )}
                >
                  <b className="font-semibold">{p.label}</b>
                  {' · in '}
                  <span className="tnum">{formatCurrency(p.income)}</span>
                  {' · out '}
                  <span className="tnum">{formatCurrency(p.expenses)}</span>
                  {' · net '}
                  <span className="tnum">{`${net < 0 ? '−' : '+'}${formatCurrency(Math.abs(net))}`}</span>
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-3.5 flex items-center justify-center gap-5 text-[12.5px] text-muted">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-[2px] bg-[color-mix(in_oklab,var(--ink)_45%,var(--canvas))]"
          />
          Income
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[2px] bg-accent" />
          Expenses
        </span>
      </div>
    </div>
  )
}
