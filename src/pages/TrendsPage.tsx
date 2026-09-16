import { useState } from 'react'
import { MonthlyTrendChart } from '@/components/MonthlyTrendChart'
import { Panel } from '@/components/ui/Panel'
import { useMonthlySummaries } from '@/hooks/useMonthlySummaries'
import { useFormatCurrency } from '@/lib/currencyContext'
import { cn } from '@/lib/utils'

export function TrendsPage() {
  const [range, setRange] = useState<6 | 12>(6)
  const { points, loading } = useMonthlySummaries(range)
  const formatCurrency = useFormatCurrency()

  const hasData = points.some((p) => p.income > 0 || p.expenses > 0)
  const totalIn = points.reduce((sum, p) => sum + p.income, 0)
  const totalOut = points.reduce((sum, p) => sum + p.expenses, 0)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <header>
          <h1 className="font-display text-[30px] font-semibold tracking-[-0.025em] text-ink">
            Income vs. expenses
          </h1>
          <p className="mt-1 text-[15px] text-muted">Trend over time</p>
        </header>
        <div className="inline-flex gap-0.5 rounded-[5px] bg-raise p-[3px]">
          {([6, 12] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={cn(
                'touch-manipulation rounded-[3px] px-3.5 py-1.5 text-[13px] transition-colors duration-150',
                range === r
                  ? 'bg-accent font-semibold text-on-accent'
                  : 'font-medium text-muted hover:text-ink',
              )}
            >
              {r} months
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="mt-10 text-[15px] text-muted">Loading…</p>
      ) : !hasData ? (
        <div className="mt-8 rounded-[4px] border border-dashed border-line p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">Nothing to chart yet</p>
          <p className="mt-2 text-[15px] text-muted">
            Once you've logged a few months of activity, the trend will show up here.
          </p>
        </div>
      ) : (
        <>
          <Panel className="mt-7">
            <MonthlyTrendChart points={points} height={260} />
          </Panel>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Panel>
              <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">
                Total in · last {range} months
              </p>
              <p className="tnum mt-2 text-[26px] font-medium text-ink">
                {formatCurrency(totalIn)}
              </p>
            </Panel>
            <Panel>
              <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">
                Total out · last {range} months
              </p>
              <p className="tnum mt-2 text-[26px] font-medium text-ink">
                {formatCurrency(totalOut)}
              </p>
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}
