# Mobile and desktop compatibility

Kovo must support phone, tablet, and desktop browsers without horizontal page overflow, clipped forms, or inaccessible navigation. Keep the existing React application and local data intact. Use responsive layouts, safe-area-aware mobile navigation, readable inputs, and touch-friendly controls. Test at 320, 375, 390, 768, and 1440 CSS pixels before release.

## Cross-device persistence

Browser localStorage is device-specific and is not synchronization. Cloud sync requires an authenticated user, a private user-scoped database, and an explicit migration of existing browser data. Never embed service-role keys or bank credentials in the frontend. Never silently replace local data with sample data or overwrite a newer cloud record. Offer a backup and an import/reconciliation flow when local and remote data differ. All writes must be associated with the authenticated user, protected by row-level security, and durable before reporting success. Display offline and sync-error states. Keep manual entry available without a bank connection.

Use a free-tier backend only, with no paid upgrade or billable infrastructure without explicit user approval. Supabase is the intended provider. The provider project and public URL/anon key must be configured before enabling cloud synchronization. Do not claim sync is active until two-device round-trip tests pass. Plaid requires a separate secure backend and is not part of this mobile fix.
