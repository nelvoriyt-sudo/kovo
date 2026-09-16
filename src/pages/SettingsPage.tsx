import { Link } from 'react-router-dom'
import { PlaidConnectButton } from '@/components/PlaidConnectButton'
import { PlaidSyncButton } from '@/components/PlaidSyncButton'
import { ThemeSwatch } from '@/components/ThemeSwatch'
import { Select } from '@/components/ui/Select'
import { useAccounts } from '@/hooks/useAccounts'
import { useUserSettings } from '@/hooks/useUserSettings'
import { BASE_MODES, PALETTES } from '@/lib/themes'
import { cn } from '@/lib/utils'

const CURRENCIES = ['USD', 'CAD', 'EUR', 'GBP', 'AUD']
const DATE_FORMATS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']

function SectionLabel({ children }: { children: string }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">{children}</h2>
  )
}

export function SettingsPage() {
  const { settings, updateSettings } = useUserSettings()
  const { accounts, loading: accountsLoading, refresh: refreshAccounts } = useAccounts()

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-[30px] font-semibold tracking-[-0.025em] text-ink">
        Settings
      </h1>
      <p className="mt-1 text-[15px] text-muted">How kovo looks, and where its numbers come from.</p>

      <div className="mt-9 flex flex-col gap-10">
        <section>
          <SectionLabel>Appearance</SectionLabel>
          <p className="mt-1.5 text-[13px] text-muted">
            Start from light or dark, or pick a palette — it repaints the whole app.
          </p>

          <div className="mt-3 inline-flex gap-0.5 rounded-[5px] bg-raise p-[3px]">
            {BASE_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => updateSettings({ theme: m.id })}
                aria-pressed={settings.theme === m.id}
                className={cn(
                  'touch-manipulation rounded-[3px] px-[18px] py-[7px] text-[13px] transition-colors duration-150',
                  settings.theme === m.id
                    ? 'bg-accent font-semibold text-on-accent'
                    : 'font-medium text-muted hover:text-ink',
                )}
              >
                {m.name}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {PALETTES.map((p) => (
              <ThemeSwatch
                key={p.id}
                palette={p}
                selected={settings.theme === p.id}
                onSelect={() => updateSettings({ theme: p.id })}
              />
            ))}
          </div>
        </section>

        <section>
          <SectionLabel>Bank accounts</SectionLabel>
          <p className="mt-1.5 text-[13px] text-muted">
            Connect a bank to import accounts and transactions. Sandbox mode — no real bank data.
          </p>

          {!accountsLoading && accounts.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1.5">
              {accounts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-[4px] border border-line bg-surface px-3.5 py-2.5 text-sm"
                >
                  <span className="min-w-0 truncate font-medium text-ink">{a.name}</span>
                  {a.plaid_item_id && (
                    <span className="shrink-0 rounded-full bg-raise px-2 py-0.5 text-[11px] font-semibold text-muted">
                      Connected
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <PlaidConnectButton onLinked={refreshAccounts} />
            {accounts.some((a) => a.plaid_item_id) && <PlaidSyncButton />}
          </div>
        </section>

        <section className="grid gap-5 sm:grid-cols-2">
          <div>
            <SectionLabel>Currency</SectionLabel>
            <Select
              className="mt-2"
              value={settings.currency}
              onChange={(e) => updateSettings({ currency: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <SectionLabel>Date format</SectionLabel>
            <Select
              className="mt-2"
              value={settings.date_format}
              onChange={(e) => updateSettings({ date_format: e.target.value })}
            >
              {DATE_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
          </div>
        </section>

        <section className="flex items-center justify-between gap-6">
          <div>
            <SectionLabel>Compact numbers</SectionLabel>
            <p className="mt-1.5 text-[13px] text-muted">Show $1.2K instead of $1,200.00</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.compact_numbers}
            aria-label="Compact numbers"
            onClick={() => updateSettings({ compact_numbers: !settings.compact_numbers })}
            className={cn(
              'relative h-7 w-12 shrink-0 touch-manipulation rounded-full transition-colors duration-150',
              settings.compact_numbers ? 'bg-accent' : 'bg-raise',
            )}
          >
            <span
              className={cn(
                'absolute top-1 h-5 w-5 rounded-full transition-transform duration-200 ease-out',
                settings.compact_numbers
                  ? 'translate-x-6 bg-on-accent'
                  : 'translate-x-1 bg-surface',
              )}
            />
          </button>
        </section>

        <section>
          <SectionLabel>Categories</SectionLabel>
          <p className="mt-1.5 text-[13px] text-muted">Rename, recolor, add, or remove categories.</p>
          <Link
            to="/categories"
            className="mt-2 inline-block text-[14px] font-semibold text-accent hover:underline"
          >
            Manage categories →
          </Link>
        </section>
      </div>
    </div>
  )
}
