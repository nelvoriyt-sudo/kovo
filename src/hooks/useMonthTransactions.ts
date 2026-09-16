import { endOfMonth, format, startOfMonth } from 'date-fns'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export type Transaction = {
  id: string
  amount: number
  type: 'income' | 'expense'
  date: string
  category_id: string | null
  description: string | null
}

export function useMonthTransactions(monthDate: Date) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const from = format(startOfMonth(monthDate), 'yyyy-MM-dd')
  const to = format(endOfMonth(monthDate), 'yyyy-MM-dd')

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)

    supabase
      .from('transactions')
      .select('id, amount, type, date, category_id, description')
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: false })
      .then(({ data, error: queryError }) => {
        if (cancelled) return
        if (queryError) {
          setError(queryError.message)
        } else {
          setTransactions(data ?? [])
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, from, to])

  return { transactions, loading, error }
}
