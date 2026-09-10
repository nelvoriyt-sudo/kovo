export const COLLECTIONS = [
  "accounts",
  "investments",
  "transactions",
  "budgets",
  "bills",
  "goals",
  "history",
  "categories",
  "tipEntries",
  "coachHistory",
];
export const DEFAULT_CATEGORIES = [
  "Groceries",
  "Dining",
  "Transport",
  "Housing",
  "Utilities",
  "Subscriptions",
  "Health",
  "Shopping",
  "Entertainment",
  "Travel",
  "Income",
  "Transfer",
  "Other",
];
export function emptyData() {
  return {
    ...Object.fromEntries(COLLECTIONS.map((key) => [key, []])),
    categories: DEFAULT_CATEGORIES,
    settings: { accentTheme: "blue", currency: "USD" },
  };
}
export const equal = (a, b) => stable(a) === stable(b);
function stable(value) {
  if (value === undefined) return "null";
  if (Array.isArray(value)) return JSON.stringify(value.map(stable));
  if (value && typeof value === "object")
    return JSON.stringify(
      Object.keys(value)
        .sort()
        .map((key) => [key, stable(value[key])]),
    );
  return JSON.stringify(value);
}
export const recordKey = (collection, id) => JSON.stringify([collection, id]);
export function flatten(data) {
  const records = {};
  for (const [collection, value] of Object.entries(data)) {
    if (COLLECTIONS.includes(collection)) {
      value.forEach((item, index) => {
        const id = String(
          collection === "categories"
            ? item
            : collection === "budgets"
              ? item.category
              : collection === "history"
                ? item.date
                : item.id || `legacy-${index}`,
        );
        records[recordKey(collection, id)] = { collection, id, value: item };
      });
    } else if (collection === "settings") {
      for (const [id, setting] of Object.entries(value))
        records[recordKey(collection, id)] = { collection, id, value: setting };
    } else
      records[recordKey("_meta", collection)] = {
        collection: "_meta",
        id: collection,
        value,
      };
  }
  return records;
}
export function inflate(records) {
  const data = emptyData();
  data.categories = [];
  for (const record of Object.values(records)) {
    if (record.value === null) continue;
    if (record.collection === "settings")
      data.settings[record.id] = record.value;
    else if (record.collection === "_meta") data[record.id] = record.value;
    else if (COLLECTIONS.includes(record.collection))
      data[record.collection].push(record.value);
  }
  data.history.sort((a, b) => a.date.localeCompare(b.date));
  return data;
}
export function diffData(before, after) {
  const a = flatten(before),
    b = flatten(after);
  return [...new Set([...Object.keys(a), ...Object.keys(b)])]
    .filter((key) => !equal(a[key]?.value, b[key]?.value))
    .map((key) => ({
      collection: (b[key] || a[key]).collection,
      id: (b[key] || a[key]).id,
      before: a[key]?.value ?? null,
      value: b[key]?.value ?? null,
    }));
}
export function applyChanges(records, changes) {
  const next = { ...records };
  for (const change of changes)
    next[recordKey(change.collection, change.id)] = { ...change };
  return next;
}
export function visibleData(envelope) {
  return inflate(
    envelope.queue.reduce(
      (rows, operation) => applyChanges(rows, operation.changes),
      envelope.records,
    ),
  );
}
export function prepareOperation(operation, records) {
  const conflicts = operation.changes.filter(
    (change) =>
      !equal(
        change.before,
        records[recordKey(change.collection, change.id)]?.value ?? null,
      ),
  );
  return {
    conflicts,
    changes: operation.changes.map((change) => ({
      ...change,
      revision: records[recordKey(change.collection, change.id)]?.revision || 0,
    })),
  };
}
