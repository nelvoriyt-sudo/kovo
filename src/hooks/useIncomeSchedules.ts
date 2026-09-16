import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export type IncomeSchedule = {
  id: string
  label: string | null
  type: 'pay' | 'tip_out'
  frequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'custom'
  anchor_date: string
  is_active: boolean
}

export function useIncomeSchedules() {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState<IncomeSchedule[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    if (!user) return
    supabase
      .from('income_schedules')
      .select('id, label, type, frequency, anchor_date, is_active')
      .eq('is_active', true)
      .then(({ data }) => {
        setSchedules(data ?? [])
        setLoading(false)
      })
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { schedules, loading, refresh }
}
