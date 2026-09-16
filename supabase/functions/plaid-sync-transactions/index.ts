// Pulls new/changed/removed transactions for every bank the authenticated
// user has connected, using Plaid's cursor-based /transactions/sync. Safe to
// call repeatedly -- each item's cursor picks up where the last sync left off.
//
// Self-healing: derives the connected-items list from `accounts` (the
// authoritative source) rather than only `plaid_items`, and backfills a
// missing plaid_items cursor row or missing per-account plaid_account_id
// (both can happen for accounts linked before this function existed).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const PLAID_BASE_URL = Deno.env.get('PLAID_ENV') === 'production'
  ? 'https://production.plaid.com'
  : 'https://sandbox.plaid.com'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

async function decrypt(encoded: string, keyB64: string): Promise<string> {
  const keyBytes = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt'])
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}

type PlaidTxn = {
  transaction_id: string
  account_id: string
  amount: number
  date: string
  name: string
  pending: boolean
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json({ error: 'Missing authorization' }, 401)
  }
  const jwt = authHeader.replace(/^Bearer\s+/i, '')

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  // Pass the JWT explicitly rather than relying on the client's internal
  // session state, which requires the global-header trick to have hydrated
  // a session first -- that hydration proved unreliable in practice.
  const { data: userData, error: userError } = await supabase.auth.getUser(jwt)
  if (userError || !userData.user) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const plaidClientId = Deno.env.get('PLAID_CLIENT_ID')
  const plaidSecret = Deno.env.get('PLAID_SECRET')
  const encryptionKey = Deno.env.get('PLAID_ENCRYPTION_KEY')
  if (!plaidClientId || !plaidSecret || !encryptionKey) {
    return json({ error: 'Plaid is not configured' }, 500)
  }

  // Derive the connected-items list from accounts (authoritative), not
  // plaid_items, since the cursor row may be missing for older connections.
  const { data: linkedAccounts, error: accountsError } = await supabase
    .from('accounts')
    .select('id, name, plaid_item_id, plaid_account_id, plaid_access_token_encrypted')
    .not('plaid_item_id', 'is', null)
  if (accountsError) {
    return json({ error: accountsError.message }, 500)
  }
  const itemIds = [...new Set((linkedAccounts ?? []).map((a) => a.plaid_item_id as string))]
  if (itemIds.length === 0) {
    return json({ success: true, added: 0, modified: 0, removed: 0, message: 'No banks connected yet.' })
  }

  const { data: existingItems } = await supabase.from('plaid_items').select('item_id, cursor')
  const cursorByItemId = new Map((existingItems ?? []).map((i) => [i.item_id, i.cursor as string | null]))

  let totalAdded = 0
  let totalModified = 0
  let totalRemoved = 0

  for (const itemId of itemIds) {
    const itemAccounts = (linkedAccounts ?? []).filter((a) => a.plaid_item_id === itemId)
    const tokenRow = itemAccounts.find((a) => a.plaid_access_token_encrypted)
    if (!tokenRow?.plaid_access_token_encrypted) continue

    const accessToken = await decrypt(tokenRow.plaid_access_token_encrypted, encryptionKey)

    // Backfill plaid_account_id for any account linked before that column
    // was populated, matching Plaid's /accounts/get by account name.
    if (itemAccounts.some((a) => !a.plaid_account_id)) {
      const acctRes = await fetch(`${PLAID_BASE_URL}/accounts/get`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: plaidClientId, secret: plaidSecret, access_token: accessToken }),
      })
      const acctData = await acctRes.json()
      if (acctRes.ok) {
        const plaidIdByName = new Map(
          (acctData.accounts ?? []).map((a: { name: string; account_id: string }) => [a.name, a.account_id]),
        )
        for (const row of itemAccounts) {
          if (row.plaid_account_id) continue
          const plaidAccountId = plaidIdByName.get(row.name)
          if (plaidAccountId) {
            await supabase.from('accounts').update({ plaid_account_id: plaidAccountId }).eq('id', row.id)
            row.plaid_account_id = plaidAccountId
          }
        }
      }
    }

    // Backfill a missing cursor row (item connected before plaid_items existed).
    if (!cursorByItemId.has(itemId)) {
      await supabase.from('plaid_items').insert({ item_id: itemId, user_id: userData.user.id })
      cursorByItemId.set(itemId, null)
    }

    const { data: accountMap } = await supabase
      .from('accounts')
      .select('id, plaid_account_id')
      .eq('plaid_item_id', itemId)
    const accountIdByPlaidId = new Map((accountMap ?? []).map((a) => [a.plaid_account_id, a.id]))

    let cursor: string | null = cursorByItemId.get(itemId) ?? null
    let hasMore = true

    while (hasMore) {
      const syncRes = await fetch(`${PLAID_BASE_URL}/transactions/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: plaidClientId,
          secret: plaidSecret,
          access_token: accessToken,
          cursor: cursor ?? undefined,
        }),
      })
      const syncData = await syncRes.json()
      if (!syncRes.ok) {
        return json({ error: syncData.error_message ?? 'Plaid sync failed' }, 502)
      }

      const added: PlaidTxn[] = syncData.added ?? []
      const modified: PlaidTxn[] = syncData.modified ?? []
      const removed: { transaction_id: string }[] = syncData.removed ?? []

      for (const t of added) {
        const kovoAccountId = accountIdByPlaidId.get(t.account_id)
        if (!kovoAccountId) continue
        const { error } = await supabase.from('transactions').insert({
          user_id: userData.user.id,
          account_id: kovoAccountId,
          category_id: null,
          amount: Math.abs(t.amount),
          // Plaid: positive amount = money out (expense), negative = money in (income).
          type: t.amount >= 0 ? 'expense' : 'income',
          date: t.date,
          description: t.name,
          is_manual: false,
          plaid_transaction_id: t.transaction_id,
        })
        // A unique-constraint conflict just means we've already synced this one.
        if (!error) totalAdded += 1
      }

      for (const t of modified) {
        const kovoAccountId = accountIdByPlaidId.get(t.account_id)
        const { error } = await supabase
          .from('transactions')
          .update({
            amount: Math.abs(t.amount),
            type: t.amount >= 0 ? 'expense' : 'income',
            date: t.date,
            description: t.name,
            account_id: kovoAccountId ?? undefined,
          })
          .eq('plaid_transaction_id', t.transaction_id)
        if (!error) totalModified += 1
      }

      for (const t of removed) {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('plaid_transaction_id', t.transaction_id)
        if (!error) totalRemoved += 1
      }

      cursor = syncData.next_cursor
      hasMore = syncData.has_more
    }

    await supabase
      .from('plaid_items')
      .update({ cursor, updated_at: new Date().toISOString() })
      .eq('item_id', itemId)
  }

  return json({ success: true, added: totalAdded, modified: totalModified, removed: totalRemoved })
})
