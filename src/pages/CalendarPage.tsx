import { CaretLeft, CaretRight } from '@phosphor-icons/react'
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
          <h1 className="font-display text-[27px] font-semibold tracking-[-0.025em] text-ink">Pay-period calendar</h1>
          <p className="mt-1 text-[15px] text-muted">Pay, tip-outs and other income you've scheduled.</p>
        </div>
        <Button type="button" className="w-auto px-4" onClick={() => setSetPayOpen(true)}>
          Set pay period
        </Button>
      </div>

      <div className="mt-8 rounded-[4px] border border-line bg-surface p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setMonthDate((d) => subMonths(d, 1))}
            className="touch-manipulation rounded-full p-2 hover:bg-raise"
          >
            <CaretLeft className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
          <span className="font-display text-lg font-semibold text-ink">{format(monthDate, 'MMMM yyyy')}</span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setMonthDate((d) => addMonths(d, 1))}
            className="touch-manipulation rounded-full p-2 hover:bg-raise"
          >
            <CaretRight className="h-[18px] w-[18px]" aria-hidden="true" />
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
