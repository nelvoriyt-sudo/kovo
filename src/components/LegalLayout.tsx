import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { KovoLogo } from './KovoLogo'

export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-svh bg-canvas">
      <header className="border-b border-line px-6 py-4 sm:px-10">
        <Link to="/" className="inline-block w-fit">
          <KovoLogo className="h-6 w-auto" />
        </Link>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-14 sm:px-10">
        <h1 className="font-display text-3xl font-semibold text-ink">{title}</h1>
        <div className="prose-legal mt-8 flex flex-col gap-5 text-[15px] leading-relaxed text-muted">
          {children}
        </div>
        <Link
          to="/login"
          className="mt-12 inline-block text-sm font-semibold text-accent hover:text-accent"
        >
          ← Back to sign in
        </Link>
      </main>
    </div>
  )
}
