import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import { useMemo } from 'react'
import { useTransactionsInRange } from './useTransactionsInRange'
import type { MonthPoint } from '@/components/MonthlyTrendChart'

export function useMonthlySummaries(monthsBack: number) {
  const now = new Date()
  const rangeStart = startOfMonth(subMonths(now, monthsBack - 1))
  const rangeEnd = endOfMonth(now)

  const from = format(rangeStart, 'yyyy-MM-dd')
  const to = format(rangeEnd, 'yyyy-MM-dd')

  const { transactions, loading, error } = useTransactionsInRange(from, to)

  const points = useMemo<MonthPoint[]>(() => {
    const buckets: MonthPoint[] = []
    for (let i = monthsBack - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      buckets.push({ label: format(monthDate, 'MMM'), income: 0, expenses: 0 })
    }

    for (const t of transactions) {
      const monthIndex = monthsBack - 1 - monthsBetween(new Date(t.date), now)
      const bucket = buckets[monthIndex]
      if (!bucket) continue
      if (t.type === 'income') bucket.income += Number(t.amount)
      else bucket.expenses += Number(t.amount)
    }

    return buckets
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, monthsBack])

  return { points, loading, error }
}

function monthsBetween(from: Date, to: Date) {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
}
