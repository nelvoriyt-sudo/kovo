import { useFormatCurrency } from '@/lib/currencyContext'

export function IncomeExpenseBars({ income, expenses }: { income: number; expenses: number }) {
  const max = Math.max(income, expenses, 1)

  return (
    <div className="flex flex-col gap-4">
      <BarRow label="Income" amount={income} max={max} color="bg-tan" />
      <BarRow label="Expenses" amount={expenses} max={max} color="bg-ink" />
    </div>
  )
}

function BarRow({
  label,
  amount,
  max,
  color,
}: {
  label: string
  amount: number
  max: number
  color: string
}) {
  const formatCurrency = useFormatCurrency()
  const pct = Math.max((amount / max) * 100, amount > 0 ? 2 : 0)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="font-semibold text-[#4a453e]">{label}</span>
        <span className="text-muted">{formatCurrency(amount)}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-paper-dim">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
