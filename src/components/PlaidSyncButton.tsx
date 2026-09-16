import { ArrowsClockwise } from '@phosphor-icons/react'
import { useState } from 'react'
import { notifyTransactionsChanged } from '@/lib/events'
import { callPlaidFunction } from '@/lib/plaidFunctions'

type SyncResult = { added: number; modified: number; removed: number; message?: string }

export function PlaidSyncButton() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSync() {
    setLoading(true)
    setError(null)
    setStatus(null)
    try {
      const result = await callPlaidFunction<SyncResult>('plaid-sync-transactions')
      if (result.message) {
        setStatus(result.message)
      } else {
        setStatus(`Synced: ${result.added} new, ${result.modified} updated, ${result.removed} removed.`)
        if (result.added || result.modified || result.removed) notifyTransactionsChanged()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sync transactions.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSync}
        disabled={loading}
        className="flex touch-manipulation items-center gap-2 rounded-[5px] border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-raise disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ArrowsClockwise className="h-4 w-4" />
        {loading ? 'Syncing…' : 'Sync transactions now'}
      </button>
      {status && <p className="mt-2 text-[13px] text-muted">{status}</p>}
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-neg">
          {error}
        </p>
      )}
    </div>
  )
}
