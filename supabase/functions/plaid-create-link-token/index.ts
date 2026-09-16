// Creates a Plaid Link token for the authenticated user. Sandbox only for now
// (PLAID_ENV secret controls which Plaid base URL is used).
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
  // session state (the global-header-only approach proved unreliable).
  const { data: userData, error: userError } = await supabase.auth.getUser(jwt)
  if (userError || !userData.user) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const plaidClientId = Deno.env.get('PLAID_CLIENT_ID')
  const plaidSecret = Deno.env.get('PLAID_SECRET')
  if (!plaidClientId || !plaidSecret) {
    return json({ error: 'Plaid is not configured' }, 500)
  }

  const plaidRes = await fetch(`${PLAID_BASE_URL}/link/token/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: plaidClientId,
      secret: plaidSecret,
      // The authenticated user's id, never a client-supplied value.
      user: { client_user_id: userData.user.id },
      client_name: 'kovo',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    }),
  })

  const plaidData = await plaidRes.json()
  if (!plaidRes.ok) {
    return json({ error: plaidData.error_message ?? 'Plaid request failed' }, 502)
  }

  return json({ link_token: plaidData.link_token })
})
