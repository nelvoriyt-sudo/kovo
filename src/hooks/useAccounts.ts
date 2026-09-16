import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export type Account = {
  id: string
  name: string
  type: 'checking' | 'savings' | 'credit_card' | 'cash' | 'other'
  current_balance: number
  is_active: boolean
}

export function useAccounts() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    if (!user) return
    supabase
      .from('accounts')
      .select('id, name, type, current_balance, is_active')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setAccounts(data ?? [])
        setLoading(false)
      })
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { accounts, loading, refresh }
}
