import {
  diffData,
  emptyData,
  flatten,
  visibleData,
  equal,
  recordKey,
} from "./records.js";

let database;
function openDatabase() {
  if (!database)
    database = new Promise((resolve, reject) => {
      const request = indexedDB.open("kovo-durable-v1", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("accounts");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(
          new Error(
            "Device storage could not open. Your previous data has not been replaced.",
          ),
        );
    });
  return database;
}
export async function transact(owner, update = (value) => value) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("accounts", "readwrite");
    const store = transaction.objectStore("accounts");
    const request = store.get(owner);
    let result;
    request.onsuccess = () => {
      try {
        result = update(
          request.result || { records: {}, queue: [], initialized: false },
        );
        store.put(result, owner);
      } catch (error) {
        reject(error);
        transaction.abort();
      }
    };
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () =>
      reject(
        new Error(
          "Could not save on this device. Keep this page open and export a backup before clearing storage.",
        ),
      );
  });
}
export async function commitData(owner, before, after) {
  const changes = diffData(before, after);
  return transact(owner, (envelope) => {
    const current = flatten(visibleData(envelope));
    if (
      changes.some(
        (change) =>
          !equal(
            current[recordKey(change.collection, change.id)]?.value ?? null,
            change.before,
          ),
      )
    ) {
      throw new Error(
        "This entry changed in another tab. Your draft was not saved; review the current entry and try again.",
      );
    }
    return changes.length
      ? {
          ...envelope,
          queue: [
            ...envelope.queue,
            {
              id: crypto.randomUUID(),
              changes,
              createdAt: new Date().toISOString(),
            },
          ],
        }
      : envelope;
  });
}
export async function initializeLocal(owner) {
  return transact(owner, (envelope) =>
    envelope.initialized
      ? envelope
      : { ...envelope, records: flatten(emptyData()), initialized: true },
  );
}
