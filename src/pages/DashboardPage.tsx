import { addDays, differenceInCalendarDays, endOfMonth, format } from 'date-fns'
import { Link, useNavigate } from 'react-router-dom'
import { CategoryDonut } from '@/components/CategoryDonut'
import { MonthlyTrendChart } from '@/components/MonthlyTrendChart'
import { Panel } from '@/components/ui/Panel'
import { StatCard, StatRow } from '@/components/ui/StatCard'
import { useMonthlyBudgets } from '@/hooks/useBudgets'
import { useCategories } from '@/hooks/useCategories'
import { useIncomeEvents } from '@/hooks/useIncomeEvents'
import { useMonthlySummaries } from '@/hooks/useMonthlySummaries'
import { useMonthTransactions } from '@/hooks/useMonthTransactions'
import { useFormatCurrency } from '@/lib/currencyContext'
import { buildBudgetInsights } from '@/lib/insights'

const EVENT_LABEL = { pay: 'Pay', tip_out: 'Tip-out', other: 'Income' } as const

export function DashboardPage() {
  const navigate = useNavigate()
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

  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const surplus = income - expenses
  const daysLeft = Math.max(differenceInCalendarDays(endOfMonth(now), now), 0)

  // Budget matching needs real category ids only; uncategorized spend can't be
  // checked against a budget since budgets are set per-category.
  const spentByCategory = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== 'expense' || !t.category_id) continue
    spentByCategory.set(t.category_id, (spentByCategory.get(t.category_id) ?? 0) + Number(t.amount))
  }
  const budgetsByCategory = new Map(budgets.map((b) => [b.category_id, Number(b.amount)]))
  const insights = buildBudgetInsights(categories, spentByCategory, budgetsByCategory, now)

  // The breakdown has to account for every dollar of expense, including
  // transactions with no category yet (freshly synced from a bank, say), or it
  // silently disagrees with the Expenses figure above it.
  const spentByCategoryOrUncategorized = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== 'expense') continue
    const key = t.category_id ?? 'uncategorized'
    spentByCategoryOrUncategorized.set(
      key,
      (spentByCategoryOrUncategorized.get(key) ?? 0) + Number(t.amount),
    )
  }
  const categorySlices = [...spentByCategoryOrUncategorized.entries()].map(([id, amount]) => ({
    id,
    name: categories.find((c) => c.id === id)?.name ?? 'Uncategorized',
    amount,
  }))

  const nextEvents = [...upcomingEvents].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3)
  const hasTrend = trendPoints.some((p) => p.income > 0 || p.expenses > 0)

  return (
    <div>
      <header>
        <h1 className="font-display text-[30px] font-semibold tracking-[-0.025em] text-ink sm:text-[34px]">
          {format(now, 'MMMM')} at a glance
        </h1>
        <p className="mt-1 text-[15px] text-muted">
          {daysLeft === 0 ? 'Last day of the month.' : `${daysLeft} days left in the month.`}
        </p>
      </header>

      {loading ? (
        <p className="mt-10 text-[15px] text-muted">Loading your month…</p>
      ) : error ? (
        <p role="alert" className="mt-10 text-[15px] text-neg">
          Couldn't load your transactions: {error}
        </p>
      ) : (
        <>
          <div className="mt-8">
            <StatRow>
              <StatCard
                label="Income"
                value={formatCurrency(income)}
                note={`${transactions.filter((t) => t.type === 'income').length} deposits`}
                to="/transactions"
              />
              <StatCard
                label="Expenses"
                value={formatCurrency(expenses)}
                note={`${transactions.filter((t) => t.type === 'expense').length} transactions`}
                to="/transactions"
              />
              <StatCard
                label={surplus >= 0 ? 'Surplus' : 'Deficit'}
                value={formatCurrency(Math.abs(surplus))}
                note={surplus >= 0 ? 'Income ahead of spending' : 'Spending outpaces income'}
                tone={surplus >= 0 ? 'positive' : 'negative'}
              />
            </StatRow>
          </div>

          {insights.length > 0 && (
            <div className="mt-6 flex flex-col gap-2">
              {insights.slice(0, 3).map((insight) => (
                <p
                  key={insight.id}
                  className="rounded-[4px] border border-line border-l-2 border-l-accent bg-surface px-4 py-3 text-[14px] text-ink"
                >
                  {insight.overAmount > 0 ? (
                    <>
                      You're{' '}
                      <span className="font-semibold text-neg">
                        {formatCurrency(insight.overAmount)} over
                      </span>{' '}
                      your {insight.categoryName} budget with {insight.daysLeft} day
                      {insight.daysLeft === 1 ? '' : 's'} left.
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">{insight.pct}%</span> of your{' '}
                      {insight.categoryName} budget used, with {insight.daysLeft} day
                      {insight.daysLeft === 1 ? '' : 's'} left.
                    </>
                  )}
                </p>
              ))}
            </div>
          )}

          {transactions.length === 0 ? (
            <div className="mt-6 rounded-[4px] border border-dashed border-line p-10 text-center">
              <p className="font-display text-lg font-semibold text-ink">Nothing recorded yet</p>
              <p className="mx-auto mt-2 max-w-sm text-[15px] text-muted">
                Add a transaction or connect a bank, and this month's picture builds itself.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel title="Where it went" action="All spending" actionTo="/spending">
                <CategoryDonut
                  slices={categorySlices}
                  onSelect={(id) =>
                    navigate(id === 'uncategorized' ? '/transactions' : `/transactions?category=${id}`)
                  }
                />
              </Panel>

              <Panel title="Income vs. expenses" action="Trend" actionTo="/trends">
                {hasTrend ? (
                  <MonthlyTrendChart points={trendPoints} />
                ) : (
                  <p className="text-[14px] text-muted">
                    A month or two of history and the trend shows up here.
                  </p>
                )}
              </Panel>
            </div>
          )}

          <Panel title="Upcoming" action="Open calendar" actionTo="/calendar" className="mt-4">
            {nextEvents.length === 0 ? (
              <p className="text-[14px] text-muted">
                Nothing scheduled in the next 30 days. Set a pay period on the calendar to see it
                here.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {nextEvents.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 text-[14px]">
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                    />
                    <span className="text-muted">
                      {format(new Date(`${e.date}T00:00:00`), 'EEE, MMM d')}
                    </span>
                    <span className="font-medium text-ink">{EVENT_LABEL[e.type]}</span>
                    {e.amount != null && (
                      <span className="tnum ml-auto font-medium text-ink">
                        {formatCurrency(e.amount)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <p className="mt-6 text-[13px] text-muted">
            Want the detail?{' '}
            <Link to="/transactions" className="font-semibold text-accent hover:underline">
              Browse every transaction
            </Link>
            .
          </p>
        </>
      )}
    </div>
  )
}
