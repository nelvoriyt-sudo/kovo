# Kovo

Kovo is a manual personal finance app for variable income. The existing green interface, logo, accounts, investments, ledger, bills, budgets, and goals remain. Home shows one prioritized, deterministic insight; the detailed overview is expandable.

Live site: https://nelvoriyt-sudo.github.io/kovo/

## Features

- Cash/card tips, card availability dates, overnight shifts and saved IANA time zones.
- Integer-cent money calculations, percentage tip-outs and equal pool splits with explicit remainder allocation.
- Daily, weekly, biweekly and manually scheduled irregular income planning. Conservative estimates include zero-income completed periods and exclude incomplete periods.
- Account-scoped durable offline entries, retry-safe backend synchronization, and explicit review when two devices edit the same record.
- Email/password sign-in, verification resend, recovery-link completion, backup export and self-service account deletion.
- Goals and saved rule-based coach history. No external AI, bank connection, tax estimate or money movement is enabled.

## Data and offline use

Signed-in accounts use Supabase as the authoritative store. IndexedDB retains an account-specific cache and pending operations. Local-only mode stays on that browser until explicitly imported into an account. Clearing browser storage can destroy unsynchronized entries; export a backup first.

Existing cloud snapshots are migrated on first use without deleting the original. Previous unscoped device data is offered for explicit import from the account panel. Import adds absent records and preserves differing versions in a recovery archive rather than replacing current cloud entries. Only import data belonging to the signed-in account.

Open the site online once and check the account panel for **Offline app ready** before relying on offline startup. Updates activate after older tabs close. The service worker caches app files only; it does not cache authentication or financial HTTP responses.

## Development and deployment

Use Node 24 and the npm lockfile:

```sh
npm ci
npm test
npm run build
npm run dev
```

The main-branch workflow runs tests and publishes the production build to the existing gh-pages branch. The base path is `/kovo/`. `version.json` identifies the source commit served by Pages. Database migrations and the account deletion function are separate backend releases; see [architecture and release notes](docs/release-notes.md).

## Current release limits

Custom SMTP is not configured: Supabase's default email service restricts recipients and delivery volume. Ordinary-user verification and reset email delivery requires a sender/provider setup and an actual delivery test.

Browser caches and remembered sessions do not have an application-level encryption layer. Supabase transport uses HTTPS and database access is owner-restricted, but this is not a blanket security or regulatory certification. Do not connect bank accounts or treat this MVP as commercially cleared. See the release notes for privacy, retention, cost and remaining prerequisites.
