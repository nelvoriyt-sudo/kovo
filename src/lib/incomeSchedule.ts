import { addDays, addMonths, format, getDaysInMonth, setDate, startOfMonth } from 'date-fns'

export type ScheduleFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'custom'

/** Generates concrete occurrence dates for a recurring schedule, `monthsAhead` months from anchorDate. */
export function generateOccurrences(
  anchorDate: Date,
  frequency: ScheduleFrequency,
  monthsAhead = 12,
): Date[] {
  const windowEnd = addMonths(anchorDate, monthsAhead)
  const dates: Date[] = []

  if (frequency === 'weekly' || frequency === 'biweekly') {
    const step = frequency === 'weekly' ? 7 : 14
    let current = anchorDate
    while (current <= windowEnd) {
      dates.push(current)
      current = addDays(current, step)
    }
    return dates
  }

  if (frequency === 'monthly') {
    const dayOfMonth = anchorDate.getDate()
    let cursor = startOfMonth(anchorDate)
    while (cursor <= windowEnd) {
      const daysInMonth = getDaysInMonth(cursor)
      dates.push(setDate(cursor, Math.min(dayOfMonth, daysInMonth)))
      cursor = addMonths(cursor, 1)
    }
    return dates.filter((d) => d >= anchorDate)
  }

  if (frequency === 'semimonthly') {
    const dayOfMonth = anchorDate.getDate()
    let cursor = startOfMonth(anchorDate)
    while (cursor <= windowEnd) {
      const daysInMonth = getDaysInMonth(cursor)
      const first = setDate(cursor, Math.min(dayOfMonth, daysInMonth))
      dates.push(first, addDays(first, 15))
      cursor = addMonths(cursor, 1)
    }
    return dates.filter((d) => d >= anchorDate && d <= windowEnd)
  }

  // 'custom' — no derivable rule; just the anchor date itself.
  return [anchorDate]
}

export function toDateKey(date: Date) {
  return format(date, 'yyyy-MM-dd')
}
