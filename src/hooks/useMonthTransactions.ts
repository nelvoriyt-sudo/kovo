import { endOfMonth, format, startOfMonth } from 'date-fns'
import { useTransactionsInRange, type Transaction } from './useTransactionsInRange'

export type { Transaction }

export function useMonthTransactions(monthDate: Date) {
  const from = format(startOfMonth(monthDate), 'yyyy-MM-dd')
  const to = format(endOfMonth(monthDate), 'yyyy-MM-dd')
  return useTransactionsInRange(from, to)
}
