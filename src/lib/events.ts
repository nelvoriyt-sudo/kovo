/** Fired whenever transactions change, so hooks on any page can refetch. */
export const dataEvents = new EventTarget()

export function notifyTransactionsChanged() {
  dataEvents.dispatchEvent(new Event('transactions-changed'))
}
