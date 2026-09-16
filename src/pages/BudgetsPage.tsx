import { format } from 'date-fns'
import { BudgetRow } from '@/components/BudgetRow'
import { useMonthlyBudgets } from '@/hooks/useBudgets'
import { useCategories } from '@/hooks/useCategories'
import { useMonthTransactions } from '@/hooks/useMonthTransactions'

export function BudgetsPage() {
  const now = new Date()
  const { categories, loading: categoriesLoading } = useCategories()
  const { transactions, loading: txLoading } = useMonthTransactions(now)
  const { budgets, setBudgetAmount } = useMonthlyBudgets(now)

  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const spentByCategory = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== 'expense' || !t.category_id) continue
    spentByCategory.set(t.category_id, (spentByCategory.get(t.category_id) ?? 0) + Number(t.amount))
  }

  const loading = categoriesLoading || txLoading

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Budgets</h1>
      <p className="mt-1 text-[15px] text-muted">{format(now, 'MMMM yyyy')}</p>

      {loading ? (
        <p className="mt-10 text-[15px] text-muted">Loading…</p>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {expenseCategories.map((c) => {
            const budget = budgets.find((b) => b.category_id === c.id)
            return (
              <BudgetRow
                key={c.id}
                name={c.name}
                spent={spentByCategory.get(c.id) ?? 0}
                budgeted={budget?.amount ?? null}
                onSave={(amount) => setBudgetAmount(c.id, amount)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
