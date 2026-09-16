import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

type UserSettings = {
  currency: string
  compact_numbers: boolean
}

const defaults: UserSettings = { currency: 'USD', compact_numbers: false }

export function useUserSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings>(defaults)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    supabase
      .from('user_settings')
      .select('currency, compact_numbers')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        if (data) setSettings(data)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  return { settings, loading }
}
