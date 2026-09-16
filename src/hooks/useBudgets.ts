import { endOfMonth, format, startOfMonth } from 'date-fns'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export type Budget = {
  id: string
  category_id: string
  amount: number
  period_start: string
  period_end: string | null
}

export function useMonthlyBudgets(monthDate: Date) {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  const periodStart = format(startOfMonth(monthDate), 'yyyy-MM-dd')
  const periodEnd = format(endOfMonth(monthDate), 'yyyy-MM-dd')

  const refresh = useCallback(() => {
    if (!user) return
    supabase
      .from('budgets')
      .select('id, category_id, amount, period_start, period_end')
      .eq('period_type', 'monthly')
      .eq('period_start', periodStart)
      .then(({ data }) => {
        setBudgets(data ?? [])
        setLoading(false)
      })
  }, [user, periodStart])

  useEffect(() => {
    refresh()
  }, [refresh])

  const setBudgetAmount = useCallback(
    async (categoryId: string, amount: number) => {
      if (!user) return
      const existing = budgets.find((b) => b.category_id === categoryId)
      if (existing) {
        await supabase.from('budgets').update({ amount }).eq('id', existing.id)
      } else {
        await supabase.from('budgets').insert({
          user_id: user.id,
          category_id: categoryId,
          amount,
          period_type: 'monthly',
          period_start: periodStart,
          period_end: periodEnd,
        })
      }
      refresh()
    },
    [user, budgets, periodStart, periodEnd, refresh],
  )

  return { budgets, loading, setBudgetAmount }
}
