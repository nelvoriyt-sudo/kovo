export const BACKUP_VERSION = 1;

const REQUIRED_ARRAYS = ["accounts", "investments", "transactions", "budgets", "bills", "goals", "history", "categories"];

export function createBackup(data) {
  return {
    product: "kovo",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function serializeBackup(data) {
  return JSON.stringify(createBackup(data), null, 2);
}

export function parseBackup(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file is not valid JSON.");
  }

  const payload = parsed?.product === "kovo" && parsed?.data ? parsed.data : parsed;
  if (!payload || typeof payload !== "object") throw new Error("This does not look like Kovo data.");

  for (const key of REQUIRED_ARRAYS) {
    if (!Array.isArray(payload[key])) throw new Error(`Backup is missing ${key}.`);
  }
  if (!payload.settings || typeof payload.settings !== "object") throw new Error("Backup is missing settings.");

  return payload;
}

export function downloadBackup(data) {
  const blob = new Blob([serializeBackup(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `kovo-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
