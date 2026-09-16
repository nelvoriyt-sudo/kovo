import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export type UserSettings = {
  theme: 'light' | 'dark' | 'system'
  accent_color: string
  currency: string
  compact_numbers: boolean
  date_format: string
}

const defaults: UserSettings = {
  theme: 'system',
  accent_color: '#8A7A6D',
  currency: 'USD',
  compact_numbers: false,
  date_format: 'MM/DD/YYYY',
}

export function useUserSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings>(defaults)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    supabase
      .from('user_settings')
      .select('theme, accent_color, currency, compact_numbers, date_format')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        if (data) setSettings(data as UserSettings)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const updateSettings = useCallback(
    async (patch: Partial<UserSettings>) => {
      if (!user) return
      setSettings((s) => ({ ...s, ...patch }))
      await supabase
        .from('user_settings')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
    },
    [user],
  )

  return { settings, loading, updateSettings }
}
