import type { ReactNode } from 'react'
import { KovoLogo } from './KovoLogo'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh w-full bg-paper">
      <div className="relative hidden w-[480px] shrink-0 flex-col justify-between overflow-hidden bg-ink p-14 lg:flex xl:w-[560px]">
        <svg
          viewBox="0 0 560 900"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <circle cx="480" cy="120" r="220" fill="none" stroke="#c9a27c" strokeOpacity="0.14" />
          <circle cx="480" cy="120" r="300" fill="none" stroke="#c9a27c" strokeOpacity="0.09" />
          <line x1="0" y1="700" x2="560" y2="560" stroke="#c9a27c" strokeOpacity="0.1" />
          <line x1="0" y1="780" x2="560" y2="640" stroke="#c9a27c" strokeOpacity="0.1" />
        </svg>

        <div className="relative">
          <span className="font-display text-xl font-semibold tracking-wide text-paper-dim">
            kovo
          </span>
        </div>

        <div className="relative">
          <p className="mb-4 max-w-[400px] font-display text-3xl font-semibold leading-snug text-paper-dim">
            See your money move, not just where it went.
          </p>
          <p className="max-w-[360px] text-[15px] leading-relaxed text-[#b3aa9f]">
            Kovo turns your spreadsheet into a picture — spending, income, and budgets, at a
            glance.
          </p>
        </div>

        <p className="relative text-sm text-[#79726a]">A private ledger for you and yours.</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 lg:hidden">
            <KovoLogo className="h-6 w-auto" />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
