import { addDays, format } from 'date-fns'
import { Link } from 'react-router-dom'
import { CategoryDonut } from '@/components/CategoryDonut'
import { IncomeExpenseBars } from '@/components/IncomeExpenseBars'
import { MonthlyTrendChart } from '@/components/MonthlyTrendChart'
import { StatCard } from '@/components/ui/StatCard'
import { useMonthlyBudgets } from '@/hooks/useBudgets'
import { useCategories } from '@/hooks/useCategories'
import { useIncomeEvents } from '@/hooks/useIncomeEvents'
import { useMonthlySummaries } from '@/hooks/useMonthlySummaries'
import { useMonthTransactions } from '@/hooks/useMonthTransactions'
import { useAuth } from '@/lib/auth'
import { getCategoryColor } from '@/lib/categoryColors'
import { useFormatCurrency } from '@/lib/currencyContext'
import { buildBudgetInsights } from '@/lib/insights'

const EVENT_LABEL = { pay: 'Pay', tip_out: 'Tip-out', other: 'Income' } as const

export function DashboardPage() {
  const { user } = useAuth()
  const formatCurrency = useFormatCurrency()
  const now = new Date()
  const { transactions, loading, error } = useMonthTransactions(now)
  const { categories } = useCategories()
  const { budgets } = useMonthlyBudgets(now)
  const { points: trendPoints } = useMonthlySummaries(6)
  const { events: upcomingEvents } = useIncomeEvents(
    format(now, 'yyyy-MM-dd'),
    format(addDays(now, 30), 'yyyy-MM-dd'),
  )

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

  const categorySlices = [...spentByCategory.entries()]
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
  const categoryTotal = categorySlices.reduce((sum, s) => sum + s.amount, 0)

  const nextEvents = [...upcomingEvents].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3)

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

          {insights.length > 0 && (
            <div className="mt-6 flex flex-col gap-2">
              {insights.slice(0, 3).map((insight) => (
                <div
                  key={insight.id}
                  className="rounded-xl border border-highlight-border bg-highlight px-4 py-3 text-[14px] text-highlight-text"
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

          {transactions.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center">
              <p className="font-display text-lg font-semibold text-ink">Nothing recorded yet</p>
              <p className="mt-2 text-[15px] text-muted">
                Once you start adding income and expenses, this month's picture will show up here.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-surface p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-base font-semibold text-ink">Income vs. expenses</h2>
                  <Link to="/trends" className="text-[13px] font-semibold text-tan-dark hover:text-tan-darker">
                    View trend →
                  </Link>
                </div>
                <IncomeExpenseBars income={income} expenses={expenses} />
                {trendPoints.some((p) => p.income > 0 || p.expenses > 0) && (
                  <div className="mt-6 border-t border-border pt-5">
                    <MonthlyTrendChart points={trendPoints} />
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-surface p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-base font-semibold text-ink">Spending by category</h2>
                  <Link to="/spending" className="text-[13px] font-semibold text-tan-dark hover:text-tan-darker">
                    View all →
                  </Link>
                </div>
                {categorySlices.length === 0 ? (
                  <p className="text-[14px] text-muted">No expenses logged yet this month.</p>
                ) : (
                  <div className="flex items-center gap-6">
                    <CategoryDonut slices={categorySlices} total={categoryTotal} />
                    <ul className="flex flex-1 flex-col gap-2">
                      {categorySlices.slice(0, 4).map((s) => (
                        <li key={s.id} className="flex items-center gap-2 text-[13px] text-ink">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: s.color }}
                            aria-hidden="true"
                          />
                          <span className="flex-1 truncate">{s.name}</span>
                          <span className="font-semibold">{formatCurrency(s.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-border bg-surface p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink">Upcoming</h2>
              <Link to="/calendar" className="text-[13px] font-semibold text-tan-dark hover:text-tan-darker">
                Open calendar →
              </Link>
            </div>
            {nextEvents.length === 0 ? (
              <p className="text-[14px] text-muted">
                Nothing scheduled in the next 30 days. Set a pay period on the calendar to see it here.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {nextEvents.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 text-[14px]">
                    <span
                      className={
                        'h-2 w-2 shrink-0 rounded-full ' +
                        (e.type === 'pay' ? 'bg-[#a34c3f]' : e.type === 'tip_out' ? 'bg-[#4d7358]' : 'bg-tan')
                      }
                      aria-hidden="true"
                    />
                    <span className="text-muted">{format(new Date(`${e.date}T00:00:00`), 'EEE, MMM d')}</span>
                    <span className="font-medium text-ink">{EVENT_LABEL[e.type]}</span>
                    {e.amount != null && (
                      <span className="ml-auto font-semibold text-ink">{formatCurrency(e.amount)}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
