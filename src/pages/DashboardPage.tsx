import { format } from 'date-fns'
import { IncomeExpenseBars } from '@/components/IncomeExpenseBars'
import { KovoLogo } from '@/components/KovoLogo'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/ui/StatCard'
import { useMonthTransactions } from '@/hooks/useMonthTransactions'
import { useUserSettings } from '@/hooks/useUserSettings'
import { useAuth } from '@/lib/auth'
import { formatCurrency } from '@/lib/currency'
import { supabase } from '@/lib/supabase'

export function DashboardPage() {
  const { user } = useAuth()
  const { settings } = useUserSettings()
  const now = new Date()
  const { transactions, loading, error } = useMonthTransactions(now)

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

  return (
    <div className="min-h-svh bg-paper">
      <header className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-10">
        <KovoLogo className="h-6 w-auto" />
        <Button
          type="button"
          variant="secondary"
          className="w-auto px-4"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </Button>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
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
              <StatCard label="Income" value={formatCurrency(income, settings.currency)} />
              <StatCard label="Expenses" value={formatCurrency(expenses, settings.currency)} />
              <StatCard
                label={surplus >= 0 ? 'Surplus' : 'Deficit'}
                value={formatCurrency(Math.abs(surplus), settings.currency)}
                tone={surplus >= 0 ? 'positive' : 'negative'}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-white p-6">
              <IncomeExpenseBars income={income} expenses={expenses} currency={settings.currency} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
