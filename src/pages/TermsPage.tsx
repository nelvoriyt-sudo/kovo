import { LegalLayout } from '@/components/LegalLayout'

export function TermsPage() {
  return (
    <LegalLayout title="Terms of Use">
      <p className="text-xs text-muted">
        Draft — last updated {new Date().toISOString().slice(0, 10)}. Review and personalize this
        before sharing kovo with anyone.
      </p>

      <p>
        kovo is a small, invite-only tool for tracking personal finances. By using it, you agree
        to the following:
      </p>

      <h2 className="font-display text-lg font-semibold text-ink">The basics</h2>
      <p>
        kovo is provided as-is, for personal use by people invited to use it. It's not a bank, a
        licensed financial service, or a source of financial advice — it's a way to visualize data
        you enter yourself.
      </p>

      <h2 className="font-display text-lg font-semibold text-ink">Your responsibilities</h2>
      <p>
        Keep your login credentials to yourself, enter your own financial data accurately, and use
        the app only for its intended purpose of tracking your own personal finances.
      </p>

      <h2 className="font-display text-lg font-semibold text-ink">No guarantees</h2>
      <p>
        Charts, budgets, and insights are calculated directly from the data you enter. We don't
        guarantee the app is error-free or available at all times, and we're not liable for
        financial decisions made based on it.
      </p>

      <h2 className="font-display text-lg font-semibold text-ink">Changes</h2>
      <p>
        These terms may change as kovo grows. Meaningful changes will be reflected here with an
        updated date.
      </p>
    </LegalLayout>
  )
}
