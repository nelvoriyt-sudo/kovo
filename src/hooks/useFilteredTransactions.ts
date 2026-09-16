import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { dataEvents } from '@/lib/events'
import { supabase } from '@/lib/supabase'
import type { Transaction } from './useTransactionsInRange'

export type TransactionFilters = {
  search: string
  categoryId: string
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
}

export const emptyFilters: TransactionFilters = {
  search: '',
  categoryId: '',
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: '',
}

export function useFilteredTransactions(filters: TransactionFilters) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
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

    let query = supabase
      .from('transactions')
      .select('id, amount, type, date, category_id, account_id, description')
      .order('date', { ascending: false })
      .limit(300)

    if (filters.search.trim()) query = query.ilike('description', `%${filters.search.trim()}%`)
    if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
    if (filters.dateFrom) query = query.gte('date', filters.dateFrom)
    if (filters.dateTo) query = query.lte('date', filters.dateTo)
    if (filters.amountMin) query = query.gte('amount', Number(filters.amountMin))
    if (filters.amountMax) query = query.lte('amount', Number(filters.amountMax))

    query.then(({ data, error }) => {
      if (cancelled) return
      if (!error) setTransactions(data ?? [])
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [user, filters, refreshKey])

  return { transactions, loading }
}
