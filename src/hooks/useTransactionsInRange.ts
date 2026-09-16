import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { dataEvents } from '@/lib/events'
import { supabase } from '@/lib/supabase'

export type Transaction = {
  id: string
  amount: number
  type: 'income' | 'expense'
  date: string
  category_id: string | null
  account_id: string | null
  description: string | null
}

/** from/to are 'yyyy-MM-dd' strings, inclusive. */
export function useTransactionsInRange(from: string, to: string) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1)
    dataEvents.addEventListener('transactions-changed', handler)
    return () => dataEvents.removeEventListener('transactions-changed', handler)
  }, [])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)

    supabase
      .from('transactions')
      .select('id, amount, type, date, category_id, account_id, description')
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
  }, [user, from, to, refreshKey])

  return { transactions, loading, error }
}
