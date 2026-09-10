import { toCents } from "./money.js";
export function todayISO(
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  now = new Date(),
) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export function dateNumber(iso) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(iso) ||
    new Date(`${iso}T00:00:00Z`).toISOString().slice(0, 10) !== iso
  )
    throw new Error("Choose a valid date.");
  return Date.parse(`${iso}T00:00:00Z`) / 86400000;
}
export const addDays = (iso, days) =>
  new Date((dateNumber(iso) + days) * 86400000).toISOString().slice(0, 10);
export function periodFor(date, cadence, anchor) {
  const days = cadence === "daily" ? 1 : cadence === "biweekly" ? 14 : 7;
  const start = addDays(
    anchor,
    Math.floor((dateNumber(date) - dateNumber(anchor)) / days) * days,
  );
  return { start, end: addDays(start, days), days };
}
export function conservativePlan(
  data,
  today = todayISO(data.settings.timeZone),
) {
  const {
    cadence = "weekly",
    payAnchor = today,
    trackingSince = today,
    baselineCents = 0,
    reserveCents = 0,
  } = data.settings;
  if (cadence === "irregular")
    return {
      baseline: baselineCents,
      available: Math.max(0, baselineCents - reserveCents),
      periods: [],
      manual: true,
    };
  const current = periodFor(today, cadence, payAnchor);
  const periods = Array.from({ length: 4 }, (_, i) => {
    const start = addDays(current.start, -(i + 1) * current.days),
      end = addDays(start, current.days);
    const income = data.transactions
      .filter(
        (t) =>
          t.category !== "Transfer" &&
          t.amount > 0 &&
          (t.availableDate || t.date) >= start &&
          (t.availableDate || t.date) < end,
      )
      .reduce((s, t) => s + toCents(t.amount), 0);
    return { start, end, income };
  }).filter((p) => p.start >= trackingSince);
  const baseline = periods.length
    ? Math.min(
        ...periods.map((p) => p.income),
        ...(baselineCents > 0 ? [baselineCents] : []),
      )
    : baselineCents;
  return {
    baseline,
    available: Math.max(0, baseline - reserveCents),
    periods,
    current,
    manual: periods.length === 0,
  };
}
export function nextInsight(data, today = todayISO(data.settings.timeZone)) {
  const plan = conservativePlan(data, today);
  const money = (cents) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: data.settings.currency || "USD",
    }).format(cents / 100);
  if (!data.settings.cadence)
    return {
      id: "setup",
      title: "Plan around a quieter pay period",
      text: "Set your pay rhythm and an amount you can cautiously plan around. Only complete tracked periods will inform the estimate.",
      page: "budget",
    };
  if (plan.baseline < (data.settings.reserveCents || 0))
    return {
      id: "reserve",
      title: "Your essentials need a closer look",
      text: `Your ${money(plan.baseline)} planning baseline is below the ${money(data.settings.reserveCents)} you reserved. Review upcoming bills before adding flexible spending.`,
      page: "budget",
    };
  const month = today.slice(0, 7),
    elapsed = Number(today.slice(8)),
    days = new Date(
      Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0),
    ).getUTCDate();
  const risks = data.budgets
    .map((b) => {
      const spent = data.transactions
        .filter(
          (t) =>
            t.date.startsWith(month) &&
            t.date <= today &&
            t.category === b.category &&
            t.amount < 0,
        )
        .reduce((s, t) => s - toCents(t.amount), 0);
      return {
        ...b,
        spent,
        projected: Math.round((spent * days) / elapsed),
        limitCents: toCents(b.limit),
      };
    })
    .filter((b) => b.limitCents > 0 && b.projected > b.limitCents)
    .sort((a, b) => b.projected - b.limitCents - (a.projected - a.limitCents));
  if (risks.length) {
    const b = risks[0];
    return {
      id: `budget-${month}-${b.category}`,
      title: `Check your ${b.category.toLowerCase()} plan`,
      text: `You recorded ${money(b.spent)} over ${elapsed} days. At that pace, the month would finish about ${money(b.projected - b.limitCents)} above your limit. This estimate assumes the same daily pace.`,
      page: "budget",
    };
  }
  const goal = data.goals.find((g) => g.saved < g.target);
  if (goal)
    return {
      id: `goal-${goal.id}`,
      title: `Keep ${goal.name} in view`,
      text: `You have ${money(toCents(goal.target) - toCents(goal.saved))} left to record toward this goal. Review your essentials before choosing your next contribution.`,
      page: "goals",
    };
  return {
    id: "baseline",
    title: "A little room to plan",
    text: `Your planning amount after reserved essentials is ${money(plan.available)} per ${data.settings.cadence === "irregular" ? "chosen planning window" : "pay period"}. ${plan.manual ? "This uses your manual baseline." : "This uses the lowest complete tracked period, including periods with no income."} It is an estimate, not a bank balance.`,
    page: "budget",
  };
}
