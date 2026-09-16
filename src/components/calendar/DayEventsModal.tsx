import { TrashSimple } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import type { Category } from '@/hooks/useCategories'
import type { IncomeEvent } from '@/hooks/useIncomeEvents'
import { useAuth } from '@/lib/auth'
import { useFormatCurrency } from '@/lib/currencyContext'
import { notifyTransactionsChanged } from '@/lib/events'
import { supabase } from '@/lib/supabase'

const TYPE_LABEL: Record<IncomeEvent['type'], string> = {
  pay: 'Pay',
  tip_out: 'Tip-out',
  other: 'Other income',
}
const TYPE_CATEGORY_NAME: Record<IncomeEvent['type'], string> = {
  pay: 'Paycheck',
  tip_out: 'Tips',
  other: 'Other Income',
}

export function DayEventsModal({
  open,
  onClose,
  date,
  events,
  categories,
  onChanged,
}: {
  open: boolean
  onClose: () => void
  date: Date | null
  events: IncomeEvent[]
  categories: Category[]
  onChanged: () => void
}) {
  const { user } = useAuth()
  const [addingType, setAddingType] = useState<IncomeEvent['type']>('other')

  if (!date) return null

  async function syncTransaction(event: IncomeEvent, amount: number | null) {
    if (!user) return
    if (amount == null) {
      if (event.transaction_id) {
        await supabase.from('transactions').delete().eq('id', event.transaction_id)
      }
      await supabase
        .from('income_events')
        .update({ amount: null, transaction_id: null })
        .eq('id', event.id)
      notifyTransactionsChanged()
      return
    }

    if (event.transaction_id) {
      await supabase.from('transactions').update({ amount }).eq('id', event.transaction_id)
      await supabase.from('income_events').update({ amount }).eq('id', event.id)
    } else {
      const categoryName = TYPE_CATEGORY_NAME[event.type]
      const category = categories.find((c) => c.type === 'income' && c.name === categoryName)
      const { data: tx } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'income',
          amount,
          category_id: category?.id ?? null,
          account_id: event.account_id,
          date: event.date,
          description: TYPE_LABEL[event.type],
          is_manual: true,
        })
        .select('id')
        .single()
      await supabase
        .from('income_events')
        .update({ amount, transaction_id: tx?.id ?? null })
        .eq('id', event.id)
    }
    notifyTransactionsChanged()
  }

  async function handleAdd(amountStr: string, note: string) {
    if (!user || !date) return
    const amount = amountStr.trim() ? Number(amountStr) : null
    const { data: newEvent } = await supabase
      .from('income_events')
      .insert({
        user_id: user.id,
        type: addingType,
        date: format(date, 'yyyy-MM-dd'),
        note: note.trim() || null,
      })
      .select('id, schedule_id, type, date, amount, account_id, transaction_id, note')
      .single()

    if (newEvent && amount != null) {
      await syncTransaction(newEvent, amount)
    }
    onChanged()
  }

  async function handleDelete(event: IncomeEvent) {
    if (event.transaction_id) {
      await supabase.from('transactions').delete().eq('id', event.transaction_id)
      notifyTransactionsChanged()
    }
    await supabase.from('income_events').delete().eq('id', event.id)
    onChanged()
  }

  return (
    <Modal open={open} onClose={onClose} title={format(date, 'EEEE, MMMM d')}>
      <div className="flex flex-col gap-3">
        {events.length === 0 && <p className="text-[15px] text-muted">Nothing marked for this day yet.</p>}

        {events.map((event) => (
          <EventRow
            key={event.id}
            event={event}
            onAmountChange={(amount) => syncTransaction(event, amount).then(onChanged)}
            onDelete={() => handleDelete(event)}
          />
        ))}

        <AddEventForm type={addingType} onTypeChange={setAddingType} onAdd={handleAdd} />
      </div>
    </Modal>
  )
}

function EventRow({
  event,
  onAmountChange,
  onDelete,
}: {
  event: IncomeEvent
  onAmountChange: (amount: number | null) => void
  onDelete: () => void
}) {
  const formatCurrency = useFormatCurrency()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(event.amount?.toString() ?? '')
  const dotColor = event.type === 'pay' ? 'bg-neg' : event.type === 'tip_out' ? 'bg-pos' : 'bg-accent'

  return (
    <div className="flex items-center gap-3 rounded-[4px] border border-line p-3">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`} aria-hidden="true" />
      <div className="flex-1">
        <div className="text-[14px] font-semibold text-ink">{TYPE_LABEL[event.type]}</div>
        {event.note && <div className="text-[12.5px] text-muted">{event.note}</div>}
      </div>
      {editing ? (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            step="0.01"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-9 w-24"
          />
          <Button
            type="button"
            className="h-9 w-auto px-3"
            onClick={() => {
              const amount = value.trim() ? Number(value) : null
              onAmountChange(amount)
              setEditing(false)
            }}
          >
            Save
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[14px] font-semibold text-accent hover:text-accent"
        >
          {event.amount != null ? formatCurrency(event.amount) : 'Add amount'}
        </button>
      )}
      <button
        type="button"
        aria-label="Delete"
        onClick={onDelete}
        className="touch-manipulation rounded-full p-1.5 text-muted hover:bg-raise hover:text-neg"
      >
        <TrashSimple className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

function AddEventForm({
  type,
  onTypeChange,
  onAdd,
}: {
  type: IncomeEvent['type']
  onTypeChange: (t: IncomeEvent['type']) => void
  onAdd: (amount: string, note: string) => void
}) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-[4px] border border-dashed border-line p-3">
      <div className="flex gap-2">
        <Select value={type} onChange={(e) => onTypeChange(e.target.value as IncomeEvent['type'])} className="h-10">
          <option value="pay">Pay</option>
          <option value="tip_out">Tip-out</option>
          <option value="other">Other income</option>
        </Select>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="Amount (optional)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-10"
        />
      </div>
      <Input
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="h-10"
      />
      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          onAdd(amount, note)
          setAmount('')
          setNote('')
        }}
      >
        Add marker
      </Button>
    </div>
  )
}
