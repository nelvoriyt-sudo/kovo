import { useFormatCurrency } from '@/lib/currencyContext'

export type MonthPoint = { label: string; income: number; expenses: number }

export function MonthlyTrendChart({ points }: { points: MonthPoint[] }) {
  const formatCurrency = useFormatCurrency()
  const max = Math.max(...points.map((p) => Math.max(p.income, p.expenses)), 1)

  return (
    <div>
      <div className="flex gap-3 sm:gap-4">
        {points.map((p) => (
          <div key={p.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-56 w-full items-end justify-center gap-1">
              <div
                className="w-full max-w-[18px] rounded-t-sm bg-tan"
                style={{ height: `${Math.max((p.income / max) * 100, p.income > 0 ? 2 : 0)}%` }}
                title={`Income: ${formatCurrency(p.income)}`}
              />
              <div
                className="w-full max-w-[18px] rounded-t-sm bg-ink"
                style={{ height: `${Math.max((p.expenses / max) * 100, p.expenses > 0 ? 2 : 0)}%` }}
                title={`Expenses: ${formatCurrency(p.expenses)}`}
              />
            </div>
            <span className="text-[11px] font-medium text-muted-light">{p.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center gap-6 text-[13px]">
        <span className="flex items-center gap-1.5 text-muted">
          <span className="h-2.5 w-2.5 rounded-full bg-tan" /> Income
        </span>
        <span className="flex items-center gap-1.5 text-muted">
          <span className="h-2.5 w-2.5 rounded-full bg-ink" /> Expenses
        </span>
      </div>
    </div>
  )
}
