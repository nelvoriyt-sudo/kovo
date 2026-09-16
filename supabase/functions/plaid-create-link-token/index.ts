// Creates a Plaid Link token for the authenticated user. Sandbox only for now
// (PLAID_ENV secret controls which Plaid base URL is used).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const PLAID_BASE_URL = Deno.env.get('PLAID_ENV') === 'production'
  ? 'https://production.plaid.com'
  : 'https://sandbox.plaid.com'

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const plaidClientId = Deno.env.get('PLAID_CLIENT_ID')
  const plaidSecret = Deno.env.get('PLAID_SECRET')
  if (!plaidClientId || !plaidSecret) {
    return new Response(JSON.stringify({ error: 'Plaid is not configured' }), { status: 500 })
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
    return new Response(
      JSON.stringify({ error: plaidData.error_message ?? 'Plaid request failed' }),
      { status: 502 },
    )
  }

  return new Response(JSON.stringify({ link_token: plaidData.link_token }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
