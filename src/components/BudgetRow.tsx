import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useFormatCurrency } from '@/lib/currencyContext'
import { cn } from '@/lib/utils'

export function BudgetRow({
  name,
  spent,
  budgeted,
  onSave,
}: {
  name: string
  spent: number
  budgeted: number | null
  onSave: (amount: number) => void
}) {
  const formatCurrency = useFormatCurrency()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(budgeted?.toString() ?? '')

  const pct = budgeted ? Math.min((spent / budgeted) * 100, 100) : 0
  const over = budgeted != null && spent > budgeted
  const near = budgeted != null && !over && spent / budgeted >= 0.8
  const remaining = budgeted != null ? budgeted - spent : 0

  function handleSave() {
    const amount = Number(value)
    if (Number.isFinite(amount) && amount > 0) {
      onSave(amount)
      setEditing(false)
    }
  }

  return (
    <div className="border-t border-line py-4 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-[14px] font-medium text-ink">{name}</span>
        {editing ? (
          <div className="flex shrink-0 items-center gap-2">
            <Input
              type="number"
              min="0"
              step="0.01"
              autoFocus
              aria-label={`Budget for ${name}`}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') setEditing(false)
              }}
              className="h-9 w-28"
            />
            <Button type="button" className="h-9 w-auto px-3 text-[13px]" onClick={handleSave}>
              Save
            </Button>
          </div>
        ) : budgeted == null ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 text-[13px] font-semibold text-accent hover:underline"
          >
            Set budget
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="tnum shrink-0 text-[13px] text-muted transition-colors hover:text-ink"
          >
            <span className={over ? 'font-medium text-neg' : 'font-medium text-ink'}>
              {formatCurrency(spent)}
            </span>
            {' / '}
            {formatCurrency(budgeted)}
          </button>
        )}
      </div>

      {budgeted != null && (
        <>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-raise">
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-500 ease-out',
                over ? 'bg-neg' : near ? 'bg-[color-mix(in_oklab,var(--neg)_45%,var(--accent))]' : 'bg-accent',
              )}
              style={{ width: `${Math.max(pct, spent > 0 ? 2 : 0)}%` }}
            />
          </div>
          <p className={cn('mt-1.5 text-[12.5px]', over ? 'font-medium text-neg' : 'text-muted')}>
            {over
              ? `${formatCurrency(-remaining)} over budget`
              : `${formatCurrency(remaining)} left`}
          </p>
        </>
      )}
    </div>
  )
}
