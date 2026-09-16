import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export type IncomeEvent = {
  id: string
  schedule_id: string | null
  type: 'pay' | 'tip_out' | 'other'
  date: string
  amount: number | null
  account_id: string | null
  transaction_id: string | null
  note: string | null
}

export function useIncomeEvents(from: string, to: string) {
  const { user } = useAuth()
  const [events, setEvents] = useState<IncomeEvent[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    if (!user) return
    supabase
      .from('income_events')
      .select('id, schedule_id, type, date, amount, account_id, transaction_id, note')
      .gte('date', from)
      .lte('date', to)
      .order('date')
      .then(({ data }) => {
        setEvents(data ?? [])
        setLoading(false)
      })
  }, [user, from, to])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { events, loading, refresh }
}
