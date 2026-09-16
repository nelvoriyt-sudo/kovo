import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { AddTransactionModal } from '@/components/AddTransactionModal'
import { KovoLogo } from '@/components/KovoLogo'
import { Button } from '@/components/ui/Button'
import { useEffectiveTheme } from '@/hooks/useEffectiveTheme'
import { useUserSettings } from '@/hooks/useUserSettings'
import { CurrencyProvider } from '@/lib/currencyContext'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/spending', label: 'Spending' },
  { to: '/trends', label: 'Trends' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/settings', label: 'Settings' },
]

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const theme = useEffectiveTheme()
  const { settings } = useUserSettings()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    rootRef.current?.style.setProperty('--color-tan', settings.accent_color)
  }, [settings.accent_color])

  return (
    <div
      ref={rootRef}
      className={cn('min-h-svh bg-paper text-ink', theme === 'dark' && 'theme-dark')}
    >
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 sm:px-10">
          <KovoLogo className="h-6 w-auto" />

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-paper-dim hover:text-ink',
                    isActive && 'bg-ink text-on-ink hover:bg-ink hover:text-on-ink',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button type="button" className="w-auto px-4" onClick={() => setAddOpen(true)}>
              + Add
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="hidden w-auto px-4 sm:inline-flex"
              onClick={() => supabase.auth.signOut()}
            >
              Sign out
            </Button>
            <button
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="touch-manipulation rounded-lg p-2 text-ink md:hidden"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                {menuOpen ? (
                  <path
                    d="M5 5L17 17M17 5L5 17"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M3 6H19M3 11H19M3 16H19"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="flex flex-col gap-1 border-t border-border px-6 py-3 md:hidden">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'touch-manipulation rounded-lg px-3 py-2.5 text-[15px] font-medium text-muted',
                    isActive && 'bg-paper-dim text-ink',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="touch-manipulation rounded-lg px-3 py-2.5 text-left text-[15px] font-medium text-muted"
            >
              Sign out
            </button>
          </nav>
        )}
      </header>

      <CurrencyProvider>
        <main className="mx-auto max-w-5xl px-6 py-10 sm:px-10">{children}</main>
      </CurrencyProvider>

      <AddTransactionModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={() => {}} />
    </div>
  )
}
