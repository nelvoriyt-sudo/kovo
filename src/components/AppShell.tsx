import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { AddTransactionModal } from '@/components/AddTransactionModal'
import { KovoLogo } from '@/components/KovoLogo'
import {
  BudgetIcon,
  CalendarIcon,
  DashboardIcon,
  ListIcon,
  MoreIcon,
  PieIcon,
  SettingsIcon,
  TagIcon,
  TrendIcon,
} from '@/components/NavIcons'
import { Button } from '@/components/ui/Button'
import { useEffectiveTheme } from '@/hooks/useEffectiveTheme'
import { useUserSettings } from '@/hooks/useUserSettings'
import { CurrencyProvider } from '@/lib/currencyContext'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true, icon: DashboardIcon },
  { to: '/spending', label: 'Spending', icon: PieIcon },
  { to: '/trends', label: 'Trends', icon: TrendIcon },
  { to: '/budgets', label: 'Budgets', icon: BudgetIcon },
  { to: '/calendar', label: 'Calendar', icon: CalendarIcon },
  { to: '/transactions', label: 'Transactions', icon: ListIcon },
  { to: '/categories', label: 'Categories', icon: TagIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

// The 4 destinations most useful on the go get their own bottom-tab slot on mobile;
// the rest (deeper review/config screens) live under "More".
const TAB_PATHS = ['/', '/calendar', '/transactions', '/spending']
const TAB_ITEMS = TAB_PATHS.map((path) => NAV_ITEMS.find((item) => item.to === path)!)
const MORE_ITEMS = NAV_ITEMS.filter((item) => !TAB_PATHS.includes(item.to))

export function AppShell({ children }: { children: ReactNode }) {
  const [moreOpen, setMoreOpen] = useState(false)
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
                    'flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-paper-dim hover:text-ink',
                    isActive && 'bg-ink text-on-ink hover:bg-ink hover:text-on-ink',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
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
              className="hidden w-auto px-4 md:inline-flex"
              onClick={() => supabase.auth.signOut()}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <CurrencyProvider>
        <main className="mx-auto max-w-5xl px-6 py-10 pb-28 sm:px-10 md:pb-10">{children}</main>
      </CurrencyProvider>

      {/* Bottom tab bar — mobile only, native-app-style navigation */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {TAB_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 touch-manipulation flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-light',
                isActive && 'text-ink',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="More"
          className="flex flex-1 touch-manipulation flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-light"
        >
          <MoreIcon className="h-5 w-5" />
          More
        </button>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="More">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-border bg-surface p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
            <div className="flex flex-col gap-1">
              {MORE_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex touch-manipulation items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium text-ink',
                      isActive && 'bg-paper-dim',
                    )
                  }
                >
                  <item.icon className="h-5 w-5 text-muted" />
                  {item.label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false)
                  supabase.auth.signOut()
                }}
                className="touch-manipulation rounded-lg px-3 py-3 text-left text-[15px] font-medium text-[#a34c3f]"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      <AddTransactionModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={() => {}} />
    </div>
  )
}
