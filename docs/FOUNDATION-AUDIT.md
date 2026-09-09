# Kovo foundation audit

Reviewed against AGENTS.md and the coding-standards skill on 2026-09-08. This is an engineering audit, not a certification of production readiness.

## Critical findings

1. `src/main.jsx` synchronizes the entire `kovo-finance-data-v2` localStorage snapshot using timestamps. Concurrent devices can overwrite one another, and a pull can discard unuploaded changes. Full-page reloads are also used for remote updates.
2. `src/lib/cloud.js` bypasses the existing revision-aware `kovo_save` RPC and uses a direct REST upsert. Authentication refresh errors are treated as sign-out, including temporary network failures. Expiry handling is not reliable for sessions using `expires_in` without `expires_at`.
3. `src/App.jsx` treats localStorage as the primary database. Writes are delayed and errors are ignored. A new account receives sample balances, transactions and investments. This must not be mistaken for real data.
4. The legacy account-independent storage key can mix cached data when different users sign into the same browser. Account switching and migration need explicit isolation and preservation.
5. The application has no automated test suite or CI test gate. The main component is monolithic and duplicates financial utilities already present in `src/lib/finance.js`.
6. Financial amounts are accepted through Number without sufficient validation; random IDs use Math.random; dates are derived from UTC rather than the user's shift timezone. Tip splits and irregular pay cycles are not modeled.
7. The login UI has no working password recovery, resend-confirmation or verification callback handling. The actual delivery failure also requires custom SMTP configuration in Supabase; frontend code alone cannot fix it.
8. README and Settings contain obsolete claims that data never leaves the browser/chat. The reset action is destructive, with no integrated export/recovery path.
9. The frontend is hosted on GitHub Pages and the repo is public. No privileged keys are currently needed in the browser, but future Plaid and AI credentials must stay server-side. No production Plaid or AI integration exists in the reviewed code.
10. Existing charts, navigation and feature implementations should be retained. Styling is split between an embedded stylesheet and overriding CSS, creating maintenance risk. Do not perform a visual overhaul as part of this work.

## Migration and release requirements

- Preserve the old database snapshot and user data until verified migration. Never reset existing accounts or silently seed fictional money into an empty real account.
- Introduce stable record IDs, server-side authorization, durable offline operations and idempotency. Acknowledged operations must never be replayed as new entries.
- A device must not overwrite another device's unrelated edits. Conflicts need deterministic resolution or explicit user action, not last-write-wins silence.
- Cache and pending operations must be scoped to the authenticated user. Account changes must not upload another user's cache.
- Add automated tests for money arithmetic, offline replay, conflicts, account isolation, migration and authentication recovery. Run tests and build before publishing.
- Keep all existing branding, visual styling and legacy records intact. Do not enable paid infrastructure or real bank connections without the founder's approval.

## External dependencies

Custom SMTP requires verified sender ownership and private credentials. Supabase authentication configuration is not exposed by the currently connected project-management actions. Do not claim delivery is fixed until configuration and an actual inbox test succeed. Tax eligibility logic requires verified current law and appropriate professional review. The AI coach is not yet implemented; do not expose unfiltered model output as a substitute for a compliant service.
