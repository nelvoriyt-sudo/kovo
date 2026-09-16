import {
  CalendarBlank,
  ChartPieSlice,
  DotsThreeOutline,
  Gear,
  ListBullets,
  Plus,
  SignOut,
  SquaresFour,
  Tag,
  TrendUp,
  Wallet,
  type Icon,
} from '@phosphor-icons/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { AddTransactionModal } from '@/components/AddTransactionModal'
import { KovoLogo } from '@/components/KovoLogo'
import { UserSettingsProvider } from '@/components/UserSettingsProvider'
import { useEffectiveTheme } from '@/hooks/useEffectiveTheme'
import { useUserSettings } from '@/hooks/useUserSettings'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type NavItem = { to: string; label: string; end?: boolean; icon: Icon }

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', end: true, icon: SquaresFour },
  { to: '/spending', label: 'Spending', icon: ChartPieSlice },
  { to: '/trends', label: 'Trends', icon: TrendUp },
  { to: '/budgets', label: 'Budgets', icon: Wallet },
  { to: '/calendar', label: 'Calendar', icon: CalendarBlank },
  { to: '/transactions', label: 'Transactions', icon: ListBullets },
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/settings', label: 'Settings', icon: Gear },
]

// The 4 destinations most useful on the go get their own bottom-tab slot on mobile;
// the rest (deeper review/config screens) live under "More".
const TAB_PATHS = ['/', '/calendar', '/transactions', '/spending']
const TAB_ITEMS = TAB_PATHS.map((path) => NAV_ITEMS.find((item) => item.to === path)!)
const MORE_ITEMS = NAV_ITEMS.filter((item) => !TAB_PATHS.includes(item.to))

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <UserSettingsProvider>
      <AppShellContent>{children}</AppShellContent>
    </UserSettingsProvider>
  )
}

function AppShellContent({ children }: { children: ReactNode }) {
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
      className={cn('min-h-svh bg-paper text-ink md:flex', theme === 'dark' && 'theme-dark')}
    >
      {/* Sidebar — desktop only. A vertical list scales to any number of
          destinations without the horizontal-overflow problem a top nav has. */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border px-4 py-6 md:flex">
        <div className="px-2">
          <KovoLogo className="h-6 w-auto" />
        </div>

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="mt-6 flex touch-manipulation items-center justify-center gap-2 rounded-[10px] bg-ink px-4 py-2.5 text-sm font-semibold text-on-ink transition-colors hover:bg-ink-light"
        >
          <Plus className="h-4 w-4" weight="bold" />
          Add transaction
        </button>

        <nav aria-label="Primary" className="mt-6 flex flex-1 flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-paper-dim hover:text-ink',
                  isActive && 'bg-paper-dim font-semibold text-ink',
                )
              }
            >
              <item.icon className="h-[18px] w-[18px]" weight="regular" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="flex touch-manipulation items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-paper-dim hover:text-ink"
        >
          <SignOut className="h-[18px] w-[18px]" />
          Sign out
        </button>
      </aside>

      {/* Compact header — mobile only */}
      <header className="border-b border-border md:hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <KovoLogo className="h-6 w-auto" />
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            aria-label="Add transaction"
            className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-full bg-ink text-on-ink"
          >
            <Plus className="h-5 w-5" weight="bold" />
          </button>
        </div>
      </header>

      <main className="min-w-0 flex-1 px-6 py-10 pb-28 sm:px-10 md:pb-10">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>

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
            <item.icon className="h-5 w-5" weight="regular" />
            {item.label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="More"
          className="flex flex-1 touch-manipulation flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-light"
        >
          <DotsThreeOutline className="h-5 w-5" weight="regular" />
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
                  <item.icon className="h-5 w-5 text-muted" weight="regular" />
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
