# Kovo product roadmap

Kovo should feel like calm financial guidance, not a wall of finance metrics.

## Product principles

1. **Attention before analytics.** Lead with what changed, what needs attention, and what the user can do next.
2. **Trust before breadth.** Data integrity, backups, clear calculations, and predictable behavior matter more than adding pages.
3. **Progressive disclosure.** Keep the home experience simple; let users drill into detail when they want it.
4. **Explain the number.** Important totals should be accompanied by the reason they changed.
5. **Mobile first.** The core daily workflow should work comfortably one-handed on a phone.

## v0.2 — solid local-first product

- Reshape Overview into a calm "Today" experience: financial pulse, attention items, upcoming bills, budget risks, and recent activity.
- Add full-data JSON export/import before expanding persistence.
- Improve transaction filtering and editing; prepare category rules and transfer handling.
- Add useful budget pacing/projection instead of only budget-vs-spend totals.
- Add bill timing and cash-flow forecasting.
- Improve empty states, destructive-action confirmation, validation, accessibility, and mobile interactions.
- Break the monolithic App.jsx into pages, components, domain utilities, and persistence modules without changing behavior.
- Add automated tests around net worth, cash flow, category spend, budget pacing, and persistence migrations.

## v0.3 — real accounts and sync

- Authentication and user-scoped backend storage.
- Plaid Link and account synchronization.
- Automatic transaction ingestion and merchant normalization.
- Sync status, refresh state, connection repair, and duplicate/transfer reconciliation.
- Keep manual accounts and manual transactions as first-class features.

## Later — Kovo Intelligence

Intelligence should be embedded into the product rather than presented as a generic chatbot. Examples:

- "Dining is projected to finish $83 over budget this month."
- "Your net worth rose $1,140: investments +$840, debt -$300, cash -$410."
- "Your expected bills before payday total $2,320, leaving about $1,890 available."
- "This recurring charge increased 22% compared with its previous amount."

Recommendations must show the underlying numbers and avoid pretending to know information Kovo does not have.

## Features to avoid for now

- More dashboard cards without a clear user decision attached.
- A generic AI chat tab.
- Social/community features.
- Complex investment trading or stock-picking features.
- Premature gamification that distracts from financial clarity.
