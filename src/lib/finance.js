export const todayISO = () => new Date().toISOString().slice(0, 10);
export const monthKey = (iso) => iso.slice(0, 7);

export const fmt = (n, currency = "USD", opts = {}) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    ...opts,
  }).format(n || 0);

export const fmtSigned = (n, currency = "USD") =>
  (n < 0 ? "-" : "+") + fmt(Math.abs(n), currency);

export function computeNetWorth(data) {
  const accounts = data.accounts.reduce((sum, account) => sum + account.balance, 0);
  const investments = data.investments.reduce(
    (sum, investment) =>
      sum + investment.holdings.reduce((holdingSum, holding) => holdingSum + holding.shares * holding.price, 0),
    0,
  );
  return accounts + investments;
}

export function monthlyTransactions(transactions, iso = todayISO()) {
  const month = monthKey(iso);
  return transactions.filter((transaction) => monthKey(transaction.date) === month);
}

export function cashFlow(transactions) {
  return transactions.reduce(
    (result, transaction) => {
      if (transaction.amount > 0) result.income += transaction.amount;
      if (transaction.amount < 0) result.expenses += Math.abs(transaction.amount);
      result.leftOver = result.income - result.expenses;
      return result;
    },
    { income: 0, expenses: 0, leftOver: 0 },
  );
}

export function spendingByCategory(transactions) {
  return transactions.reduce((result, transaction) => {
    if (transaction.amount < 0) {
      result[transaction.category] = (result[transaction.category] || 0) + Math.abs(transaction.amount);
    }
    return result;
  }, {});
}

export function budgetPace(limit, spent, iso = todayISO()) {
  const date = new Date(`${iso}T12:00:00`);
  const day = date.getDate();
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const elapsed = Math.max(day / daysInMonth, 1 / daysInMonth);
  const expectedSpend = limit * elapsed;
  const projectedSpend = spent / elapsed;
  return {
    elapsed,
    expectedSpend,
    projectedSpend,
    projectedDelta: projectedSpend - limit,
    status: spent > limit ? "over" : spent > expectedSpend * 1.1 ? "ahead" : "on-track",
  };
}

export function upcomingBills(bills, iso = todayISO(), limit = 4) {
  const today = new Date(`${iso}T12:00:00`);
  const day = today.getDate();
  return [...bills]
    .map((bill) => ({ ...bill, daysUntil: bill.dueDay >= day ? bill.dueDay - day : bill.dueDay + 31 - day }))
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, limit);
}
