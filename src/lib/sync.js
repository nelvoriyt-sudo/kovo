import { rpc } from "./cloud.js";
import {
  recordKey,
  prepareOperation,
  diffData,
  inflate,
  emptyData,
} from "./records.js";
import { transact } from "./storage.js";

export async function synchronize(
  owner,
  call = (name, body) => rpc(name, body, owner),
) {
  const version = await call("kovo_sync_version");
  const cached = await transact(owner);
  if (
    cached.initialized &&
    cached.serverVersion === version &&
    cached.queue.length === 0
  )
    return cached;
  const rows = await call("kovo_read_records");
  let envelope = await transact(owner, (current) => {
    const defaults =
      !current.initialized && rows.length === 0
        ? diffData(inflate({}), emptyData())
        : [];
    return {
      ...current,
      initialized: true,
      serverVersion: version,
      records: Object.fromEntries(
        rows.map((row) => [recordKey(row.collection, row.id), row]),
      ),
      queue: defaults.length
        ? [{ id: crypto.randomUUID(), changes: defaults }, ...current.queue]
        : current.queue,
    };
  });
  // One bounded batch per tick. It keeps large imports and unreliable links responsive.
  const operation = envelope.queue[0];
  if (!operation) return envelope;
  if (!operation.sent) {
    const prepared = prepareOperation(operation, envelope.records);
    if (prepared.conflicts.length)
      return transact(owner, (current) => ({
        ...current,
        conflict: { id: operation.id, changes: prepared.conflicts },
      }));
    envelope = await transact(owner, (current) => ({
      ...current,
      queue: current.queue.map((op) =>
        op.id === operation.id ? { ...op, sent: prepared.changes } : op,
      ),
    }));
  }
  const active = envelope.queue.find((op) => op.id === operation.id);
  const result = await call("kovo_apply_operation", {
    p_id: active.id,
    p_changes: active.sent,
  });
  if (!result.saved) {
    // A definitive revision failure was not applied; fetch fresh rows before resolving.
    return transact(owner, (current) => ({
      ...current,
      queue: current.queue.map((op) =>
        op.id === active.id ? { ...op, sent: null } : op,
      ),
    }));
  }
  const confirmedRows = await call("kovo_read_records");
  return transact(owner, (current) => ({
    ...current,
    conflict: null,
    records: Object.fromEntries(
      confirmedRows.map((row) => [recordKey(row.collection, row.id), row]),
    ),
    queue: current.queue.filter((op) => op.id !== active.id),
  }));
}
export async function resolveConflict(owner, useLocal) {
  return transact(owner, (current) => {
    const first = current.queue[0];
    if (!first || first.id !== current.conflict?.id) return current;
    if (useLocal)
      return {
        ...current,
        conflict: null,
        queue: [
          {
            ...first,
            id: crypto.randomUUID(),
            sent: null,
            changes: first.changes.map((change) => ({
              ...change,
              before:
                current.records[recordKey(change.collection, change.id)]
                  ?.value ?? null,
            })),
          },
          ...current.queue.slice(1),
        ],
      };
    // Keep a recoverable copy. Later dependent edits remain queued and get their own review.
    return {
      ...current,
      conflict: null,
      recovered: [...(current.recovered || []), first],
      queue: current.queue.slice(1),
    };
  });
}
