import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { IncomeExpenseBars } from '@/components/IncomeExpenseBars'
import { StatCard } from '@/components/ui/StatCard'
import { useMonthlyBudgets } from '@/hooks/useBudgets'
import { useCategories } from '@/hooks/useCategories'
import { useMonthTransactions } from '@/hooks/useMonthTransactions'
import { useAuth } from '@/lib/auth'
import { useFormatCurrency } from '@/lib/currencyContext'
import { buildBudgetInsights } from '@/lib/insights'

export function DashboardPage() {
  const { user } = useAuth()
  const formatCurrency = useFormatCurrency()
  const now = new Date()
  const { transactions, loading, error } = useMonthTransactions(now)
  const { categories } = useCategories()
  const { budgets } = useMonthlyBudgets(now)

  const name =
    (user?.user_metadata as { display_name?: string; full_name?: string } | undefined)
      ?.display_name ??
    (user?.user_metadata as { full_name?: string } | undefined)?.full_name ??
    user?.email

  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const surplus = income - expenses

  const spentByCategory = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== 'expense' || !t.category_id) continue
    spentByCategory.set(t.category_id, (spentByCategory.get(t.category_id) ?? 0) + Number(t.amount))
  }
  const budgetsByCategory = new Map(budgets.map((b) => [b.category_id, Number(b.amount)]))
  const insights = buildBudgetInsights(categories, spentByCategory, budgetsByCategory, now)

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Welcome, {name}.</h1>
      <p className="mt-1 text-[15px] text-muted">{format(now, 'MMMM yyyy')} at a glance.</p>

      {loading ? (
        <p className="mt-10 text-[15px] text-muted">Loading your month…</p>
      ) : error ? (
        <p role="alert" className="mt-10 text-[15px] text-[#a34c3f]">
          Couldn't load your transactions: {error}
        </p>
      ) : transactions.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">Nothing recorded yet</p>
          <p className="mt-2 text-[15px] text-muted">
            Once you start adding income and expenses, this month's picture will show up here.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Income" value={formatCurrency(income)} />
            <StatCard label="Expenses" value={formatCurrency(expenses)} />
            <StatCard
              label={surplus >= 0 ? 'Surplus' : 'Deficit'}
              value={formatCurrency(Math.abs(surplus))}
              tone={surplus >= 0 ? 'positive' : 'negative'}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
            <IncomeExpenseBars income={income} expenses={expenses} />
          </div>

          {insights.length > 0 && (
            <div className="mt-6 flex flex-col gap-2">
              {insights.slice(0, 3).map((insight) => (
                <div
                  key={insight.id}
                  className="rounded-xl border border-[#e8d9c5] bg-[#fbf3e8] px-4 py-3 text-[14px] text-[#4a453e]"
                >
                  {insight.overAmount > 0 ? (
                    <>
                      You're <span className="font-semibold">{formatCurrency(insight.overAmount)} over</span> your{' '}
                      {insight.categoryName} budget with {insight.daysLeft} day
                      {insight.daysLeft === 1 ? '' : 's'} left.
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">{insight.pct}%</span> of your {insight.categoryName} budget
                      used, with {insight.daysLeft} day{insight.daysLeft === 1 ? '' : 's'} left.
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link to="/spending" className="font-semibold text-tan-dark hover:text-tan-darker">
          Spending by category →
        </Link>
        <Link to="/trends" className="font-semibold text-tan-dark hover:text-tan-darker">
          Trends over time →
        </Link>
        <Link to="/budgets" className="font-semibold text-tan-dark hover:text-tan-darker">
          Budgets →
        </Link>
      </div>
    </div>
  )
}
