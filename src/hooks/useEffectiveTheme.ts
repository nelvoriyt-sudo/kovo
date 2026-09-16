import { useEffect, useState } from 'react'
import { useUserSettings } from './useUserSettings'

export function useEffectiveTheme(): 'light' | 'dark' {
  const { settings } = useUserSettings()
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  )

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  if (settings.theme === 'system') return systemDark ? 'dark' : 'light'
  return settings.theme
}
