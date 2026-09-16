import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { CategoryDonut } from '@/components/CategoryDonut'
import { Panel } from '@/components/ui/Panel'
import { useCategories } from '@/hooks/useCategories'
import { useMonthTransactions } from '@/hooks/useMonthTransactions'
import { useFormatCurrency } from '@/lib/currencyContext'

export function SpendingByCategoryPage() {
  const now = new Date()
  const navigate = useNavigate()
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
    .map(([id, amount]) => ({
      id,
      name: categories.find((c) => c.id === id)?.name ?? 'Uncategorized',
      amount,
    }))
    .sort((a, b) => b.amount - a.amount)

  return (
    <div>
      <header>
        <h1 className="font-display text-[30px] font-semibold tracking-[-0.025em] text-ink">
          Spending by category
        </h1>
        <p className="mt-1 text-[15px] text-muted">{format(now, 'MMMM yyyy')}</p>
      </header>

      {loading ? (
        <p className="mt-10 text-[15px] text-muted">Loading…</p>
      ) : slices.length === 0 ? (
        <div className="mt-8 rounded-[4px] border border-dashed border-line p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No expenses yet this month</p>
          <p className="mt-2 text-[15px] text-muted">
            Add a transaction to see how your spending breaks down.
          </p>
        </div>
      ) : (
        <>
          <Panel className="mt-8">
            <CategoryDonut
              slices={slices}
              maxSlices={7}
              onSelect={(id) =>
                navigate(id === 'uncategorized' ? '/transactions' : `/transactions?category=${id}`)
              }
            />
          </Panel>

          <Panel title="Every category" className="mt-4">
            <table className="w-full text-[14px]">
              <caption className="sr-only">
                Spending by category for {format(now, 'MMMM yyyy')}
              </caption>
              <thead>
                <tr className="border-b border-line text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                  <th scope="col" className="pb-2 font-semibold">
                    Category
                  </th>
                  <th scope="col" className="pb-2 text-right font-semibold">
                    Spent
                  </th>
                  <th scope="col" className="pb-2 text-right font-semibold">
                    Share
                  </th>
                </tr>
              </thead>
              <tbody>
                {slices.map((s) => (
                  <tr key={s.id} className="border-b border-line last:border-b-0">
                    <th scope="row" className="py-2.5 pr-3 text-left font-medium text-ink">
                      {s.name}
                    </th>
                    <td className="tnum py-2.5 text-right text-ink">{formatCurrency(s.amount)}</td>
                    <td className="tnum py-2.5 text-right text-muted">
                      {total > 0 ? Math.round((s.amount / total) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line">
                  <th scope="row" className="pt-2.5 text-left font-semibold text-ink">
                    Total
                  </th>
                  <td className="tnum pt-2.5 text-right font-semibold text-ink">
                    {formatCurrency(total)}
                  </td>
                  <td className="pt-2.5" />
                </tr>
              </tfoot>
            </table>
          </Panel>
        </>
      )}
    </div>
  )
}
