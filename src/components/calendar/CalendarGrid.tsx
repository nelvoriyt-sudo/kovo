import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import type { IncomeEvent } from '@/hooks/useIncomeEvents'
import { cn } from '@/lib/utils'

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function CalendarGrid({
  monthDate,
  eventsByDay,
  onSelectDay,
}: {
  monthDate: Date
  eventsByDay: Map<string, IncomeEvent[]>
  onSelectDay: (date: Date) => void
}) {
  const gridStart = startOfWeek(startOfMonth(monthDate))
  const gridEnd = endOfWeek(endOfMonth(monthDate))

  const days: Date[] = []
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d)

  const today = new Date()

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 pb-2 text-center text-[12px] font-semibold text-muted-light">
        {WEEKDAY_LABELS.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const dayEvents = eventsByDay.get(key) ?? []
          const inMonth = isSameMonth(day, monthDate)
          const isToday = isSameDay(day, today)

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                'flex touch-manipulation flex-col items-center gap-1 rounded-lg py-2 text-[13px] transition-colors hover:bg-paper-dim',
                inMonth ? 'text-ink' : 'text-muted-light/60',
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full',
                  isToday && 'bg-ink font-semibold text-on-ink',
                )}
              >
                {format(day, 'd')}
              </span>
              <span className="flex h-1.5 gap-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <span
                    key={e.id}
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      e.type === 'pay' && 'bg-[#a34c3f]',
                      e.type === 'tip_out' && 'bg-[#4d7358]',
                      e.type === 'other' && 'bg-tan',
                    )}
                  />
                ))}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
