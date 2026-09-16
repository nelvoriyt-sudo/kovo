// Exchanges a Plaid Link public_token for a permanent access_token, encrypts
// it (AES-256-GCM, key held only in this function's env -- never in the
// database), and creates a kovo account row per linked bank account.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const PLAID_BASE_URL = Deno.env.get('PLAID_ENV') === 'production'
  ? 'https://production.plaid.com'
  : 'https://sandbox.plaid.com'

async function encrypt(plaintext: string, keyB64: string): Promise<string> {
  const keyBytes = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return btoa(String.fromCharCode(...combined))
}

const PLAID_TYPE_MAP: Record<string, string> = {
  depository: 'checking',
  credit: 'credit_card',
  loan: 'other',
  investment: 'other',
}

type PlaidAccount = {
  account_id: string
  name: string
  type: string
  subtype: string | null
  balances: { current: number | null }
}

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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const body = await req.json().catch(() => null)
  const publicToken = body?.public_token
  if (typeof publicToken !== 'string' || !publicToken) {
    return json({ error: 'Missing public_token' }, 400)
  }

  const plaidClientId = Deno.env.get('PLAID_CLIENT_ID')
  const plaidSecret = Deno.env.get('PLAID_SECRET')
  const encryptionKey = Deno.env.get('PLAID_ENCRYPTION_KEY')
  if (!plaidClientId || !plaidSecret || !encryptionKey) {
    return json({ error: 'Plaid is not configured' }, 500)
  }

  const exchangeRes = await fetch(`${PLAID_BASE_URL}/item/public_token/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: plaidClientId, secret: plaidSecret, public_token: publicToken }),
  })
  const exchangeData = await exchangeRes.json()
  if (!exchangeRes.ok) {
    return json({ error: exchangeData.error_message ?? 'Plaid exchange failed' }, 502)
  }

  const accessToken: string = exchangeData.access_token
  const itemId: string = exchangeData.item_id

  const accountsRes = await fetch(`${PLAID_BASE_URL}/accounts/get`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: plaidClientId, secret: plaidSecret, access_token: accessToken }),
  })
  const accountsData = await accountsRes.json()
  if (!accountsRes.ok) {
    return json({ error: accountsData.error_message ?? 'Plaid accounts fetch failed' }, 502)
  }

  const encryptedToken = await encrypt(accessToken, encryptionKey)

  const plaidAccounts: PlaidAccount[] = accountsData.accounts ?? []
  const rows = plaidAccounts.map((a) => ({
    user_id: userData.user.id,
    name: a.name,
    type: a.subtype === 'savings' ? 'savings' : (PLAID_TYPE_MAP[a.type] ?? 'other'),
    current_balance: a.balances.current ?? 0,
    plaid_item_id: itemId,
    plaid_account_id: a.account_id,
    plaid_access_token_encrypted: encryptedToken,
  }))

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from('accounts').insert(rows)
    if (insertError) {
      return json({ error: insertError.message }, 500)
    }
  }

  // Tracks the incremental sync cursor for this item; plaid-sync-transactions
  // reads/updates this row on every sync.
  const { error: itemInsertError } = await supabase
    .from('plaid_items')
    .insert({ item_id: itemId, user_id: userData.user.id })
  if (itemInsertError) {
    return json({ error: itemInsertError.message }, 500)
  }

  return json({ success: true, accounts_linked: rows.length })
})
