import { KovoLogo } from '@/components/KovoLogo'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export function DashboardPage() {
  const { user } = useAuth()
  const name =
    (user?.user_metadata as { display_name?: string; full_name?: string } | undefined)
      ?.display_name ??
    (user?.user_metadata as { full_name?: string } | undefined)?.full_name ??
    user?.email

  return (
    <div className="min-h-svh bg-paper">
      <header className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-10">
        <KovoLogo className="h-6 w-auto" />
        <Button
          type="button"
          variant="secondary"
          className="w-auto px-4"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </Button>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16 text-center sm:px-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Welcome, {name}.</h1>
        <p className="mt-2 text-[15px] text-muted">
          Your dashboard — spending charts, budgets, and the pay-period calendar — is coming next.
        </p>
      </main>
    </div>
  )
}
