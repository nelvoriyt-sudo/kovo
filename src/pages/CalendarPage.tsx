import { addMonths, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import { useState } from 'react'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import { DayEventsModal } from '@/components/calendar/DayEventsModal'
import { SetPayPeriodModal } from '@/components/calendar/SetPayPeriodModal'
import { Button } from '@/components/ui/Button'
import { useCategories } from '@/hooks/useCategories'
import { useIncomeEvents } from '@/hooks/useIncomeEvents'

export function CalendarPage() {
  const [monthDate, setMonthDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [setPayOpen, setSetPayOpen] = useState(false)

  const gridStart = format(startOfWeek(startOfMonth(monthDate)), 'yyyy-MM-dd')
  const gridEnd = format(endOfWeek(endOfMonth(monthDate)), 'yyyy-MM-dd')
  const { events, refresh } = useIncomeEvents(gridStart, gridEnd)
  const { categories } = useCategories()

  const eventsByDay = new Map<string, typeof events>()
  for (const e of events) {
    const list = eventsByDay.get(e.date) ?? []
    list.push(e)
    eventsByDay.set(e.date, list)
  }

  const selectedKey = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null
  const selectedEvents = selectedKey ? (eventsByDay.get(selectedKey) ?? []) : []

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Pay-period calendar</h1>
          <p className="mt-1 text-[15px] text-muted">
            Red = pay, green = tip-out, tan = other income
          </p>
        </div>
        <Button type="button" className="w-auto px-4" onClick={() => setSetPayOpen(true)}>
          Set pay period
        </Button>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setMonthDate((d) => subMonths(d, 1))}
            className="touch-manipulation rounded-full p-2 hover:bg-paper-dim"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="font-display text-lg font-semibold text-ink">{format(monthDate, 'MMMM yyyy')}</span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setMonthDate((d) => addMonths(d, 1))}
            className="touch-manipulation rounded-full p-2 hover:bg-paper-dim"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <CalendarGrid monthDate={monthDate} eventsByDay={eventsByDay} onSelectDay={setSelectedDay} />
      </div>

      <DayEventsModal
        open={selectedDay != null}
        onClose={() => setSelectedDay(null)}
        date={selectedDay}
        events={selectedEvents}
        categories={categories}
        onChanged={refresh}
      />

      <SetPayPeriodModal open={setPayOpen} onClose={() => setSetPayOpen(false)} onSaved={refresh} />
    </div>
  )
}
