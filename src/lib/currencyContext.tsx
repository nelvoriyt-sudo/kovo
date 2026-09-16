import { useUserSettings } from '@/hooks/useUserSettings'
import { formatCurrency } from './currency'

/** Returns a formatter function bound to the user's currency + compact-number preference. */
export function useFormatCurrency() {
  const { settings } = useUserSettings()
  return (amount: number) => formatCurrency(amount, settings.currency, settings.compact_numbers)
}
