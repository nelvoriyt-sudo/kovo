import { Bank } from '@phosphor-icons/react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'
import { usePlaidLink, type PlaidLinkOnSuccess } from 'react-plaid-link'
import { supabase } from '@/lib/supabase'

/** supabase-js doesn't parse the response body on a non-2xx Edge Function
 * response -- the real error message lives on error.context, a Response. */
async function describeFunctionError(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json()
      if (typeof body?.error === 'string') return body.error
    } catch {
      // fall through to fallback
    }
  }
  return error instanceof Error ? error.message : fallback
}

export function PlaidConnectButton({ onLinked }: { onLinked: () => void }) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLinkToken = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: fnError } = await supabase.functions.invoke<{ link_token?: string }>(
      'plaid-create-link-token',
    )
    setLoading(false)
    if (fnError || !data?.link_token) {
      setError(await describeFunctionError(fnError, 'Could not start bank connection.'))
      return
    }
    setLinkToken(data.link_token)
  }, [])

  const handleSuccess: PlaidLinkOnSuccess = useCallback(
    async (publicToken) => {
      setLoading(true)
      setError(null)
      const { data, error: fnError } = await supabase.functions.invoke<{ success?: boolean }>(
        'plaid-exchange-public-token',
        { body: { public_token: publicToken } },
      )
      setLoading(false)
      setLinkToken(null)
      if (fnError || !data?.success) {
        setError(await describeFunctionError(fnError, 'Could not finish linking your bank.'))
        return
      }
      onLinked()
    },
    [onLinked],
  )

  const { open, ready } = usePlaidLink({
    token: linkToken ?? '',
    onSuccess: handleSuccess,
    onExit: () => setLinkToken(null),
  })

  useEffect(() => {
    if (linkToken && ready) open()
  }, [linkToken, ready, open])

  return (
    <div>
      <button
        type="button"
        onClick={fetchLinkToken}
        disabled={loading}
        className="flex touch-manipulation items-center gap-2 rounded-[10px] border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-paper-dim disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Bank className="h-4 w-4" />
        {loading ? 'Connecting…' : 'Connect a bank (sandbox)'}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-[#a34c3f]">
          {error}
        </p>
      )}
    </div>
  )
}
