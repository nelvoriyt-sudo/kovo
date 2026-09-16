# Kovo — Project Brief

Personal finance tracker for Jaiden plus a small group of friends and family, replacing an Excel spreadsheet. Main goal is visualization — the data is already tracked fine in Excel, the point is to see it (charts, trends, breakdowns) instead of reading rows of numbers.

Jaiden does not code. Act as lead developer: fix errors you find rather than just reporting them. After finishing a piece of work, report back everything changed and any action needed from Jaiden, then list next steps as a to-do and wait for the go-ahead before starting the next round.

## Stack

* Frontend: React + Vite, hosted on Vercel
* Backend: Supabase (Postgres database, Auth, Edge Functions)
* Bank linking: Plaid — deferred, build around manual entry for now. Design so a `plaid_item_id` / encrypted access token slot drops in later without a rework.
* Supabase project: `kovo`, ref `oowxshubuzigqiabhxmp`, region `us-east-1` (fresh project — the schema below is already applied)
* GitHub repo: github.com/nelvoriyt-sudo/kovo (fresh, empty — this is the first commit)

## Users & security model

* Jaiden + friends/family. Every user sees only their own data — no user-to-user sharing of any kind.
* Login/signup page with Google sign-in (Supabase Auth).
* Row Level Security is enabled on every table, scoped to `auth.uid()`. Never weaken this.
* Full guardrails (follow these on every session, not just once):
  * Never hardcode secrets in source files, commit messages, or comments — Supabase secrets/env vars only.
  * Plaid `client_id`/`secret`: backend secrets manager only, never frontend code or version control.
  * Plaid access tokens: exchanged and stored server-side only, encrypted at rest, scoped to the authenticated user. Never trust a client-supplied user ID — check it against the authenticated session.
  * Any change to auth, authorization, or RLS policies needs to be called out explicitly and explained in plain terms before shipping — don't just say "done."
  * Input validation required on every endpoint accepting user data (amounts, dates, account IDs) — don't rely on client-side validation alone.
  * Never log full account numbers, tokens, or secrets in plaintext, even in error logs.
  * Treat this codebase with more scrutiny than a hobby project — it handles real financial data.

## Design approach (apply to every UI/visual task)

1. Read the brief — infer page kind, audience, vibe before writing code. State a one-line "design read" (e.g. "personal finance dashboard for a trusted small group, calm/trustworthy with real brand personality").
2. Generate reference images first for anything visually significant (new screens, redesigns) — one clear image per section, never a cropped/compressed multi-section board. Analyze the generated image before implementing.
3. Implement, then run the result against Vercel's Web Interface Guidelines (fetch fresh from `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`) before calling a screen done — accessibility, states, interaction quality.
4. Default anti-slop discipline: no AI-purple gradients, no centered-hero-over-dark-mesh, no generic glassmorphism-everywhere, no Inter+slate-900 default. Reach past LLM defaults deliberately.
5. Stack defaults: Tailwind (v4 if starting fresh), shadcn/ui or Radix primitives, Motion (`motion/react`) for animation, Phosphor/Tabler icons (not lucide-react unless already in use).

## Brand

* Name: kovo (lowercase wordmark, geometric sans)
* Icon: abstract wing/"K" mark
* Palette: charcoal (near-black) + warm taupe/tan accent
* Two logo files exist: icon-only mark, and combination mark with wordmark

## Database schema (already applied via migration)

* `profiles` — id (=auth.users id), display_name, avatar_url, created_at
* `user_settings` — user_id (PK), theme (light/dark/system), accent_color, currency, compact_numbers, date_format
* `accounts` — id, user_id, name, type (checking/savings/credit_card/cash/other), current_balance, plaid_item_id (null), plaid_access_token_encrypted (null), is_active
* `categories` — id, user_id, name, type (income/expense), icon, color, is_default. New users get 16 default categories seeded via trigger (12 expense, 4 income) — fully editable/addable/removable per user, not shared across users.
* `budgets` — id, user_id, category_id, amount, period_type (weekly/biweekly/monthly/one_time), period_start, period_end
* `transactions` — id, user_id, account_id, category_id, amount, type (income/expense), date, description, is_manual. This is the single ledger — all income and expense flows through here, feeds every chart.
* `income_schedules` — id, user_id, label, type (pay/tip_out), frequency (weekly/biweekly/semimonthly/monthly/custom), anchor_date, is_active. Recurring rules the user explicitly sets (e.g. "payday every other Friday") — this is what auto-populates future paydays on the calendar. Not a prediction, an explicit rule.
* `income_events` — id, user_id, schedule_id (nullable), type (pay/tip_out/other), date, amount (nullable), account_id, transaction_id (nullable, set once an amount is recorded), note. These are the actual calendar markers (red = pay, green = tip-out in the mockup). Amount is optional — a marker can exist with no dollar figure attached. When an amount is entered, link/create a `transactions` row so it flows into all dashboards automatically — one source of truth.

New-user trigger (`handle_new_user`, `SECURITY DEFINER`, locked `search_path`, execute revoked from `anon`/`authenticated` — only callable via the `auth.users` trigger) creates the profile, default settings, and default categories automatically on signup.

## v1 feature scope

Build in this order:

1. Dashboard / overview (landing page after login) — income vs. spending for current month, surplus/deficit at a glance
2. Spending by category chart — pie or bar, this month. This is the main "visual not numbers" feature — prioritize it.
3. Income vs. expenses over time — line/bar, last 6–12 months
4. Budget vs. actual per category — progress-bar style, visually obvious when near/over limit
5. Pay-period calendar — Google Calendar-style month view. Red marker = pay period, green = tip-out. Never predicts — only shows data the user entered or scheduled via `income_schedules`. Supports a "set pay period" flow that auto-shows upcoming paydays with no dollar amount required. Income entries addable/editable/removable, and link to the dashboard income view and everywhere else income appears.
6. Transaction list — searchable/filterable by category, date, amount. Detail/fallback view, not the main screen.
7. Manual data entry — cash, tips, untracked income. (Plaid import is the future path, not v1.)
8. Settings — theme (light/dark/system), accent color, currency, compact number display.
9. Simple rule-based dashboard insights — e.g. "90% of Groceries budget with 8 days left," computed directly from `budgets`/`transactions`. No AI/LLM call needed for v1. A fuller proactive AI coach may come later but is explicitly out of scope for now.

Explicitly out of scope for v1: investing tracking, multi-currency support, push notifications/alerts, social or sharing features beyond basic multi-user access.

## Legal/compliance to build in as screens ship (not a separate detour)

* Privacy policy + terms of use pages, simple and honest
* Sign-up flow needs an explicit consent checkbox (agree to Privacy Policy / Terms) before account creation
* No cookie consent banner needed unless/until analytics are added (Supabase Auth session cookies are strictly necessary, no banner required) — flag it if that changes
* No refund policy needed — there are no payments
* Accessibility is not optional: alt text, color contrast, keyboard-navigable forms, clear button labels on every screen, checked as part of the Vercel guidelines pass above

## Secrets

Supabase URL, publishable/anon keys, and other frontend-safe config live in `.env.local` (gitignored), never in this file or in source. The service role key never belongs in the frontend — only in Supabase Edge Functions, set via Supabase's own secrets manager.
