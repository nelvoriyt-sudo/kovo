import { Bank } from '@phosphor-icons/react'
import { useCallback, useEffect, useState } from 'react'
import { usePlaidLink, type PlaidLinkOnSuccess } from 'react-plaid-link'
import { callPlaidFunction } from '@/lib/plaidFunctions'

export function PlaidConnectButton({ onLinked }: { onLinked: () => void }) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLinkToken = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await callPlaidFunction<{ link_token: string }>('plaid-create-link-token')
      setLinkToken(data.link_token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start bank connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSuccess: PlaidLinkOnSuccess = useCallback(
    async (publicToken) => {
      setLoading(true)
      setError(null)
      setLinkToken(null)
      try {
        await callPlaidFunction('plaid-exchange-public-token', { public_token: publicToken })
        // Pull transactions immediately so the new account isn't just an
        // empty shell until the user separately hits "Sync now".
        await callPlaidFunction('plaid-sync-transactions').catch(() => {})
        onLinked()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not finish linking your bank.')
      } finally {
        setLoading(false)
      }
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
