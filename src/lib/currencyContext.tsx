import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useUserSettings } from '@/hooks/useUserSettings'
import { formatCurrency } from './currency'

const CurrencyContext = createContext<{ currency: string; compact: boolean } | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { settings } = useUserSettings()
  const value = useMemo(
    () => ({ currency: settings.currency, compact: settings.compact_numbers }),
    [settings.currency, settings.compact_numbers],
  )
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

/** Returns a formatter function bound to the user's currency + compact-number preference. */
export function useFormatCurrency() {
  const ctx = useContext(CurrencyContext)
  const currency = ctx?.currency ?? 'USD'
  const compact = ctx?.compact ?? false
  return (amount: number) => formatCurrency(amount, currency, compact)
}
