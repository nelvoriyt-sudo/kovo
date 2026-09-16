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

  function handleSave() {
    const amount = Number(value)
    if (Number.isFinite(amount) && amount > 0) {
      onSave(amount)
      setEditing(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-ink">{name}</span>
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              step="0.01"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-9 w-28"
            />
            <Button type="button" className="h-9 w-auto px-3" onClick={handleSave}>
              Save
            </Button>
          </div>
        ) : budgeted == null ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm font-semibold text-tan-dark hover:text-tan-darker"
          >
            Set budget
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-muted hover:text-ink"
          >
            {formatCurrency(spent)} of {formatCurrency(budgeted)}
          </button>
        )}
      </div>

      {budgeted != null && (
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-paper-dim">
          <div
            className={cn(
              'h-full rounded-full',
              over ? 'bg-[#a34c3f]' : near ? 'bg-[#b08c3f]' : 'bg-tan',
            )}
            style={{ width: `${Math.max(pct, spent > 0 ? 2 : 0)}%` }}
          />
        </div>
      )}
      {over && (
        <p className="mt-1.5 text-[13px] font-medium text-[#a34c3f]">
          {formatCurrency(spent - budgeted!)} over budget
        </p>
      )}
    </div>
  )
}
