import { differenceInCalendarDays, endOfMonth } from 'date-fns'

export type Insight = {
  id: string
  categoryName: string
  daysLeft: number
  pct: number
  overAmount: number
}

export function buildBudgetInsights(
  categories: { id: string; name: string }[],
  spentByCategory: Map<string, number>,
  budgetsByCategory: Map<string, number>,
  now: Date,
): Insight[] {
  const daysLeft = Math.max(differenceInCalendarDays(endOfMonth(now), now), 0)
  const insights: Insight[] = []

  for (const category of categories) {
    const budgeted = budgetsByCategory.get(category.id)
    if (!budgeted) continue
    const spent = spentByCategory.get(category.id) ?? 0
    const pct = Math.round((spent / budgeted) * 100)

    if (pct >= 80) {
      insights.push({
        id: category.id,
        categoryName: category.name,
        daysLeft,
        pct,
        overAmount: Math.max(spent - budgeted, 0),
      })
    }
  }

  return insights.sort((a, b) => b.pct - a.pct)
}
