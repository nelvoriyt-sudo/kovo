import { format } from 'date-fns'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useAuth } from '@/lib/auth'
import { generateOccurrences, toDateKey, type ScheduleFrequency } from '@/lib/incomeSchedule'
import { supabase } from '@/lib/supabase'

export function SetPayPeriodModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const { user } = useAuth()
  const [label, setLabel] = useState('')
  const [type, setType] = useState<'pay' | 'tip_out'>('pay')
  const [frequency, setFrequency] = useState<ScheduleFrequency>('biweekly')
  const [anchorDate, setAnchorDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    setError(null)

    const { data: schedule, error: scheduleError } = await supabase
      .from('income_schedules')
      .insert({
        user_id: user.id,
        label: label.trim() || null,
        type,
        frequency,
        anchor_date: anchorDate,
      })
      .select('id')
      .single()

    if (scheduleError || !schedule) {
      setError(scheduleError?.message ?? 'Could not save the schedule.')
      setSubmitting(false)
      return
    }

    const occurrences = generateOccurrences(new Date(`${anchorDate}T00:00:00`), frequency)
    const rows = occurrences.map((d) => ({
      user_id: user.id,
      schedule_id: schedule.id,
      type,
      date: toDateKey(d),
    }))

    const { error: eventsError } = await supabase.from('income_events').insert(rows)
    setSubmitting(false)
    if (eventsError) {
      setError(eventsError.message)
      return
    }

    setLabel('')
    onSaved()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Set pay period">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <p className="text-[13px] text-muted">
          This creates markers on your calendar going forward — no dollar amount required. Add one
          later on any marker if you want it to show up in your dashboards.
        </p>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sched-label" className="text-[13px] font-semibold text-[#4a453e]">
            Label <span className="font-normal text-muted-light">(optional)</span>
          </label>
          <Input
            id="sched-label"
            placeholder="e.g. Restaurant paycheck"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sched-type" className="text-[13px] font-semibold text-[#4a453e]">
            Type
          </label>
          <Select id="sched-type" value={type} onChange={(e) => setType(e.target.value as 'pay' | 'tip_out')}>
            <option value="pay">Pay period</option>
            <option value="tip_out">Tip-out</option>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sched-frequency" className="text-[13px] font-semibold text-[#4a453e]">
            Frequency
          </label>
          <Select
            id="sched-frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as ScheduleFrequency)}
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every other week</option>
            <option value="semimonthly">Twice a month</option>
            <option value="monthly">Monthly</option>
            <option value="custom">One-off / custom</option>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sched-anchor" className="text-[13px] font-semibold text-[#4a453e]">
            {frequency === 'custom' ? 'Date' : 'Next (or most recent) date'}
          </label>
          <Input
            id="sched-anchor"
            type="date"
            value={anchorDate}
            onChange={(e) => setAnchorDate(e.target.value)}
            required
          />
        </div>

        {error && (
          <p role="alert" className="text-[13px] text-red-700">
            {error}
          </p>
        )}

        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save pay period'}
        </Button>
      </form>
    </Modal>
  )
}
