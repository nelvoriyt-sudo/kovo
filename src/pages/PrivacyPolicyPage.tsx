import { LegalLayout } from '@/components/LegalLayout'

export function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <p className="text-xs text-muted-light">
        Draft — last updated {new Date().toISOString().slice(0, 10)}. Review and personalize this
        before sharing kovo with anyone.
      </p>

      <p>
        kovo is a personal finance tracker built for a small, invited group of people. This page
        explains what we collect and how it's used, in plain language.
      </p>

      <h2 className="font-display text-lg font-semibold text-ink">What we collect</h2>
      <p>
        When you sign up, we store your email address, display name, and (if you sign in with
        Google) the basic profile info Google shares with us. Everything else — your accounts,
        transactions, budgets, categories, and pay schedules — is data you enter yourself.
      </p>

      <h2 className="font-display text-lg font-semibold text-ink">Who can see your data</h2>
      <p>
        Only you. Every table in our database enforces row-level security, so your account can
        only ever read or change rows that belong to you — not another user's, even though we all
        share the same app. There is no sharing or social feature of any kind.
      </p>

      <h2 className="font-display text-lg font-semibold text-ink">How we use it</h2>
      <p>
        Solely to run the app: to show you your own dashboards, charts, and calendar, and to keep
        your account secure. We don't sell your data, use it for advertising, or share it with
        third parties beyond the infrastructure providers that host the app (currently Supabase
        for the database and authentication, and Vercel for hosting).
      </p>

      <h2 className="font-display text-lg font-semibold text-ink">Third-party services</h2>
      <p>
        Beyond Supabase and Vercel, kovo loads typefaces from Google Fonts and, if you choose it,
        uses Google Sign-In for authentication. Both involve your browser talking directly to
        Google. We don't embed any ads, analytics, or tracking scripts.
      </p>

      <h2 className="font-display text-lg font-semibold text-ink">Bank connections</h2>
      <p>
        kovo does not currently connect to any bank accounts. If bank-linking (via Plaid) is added
        in the future, this policy will be updated first, and connecting a bank will always be
        optional.
      </p>

      <h2 className="font-display text-lg font-semibold text-ink">Cookies</h2>
      <p>
        We use only the session cookies needed to keep you signed in. We don't use tracking or
        advertising cookies.
      </p>

      <h2 className="font-display text-lg font-semibold text-ink">Your data, your control</h2>
      <p>
        You can edit or delete any of your entries in the app at any time. To delete your account
        entirely, contact whoever invited you to kovo.
      </p>

      <h2 className="font-display text-lg font-semibold text-ink">Questions</h2>
      <p>Reach out to the person who set up your kovo account if you have questions about this policy.</p>
    </LegalLayout>
  )
}
