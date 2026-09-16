import { supabase } from '@/lib/supabase'

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

/** Calls a Supabase Edge Function with the current session's token via plain
 * fetch, so we get the real {error} response body on failure instead of
 * supabase-js's generic "non-2xx status code" wrapper. */
export async function callPlaidFunction<T>(name: string, body?: unknown): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) throw new Error('You need to be signed in.')

  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(json?.error ?? `Request failed (${res.status})`)
  }
  return json as T
}
