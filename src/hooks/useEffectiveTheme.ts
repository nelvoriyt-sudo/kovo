import { useEffect, useState } from 'react'
import { THEME_STORAGE_KEY, useUserSettings } from './useUserSettings'
import type { Palette, ThemeId } from '@/lib/themes'
import { PALETTES } from '@/lib/themes'

function systemPrefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

/**
 * The theme id actually painted on screen -- 'system' resolved to light or dark,
 * every other value passed straight through.
 */
export function useEffectiveTheme(): Exclude<ThemeId, 'system'> {
  const { settings } = useUserSettings()
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  if (settings.theme === 'system') return systemDark ? 'dark' : 'light'
  return settings.theme
}

/**
 * Paints the resolved theme onto the document and remembers it, so the next
 * load can apply it before React mounts instead of flashing the default.
 */
export function useApplyTheme(theme: Exclude<ThemeId, 'system'>) {
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Private browsing or blocked storage: the theme still applies this session.
    }
  }, [theme])
}

export function usePalette(): Palette | undefined {
  const theme = useEffectiveTheme()
  return PALETTES.find((p) => p.id === theme)
}
