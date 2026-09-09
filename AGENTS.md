# Kovo — durable project instructions

These are founder-approved requirements for all future AI coding sessions. Read this file before planning or changing the app. Preserve existing functionality and design unless the request explicitly changes them. The current name is provisional; Kovoa is the leading replacement candidate. Do not rename, redesign the logo, or rebrand without explicit approval. Do not revert unless requested. Publish requested functional changes to the live site after testing and verify deployment. Do not purchase or enable paid services without approval.

## 1. Cross-device synchronization
- Mobile is primary, but a future web/PC dashboard must be another client of the same backend, not a rebuild.
- Backend is the authoritative source for transactions, goals, coach history, and other important data. Local storage is only an offline cache/queue.
- Offline-created entries must synchronize automatically and idempotently; never silently drop or duplicate entries. Use stable client-generated IDs, durable pending operations, conflict handling, and retry-safe writes.

## 2. Offline functionality
- Manual tip and expense entry must work fully without connectivity and sync on reconnection.
- Cache the last-known state so loss of signal never results in a blank or broken app.

## 3. Performance
- Keep the app lightweight and responsive on mid-range and older Android devices.
- Avoid unnecessary heavy animations, bloated dependencies, and slow startup work.

## 4. Cost-conscious engineering
- Cache AI insights instead of regenerating them on every screen open; use triggers and sensible invalidation.
- Avoid unnecessary Plaid requests; synchronize incrementally where supported.
- Assess cost per user at 10, 100, 1,000, and 10,000 users and prevent surprising unbounded usage. Add quotas, budgets, and monitoring where appropriate.

## 5. Compliance enforcement
- The coach must not provide investment advice. Enforce this through a code-level output check before every AI-generated message reaches the user, including cached and newly introduced delivery paths. Do not rely on prompting alone or create bypasses.
- Log coach outputs by default from the beginning, with appropriate access controls, retention limits, and sensitive-data minimization. Do not log secrets or unnecessary raw financial data.
- The business/build brief's regulatory assertions are not legal clearance. Qualified legal review is required before public commercial release; safeguards and disclaimers do not replace it.

## 6. Graceful failure
- Failed/expired bank connections need a clear, calm reconnect flow, never silent failure or alarming generic errors.
- If AI is slow or unavailable, show a cached last insight or a useful fallback without breaking the screen.

## 7. Simplicity
- One clear prioritized insight at a time is a hard product constraint.
- Evaluate each feature against this principle. Cut unnecessary complexity or put detail behind secondary screens rather than cluttering the home screen.

## 8. Maintainability
- Write clean, readable, modular, well-commented code. Avoid obscure patterns and unnecessary dependencies.
- Document architecture, migrations, important decisions, and how future AI sessions can safely modify the system.
- Preserve existing authentication, sync, data, and unrelated functionality across updates. Add tests for critical behavior.

## 9. Money and time correctness
- Handle weekly, biweekly, irregular, and same-day cash pay cycles, including overnight shifts and time zones.
- Use decimal-safe money representations (for example integer minor units or a suitable decimal library); define explicit rounding rules for tip splits, pooled percentages, and allocation remainders. Never rely on careless floating-point rounding.

## 10. Privacy and data lifecycle
- Provide a clear self-service account/data deletion path with a documented retention and deletion policy.
- Encrypt sensitive data at rest and in transit from the beginning. Keep bank tokens and privileged credentials server-side, never in frontend bundles or logs. Use strict per-user authorization and least privilege.
- Do not expose real financial data to other users, public repositories, or test environments.

## Current implementation caution
The existing React/Vite app has used localStorage-centered snapshot synchronization through Supabase. Treat that as technical debt, not as satisfying the requirements above. Before connecting real financial accounts or inviting external users, move to backend-authoritative, revision-safe, idempotent synchronization with a durable offline mutation queue. Preserve existing user data through migrations and test multiple devices, offline recovery, conflict handling, and account isolation. Do not claim a requirement is implemented merely because it is documented here.

## Product direction
A bootstrapped, mobile-first personal finance product beginning with restaurant/service-industry workers and variable/tip income earners, expanding to broader budgeting needs. The differentiator is proactive, memory-driven, non-judgmental coaching that explains why something matters. Tip-specific features and the qualified-tips estimator remain planned; tax and legal claims require verification and appropriate professional review. Keep financial data trustworthy and separate deterministic calculations from AI-generated explanations.
