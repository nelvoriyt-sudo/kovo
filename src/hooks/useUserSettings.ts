import { createContext, useCallback, useContext, useEffect, useState } from 'react'
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

export type UserSettingsContextValue = {
  settings: UserSettings
  loading: boolean
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>
}

export const UserSettingsContext = createContext<UserSettingsContextValue | undefined>(undefined)

/**
 * Fetches + owns the one shared copy of user_settings. Every consumer of
 * useUserSettings() reads from this same instance, so a change made in one
 * place (e.g. Settings) is immediately visible everywhere else (nav theme,
 * currency formatting) without a page reload.
 */
export function useUserSettingsState(): UserSettingsContextValue {
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

export function useUserSettings(): UserSettingsContextValue {
  const ctx = useContext(UserSettingsContext)
  if (!ctx) throw new Error('useUserSettings must be used within UserSettingsProvider')
  return ctx
}
