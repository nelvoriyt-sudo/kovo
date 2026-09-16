import type { ReactNode } from 'react'
import { UserSettingsContext, useUserSettingsState } from '@/hooks/useUserSettings'

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const value = useUserSettingsState()
  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>
}
