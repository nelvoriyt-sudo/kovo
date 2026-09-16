import { format } from 'date-fns'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useAccounts } from '@/hooks/useAccounts'
import { useCategories } from '@/hooks/useCategories'
import { useAuth } from '@/lib/auth'
import { notifyTransactionsChanged } from '@/lib/events'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export function AddTransactionModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const { user } = useAuth()
  const { categories } = useCategories()
  const { accounts, refresh: refreshAccounts } = useAccounts()

  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [description, setDescription] = useState('')
  const [addingAccount, setAddingAccount] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const categoryOptions = categories.filter((c) => c.type === type)

  function reset() {
    setType('expense')
    setAmount('')
    setCategoryId('')
    setAccountId('')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setDescription('')
    setAddingAccount(false)
    setNewAccountName('')
    setError(null)
  }

  async function handleAddAccount() {
    if (!user || !newAccountName.trim()) return
    const { data, error: insertError } = await supabase
      .from('accounts')
      .insert({ user_id: user.id, name: newAccountName.trim(), type: 'cash' })
      .select('id')
      .single()
    if (insertError) {
      setError(insertError.message)
      return
    }
    refreshAccounts()
    setAccountId(data.id)
    setAddingAccount(false)
    setNewAccountName('')
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!user) return
    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }
    setSubmitting(true)
    setError(null)

    const { error: insertError } = await supabase.from('transactions').insert({
      user_id: user.id,
      type,
      amount: parsedAmount,
      category_id: categoryId || null,
      account_id: accountId || null,
      date,
      description: description.trim() || null,
      is_manual: true,
    })

    setSubmitting(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    reset()
    notifyTransactionsChanged()
    onSaved()
    onClose()
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title="Add transaction">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex gap-0.5 rounded-[5px] bg-raise p-[3px]">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setType(t)
                setCategoryId('')
              }}
              className={cn(
                'flex-1 touch-manipulation rounded-[3px] py-2 text-sm capitalize transition-colors duration-150',
                type === t
                  ? 'bg-accent font-semibold text-on-accent'
                  : 'font-medium text-muted hover:text-ink',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tx-amount" className="text-[13px] font-semibold text-ink">
            Amount
          </label>
          <Input
            id="tx-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tx-category" className="text-[13px] font-semibold text-ink">
            Category
          </label>
          <Select
            id="tx-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">No category</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tx-date" className="text-[13px] font-semibold text-ink">
            Date
          </label>
          <Input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tx-account" className="text-[13px] font-semibold text-ink">
            Account <span className="font-normal text-muted">(optional)</span>
          </label>
          {addingAccount ? (
            <div className="flex gap-2">
              <Input
                autoFocus
                placeholder="e.g. Cash, Checking"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
              />
              <Button type="button" className="w-auto px-4" onClick={handleAddAccount}>
                Add
              </Button>
            </div>
          ) : (
            <Select
              id="tx-account"
              value={accountId}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  setAddingAccount(true)
                } else {
                  setAccountId(e.target.value)
                }
              }}
            >
              <option value="">No account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
              <option value="__new__">+ Add new account…</option>
            </Select>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tx-description" className="text-[13px] font-semibold text-ink">
            Description <span className="font-normal text-muted">(optional)</span>
          </label>
          <Input
            id="tx-description"
            placeholder="e.g. Groceries at Trader Joe's"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="text-[13px] text-neg">
            {error}
          </p>
        )}

        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save transaction'}
        </Button>
      </form>
    </Modal>
  )
}
