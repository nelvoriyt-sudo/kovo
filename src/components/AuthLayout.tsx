import type { ReactNode } from 'react'
import { KovoLogo } from './KovoLogo'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh w-full bg-canvas">
      <div className="relative hidden w-[46%] max-w-[620px] shrink-0 flex-col justify-between overflow-hidden bg-accent p-12 text-on-accent lg:flex">
        <KovoLogo tone="accent" className="relative h-[22px] w-auto" />

        <div className="relative">
          <p className="max-w-[15ch] font-display text-[40px] font-semibold leading-[1.08] tracking-[-0.03em]">
            Your money, finally in focus.
          </p>
          <p className="mt-4 max-w-[34ch] text-[15px] leading-relaxed text-on-accent/80">
            Every account, every category, one picture — built for the handful of people you
            actually share a budget with.
          </p>
        </div>

        <p className="relative text-[13.5px] text-on-accent/70">
          A private ledger for you and yours.
        </p>

        {/* The split-disc brand device, the same motif as the palette swatches. */}
        <svg
          viewBox="0 0 100 100"
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 h-[360px] w-[360px] opacity-[0.16]"
        >
          <defs>
            <clipPath id="auth-disc-a">
              <path d="M-10,-10 L110,-10 L110,110 Z" />
            </clipPath>
            <clipPath id="auth-disc-b">
              <path d="M-10,-10 L-10,110 L110,110 Z" />
            </clipPath>
          </defs>
          <circle cx="53" cy="47" r="46" fill="currentColor" clipPath="url(#auth-disc-a)" />
          <circle
            cx="47"
            cy="53"
            r="46"
            fill="currentColor"
            opacity="0.45"
            clipPath="url(#auth-disc-b)"
          />
        </svg>
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
