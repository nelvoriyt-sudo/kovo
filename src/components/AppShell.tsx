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
import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { AddTransactionModal } from '@/components/AddTransactionModal'
import { KovoLogo } from '@/components/KovoLogo'
import { UserSettingsProvider } from '@/components/UserSettingsProvider'
import { useApplyTheme, useEffectiveTheme } from '@/hooks/useEffectiveTheme'
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

// The four destinations most useful on the go get their own bottom-tab slot;
// the rest live under "More".
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
  useApplyTheme(useEffectiveTheme())

  return (
    <div className="min-h-svh bg-canvas text-ink md:flex">
      {/* The rail is a solid block of the palette accent. Switching palette
          repaints the whole navigation, not just a small swatch somewhere. */}
      <aside className="hidden w-[236px] shrink-0 flex-col gap-6 bg-accent px-4 pt-6 pb-5 text-on-accent md:flex">
        <div className="px-2.5">
          <KovoLogo tone="accent" className="h-[22px] w-auto" />
        </div>

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex h-[42px] w-full touch-manipulation items-center justify-center gap-2 whitespace-nowrap rounded-[4px] bg-on-accent text-[13.5px] font-semibold text-accent transition-[transform,filter] duration-150 ease-out hover:-translate-y-px hover:brightness-95"
        >
          <Plus className="h-4 w-4" weight="bold" />
          Add transaction
        </button>

        <nav aria-label="Primary" className="flex flex-1 flex-col gap-px">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-[11px] rounded-[4px] px-2.5 py-2.5 text-sm font-medium transition-colors duration-150 ease-out',
                  isActive
                    ? 'bg-on-accent font-semibold text-accent'
                    : 'text-on-accent/75 hover:bg-on-accent/10 hover:text-on-accent',
                )
              }
            >
              <item.icon className="h-[17px] w-[17px] shrink-0" weight="regular" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="flex touch-manipulation items-center gap-[11px] rounded-[4px] px-2.5 py-2.5 text-sm font-medium text-on-accent/70 transition-colors duration-150 ease-out hover:bg-on-accent/10 hover:text-on-accent"
        >
          <SignOut className="h-[17px] w-[17px]" />
          Sign out
        </button>
      </aside>

      {/* Compact header — mobile only */}
      <header className="bg-accent text-on-accent md:hidden">
        <div className="flex items-center justify-between px-5 py-3.5">
          <KovoLogo tone="accent" className="h-[21px] w-auto" />
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            aria-label="Add transaction"
            className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-full bg-on-accent text-accent"
          >
            <Plus className="h-5 w-5" weight="bold" />
          </button>
        </div>
      </header>

      <main className="min-w-0 flex-1 px-5 py-8 pb-28 sm:px-8 md:px-11 md:py-10 md:pb-16">
        <div className="mx-auto max-w-[1080px]">{children}</div>
      </main>

      {/* Bottom tab bar — mobile only */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {TAB_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 touch-manipulation flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                isActive ? 'text-accent' : 'text-muted',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="h-5 w-5" weight={isActive ? 'fill' : 'regular'} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="More"
          className="flex flex-1 touch-manipulation flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted"
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
            className="absolute inset-0 bg-ink/50"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[10px] border-t border-line bg-surface p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
            <div className="flex flex-col gap-1">
              {MORE_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex touch-manipulation items-center gap-3 rounded-[4px] px-3 py-3 text-[15px] font-medium text-ink',
                      isActive && 'bg-raise',
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
                className="touch-manipulation rounded-[4px] px-3 py-3 text-left text-[15px] font-medium text-neg"
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
