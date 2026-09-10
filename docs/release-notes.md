# Variable-income MVP release — 2026-09-09

## Scope and source review

Reviewed the supplied coding-standards skill, frontend skill, business plan, build brief, AGENTS.md, existing source and original live UI before implementation. This release preserves the product name, logo, existing pages and existing data. The brief's tax and regulatory assertions are not treated as legal clearance.

## Architecture

- `CloudShell` coordinates auth, account selection, durable saves, imports and synchronization. UI reads its account-specific visible state.
- `storage.js` uses IndexedDB transactions to commit the cache and operation queue atomically. Concurrent local edits are compared before saving.
- `records.js` maps existing datasets to stable records while retaining unknown legacy fields. Deletes remain revisioned tombstones.
- `sync.js` persists operation IDs and exact revisions before network delivery. Lost acknowledgments retry the same receipt. Independent records merge; conflicting changes require a choice, with a recovery export available.
- The backend locks each account for atomic revision checking and operation receipts. RLS and invoker functions restrict records to the authenticated owner. RPC calls also check the expected account before transmission.
- A visible signed-in client checks a small version value once per minute and on reconnection, edits and tab activation. Unchanged caches skip full downloads. Pending operations are sent in bounded batches.
- Money is validated at two decimal places and calculated in integer cents. Percentage rounding is half-up; equal pools allocate residual cents in recipient order. Tip-outs use cash first, then card, as disclosed in the form.
- Shift dates use the saved IANA zone; an end time before the start time advances the end date. These are wall-clock records, not a DST-aware payroll-duration calculator.
- Planning uses completed tracked periods, including zeros, and card availability dates. Estimates are planning aids, not available bank balances.
- Home insights are deterministic rules, saved with source and timestamp. External AI has no execution path in this release.

## Backend release

Applied additive `durable_record_sync` and `sync_version_checks` migrations to the existing Supabase project. Source: `database.sql` and `sync-version.sql`. Original snapshots remain intact. Old snapshot writes are rejected after an account migrates, so an old client cannot overwrite migrated records.

Deployed `supabase/functions/delete-account/index.ts`. The function validates the bearer token with Supabase Auth before using a server-only privileged key, revokes refresh sessions and deletes that same user. Foreign-key cascades delete owned financial rows, operation receipts and migration state. It accepts the existing live site's origin. No privileged key is included in the browser.

Configured Site URL and allowed redirect as `https://nelvoriyt-sudo.github.io/kovo/`, replacing the previous localhost callback. Verification and reset links now return to the correct app, which validates the token and completes password recovery.

## Verification

- Automated auth and core tests cover refresh failures, account switching, recovery callbacks, exact money, dates, conservative planning, migration shape, tombstones, concurrent devices/tabs, account isolation, offline persistence and lost acknowledgments.
- Transactional backend tests cover old snapshot migration, RLS isolation, atomic revision conflicts, replay receipts and deletion tombstones.
- A disposable account exercised real password sign-in, two sessions, a $42.75 record, operation replay, conflicting revisions, password update, and account deletion. The synthetic account was removed; real user records were not changed.
- Dependency audit reported zero vulnerabilities after updating build tooling. Production build succeeds; the existing chart dependency still produces a bundle-size advisory.
- Browser checks cover tip entry, pool calculations, ledger persistence, income planning, and no horizontal overflow at 320, 375, 390, 768 and 1440 pixels.
- All 19 automated tests pass, including an isolated production service-worker test that excludes private APIs. A browser test with the local server stopped verified cached startup, a $42.75 cash tip, a $12.35 expense and both entries surviving reload. A cache header-variation defect found during this test was fixed. Real-phone acceptance remains useful for device-specific behavior.

## Privacy and retention

Account deletion removes active owned backend data and this browser's account cache. Other devices' offline caches, exported files and original local-only archives cannot be remotely erased by this static app. Backups retained by the hosting provider follow that provider's retention policy; no immediate physical-erasure claim is made.

Legacy snapshots, conflict archives, tombstones and retry receipts are intentionally retained to prevent loss and replay. Coach history currently remains until account deletion; a bounded retention policy and safe receipt compaction remain engineering work before wider release. Browser storage uses browser/device protections rather than application-level encryption. Do not claim all at-rest encryption requirements are satisfied.

## Cost and launch gates

No paid plan, external AI, Plaid connection or real-money capability was enabled. Baseline version checks for 10 / 100 / 1,000 / 10,000 simultaneously visible clients are approximately 600 / 6,000 / 60,000 / 600,000 per active hour, plus writes and changed-record reads. This is workload arithmetic, not a dollar-price or free-tier capacity guarantee. Growing receipts/history need monitoring and retention work before scale.

Remaining prerequisites:

1. SMTP sender/provider setup and successful real inbox verification/recovery tests. Default Supabase email is restricted; do not disable verification as a workaround.
2. Real-phone airplane-mode/reopen and two-device acceptance testing after deployment.
3. A stronger device-cache encryption/key-management design, bounded retention, operational monitoring and scale testing before broader financial-data use.
4. For future external AI: approved credentials/cost limits, server-only integration, output checks on every delivery path, cached fallbacks and controlled logging. For Plaid: appropriate credentials/environment, secure server token storage and lifecycle handling. Neither is presented as connected.
5. Qualified legal review before commercial release; no tax qualification or AI compliance certification is implemented or claimed.
