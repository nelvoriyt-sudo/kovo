import { useState } from 'react'
import { MonthlyTrendChart } from '@/components/MonthlyTrendChart'
import { useMonthlySummaries } from '@/hooks/useMonthlySummaries'
import { cn } from '@/lib/utils'

export function TrendsPage() {
  const [range, setRange] = useState<6 | 12>(6)
  const { points, loading } = useMonthlySummaries(range)

  const hasData = points.some((p) => p.income > 0 || p.expenses > 0)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Income vs. expenses</h1>
          <p className="mt-1 text-[15px] text-muted">Trend over time</p>
        </div>
        <div className="flex gap-2 rounded-[10px] bg-paper-dim p-1">
          {([6, 12] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                'touch-manipulation rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors',
                range === r ? 'bg-ink text-on-ink' : 'text-muted hover:text-ink',
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
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">Nothing to chart yet</p>
          <p className="mt-2 text-[15px] text-muted">
            Once you've logged a few months of activity, the trend will show up here.
          </p>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <MonthlyTrendChart points={points} />
        </div>
      )}
    </div>
  )
}
