import { format } from 'date-fns'
import { CategoryDonut } from '@/components/CategoryDonut'
import { useCategories } from '@/hooks/useCategories'
import { useMonthTransactions } from '@/hooks/useMonthTransactions'
import { getCategoryColor } from '@/lib/categoryColors'
import { useFormatCurrency } from '@/lib/currencyContext'

export function SpendingByCategoryPage() {
  const now = new Date()
  const formatCurrency = useFormatCurrency()
  const { transactions, loading } = useMonthTransactions(now)
  const { categories } = useCategories()

  const expenses = transactions.filter((t) => t.type === 'expense')
  const total = expenses.reduce((sum, t) => sum + Number(t.amount), 0)

  const byCategory = new Map<string, number>()
  for (const t of expenses) {
    const key = t.category_id ?? 'uncategorized'
    byCategory.set(key, (byCategory.get(key) ?? 0) + Number(t.amount))
  }

  const slices = [...byCategory.entries()]
    .map(([categoryId, amount]) => {
      const category = categories.find((c) => c.id === categoryId)
      return {
        id: categoryId,
        name: category?.name ?? 'Uncategorized',
        amount,
        color: category ? getCategoryColor(category) : '#a49b8f',
      }
    })
    .sort((a, b) => b.amount - a.amount)

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Spending by category</h1>
      <p className="mt-1 text-[15px] text-muted">{format(now, 'MMMM yyyy')}</p>

      {loading ? (
        <p className="mt-10 text-[15px] text-muted">Loading…</p>
      ) : slices.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No expenses yet this month</p>
          <p className="mt-2 text-[15px] text-muted">
            Add a transaction to see how your spending breaks down.
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center gap-8 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-start sm:p-8">
          <div className="flex shrink-0 flex-col items-center gap-2">
            <CategoryDonut slices={slices} total={total} />
            <div className="text-center">
              <div className="font-display text-xl font-semibold text-ink">
                {formatCurrency(total)}
              </div>
              <div className="text-[13px] text-muted-light">total spent</div>
            </div>
          </div>

          <ul className="flex w-full flex-col gap-3">
            {slices.map((slice) => (
              <li key={slice.id} className="flex items-center gap-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                  aria-hidden="true"
                />
                <span className="flex-1 text-[15px] text-ink">{slice.name}</span>
                <span className="text-[15px] font-semibold text-ink">
                  {formatCurrency(slice.amount)}
                </span>
                <span className="w-12 text-right text-[13px] text-muted-light">
                  {total > 0 ? Math.round((slice.amount / total) * 100) : 0}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
