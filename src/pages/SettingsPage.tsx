import { Link } from 'react-router-dom'
import { PlaidConnectButton } from '@/components/PlaidConnectButton'
import { PlaidSyncButton } from '@/components/PlaidSyncButton'
import { Select } from '@/components/ui/Select'
import { useAccounts } from '@/hooks/useAccounts'
import { useUserSettings } from '@/hooks/useUserSettings'
import { cn } from '@/lib/utils'

const ACCENT_SWATCHES = ['#8A7A6D', '#a3775a', '#5b7a94', '#4d7358', '#9c6b8f', '#b08c3f']

const CURRENCIES = ['USD', 'CAD', 'EUR', 'GBP', 'AUD']
const DATE_FORMATS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']

export function SettingsPage() {
  const { settings, updateSettings } = useUserSettings()
  const { accounts, loading: accountsLoading, refresh: refreshAccounts } = useAccounts()

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-semibold text-ink">Settings</h1>
      <p className="mt-1 text-[15px] text-muted">Personalize how kovo looks and formats numbers.</p>

      <div className="mt-8 flex flex-col gap-7">
        <section>
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-light">
            Bank accounts
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            Connect a bank to import accounts automatically. Sandbox mode — no real bank data.
          </p>

          {!accountsLoading && accounts.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {accounts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"
                >
                  <span className="font-medium text-ink">{a.name}</span>
                  {a.plaid_item_id && (
                    <span className="rounded-full bg-highlight px-2 py-0.5 text-[11px] font-semibold text-highlight-text">
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

        <section>
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-light">Theme</h2>
          <div className="mt-2 flex gap-2 rounded-[10px] bg-paper-dim p-1">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => updateSettings({ theme: t })}
                className={cn(
                  'flex-1 touch-manipulation rounded-lg py-2 text-sm font-semibold capitalize transition-colors',
                  settings.theme === t ? 'bg-ink text-on-ink' : 'text-muted hover:text-ink',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-light">Accent color</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {ACCENT_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Use ${color} as accent color`}
                onClick={() => updateSettings({ accent_color: color })}
                className={cn(
                  'h-9 w-9 touch-manipulation rounded-full border-2 transition-transform',
                  settings.accent_color === color ? 'scale-110 border-ink' : 'border-transparent',
                )}
                style={{ backgroundColor: color }}
              />
            ))}
            <label className="relative flex h-9 w-9 touch-manipulation items-center justify-center rounded-full border border-dashed border-border text-muted-light has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-tan-dark has-[:focus-visible]:ring-offset-2">
              <span aria-hidden="true" className="text-lg leading-none">+</span>
              <span className="sr-only">Pick a custom accent color</span>
              <input
                type="color"
                value={settings.accent_color}
                onChange={(e) => updateSettings({ accent_color: e.target.value })}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
          </div>
        </section>

        <section>
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-light">Currency</h2>
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
        </section>

        <section>
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-light">Date format</h2>
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
        </section>

        <section className="flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-light">
              Compact numbers
            </h2>
            <p className="mt-1 text-[13px] text-muted">Show $1.2K instead of $1,200.00</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.compact_numbers}
            onClick={() => updateSettings({ compact_numbers: !settings.compact_numbers })}
            className={cn(
              'relative h-7 w-12 touch-manipulation rounded-full transition-colors',
              settings.compact_numbers ? 'bg-ink' : 'bg-paper-dim',
            )}
          >
            <span
              className={cn(
                'absolute top-1 h-5 w-5 rounded-full bg-surface shadow-sm transition-transform',
                settings.compact_numbers ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
        </section>

        <section>
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-light">Categories</h2>
          <p className="mt-1 text-[13px] text-muted">Rename, recolor, add, or remove categories.</p>
          <Link
            to="/categories"
            className="mt-2 inline-block text-[14px] font-semibold text-tan-dark hover:text-tan-darker"
          >
            Manage categories →
          </Link>
        </section>
      </div>
    </div>
  )
}
