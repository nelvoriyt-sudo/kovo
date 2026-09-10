import test from "node:test";
import assert from "node:assert/strict";
import "fake-indexeddb/auto";
import {
  toCents,
  percentageCents,
  splitPool,
  sumMoney,
} from "../src/lib/money.js";
import {
  todayISO,
  conservativePlan,
  periodFor,
  addDays,
  nextInsight,
} from "../src/lib/planning.js";
import {
  emptyData,
  flatten,
  inflate,
  diffData,
  visibleData,
  recordKey,
  prepareOperation,
} from "../src/lib/records.js";
import { commitData, initializeLocal, transact } from "../src/lib/storage.js";
import { synchronize, resolveConflict } from "../src/lib/sync.js";
import { validateChanges } from "../src/lib/validation.js";
import { upcomingBills } from "../src/lib/finance.js";

test("bill due dates clamp to month end and roll over using actual month lengths", () => {
  assert.equal(upcomingBills([{ dueDay: 31 }], "2026-02-27")[0].daysUntil, 1);
  assert.equal(upcomingBills([{ dueDay: 1 }], "2026-02-28")[0].daysUntil, 1);
});

test("decimal money and allocation preserve every cent", () => {
  assert.equal(toCents("42.75"), 4275);
  assert.equal(sumMoney([0.1, 0.2]), 0.3);
  assert.throws(() => toCents("1.005"));
  assert.throws(() => toCents(Infinity));
  assert.equal(percentageCents(10005, "2.5"), 250);
  assert.deepEqual(splitPool(100, 3), [34, 33, 33]);
  for (let n = 1; n <= 100; n++)
    assert.equal(
      splitPool(4275, n).reduce((a, b) => a + b, 0),
      4275,
    );
});
test("local calendar date and overnight shift survive timezone and DST boundaries", () => {
  assert.equal(
    todayISO("America/New_York", new Date("2026-09-09T02:00Z")),
    "2026-09-08",
  );
  assert.equal(addDays("2026-03-08", 1), "2026-03-09");
  assert.deepEqual(periodFor("2026-09-08", "biweekly", "2026-09-01"), {
    start: "2026-09-01",
    end: "2026-09-15",
    days: 14,
  });
});
test("planning counts zero income periods and excludes incomplete periods and future card tips", () => {
  const data = emptyData();
  data.settings = {
    cadence: "weekly",
    payAnchor: "2026-09-01",
    trackingSince: "2026-08-04",
    baselineCents: 50000,
  };
  data.transactions = [
    { id: "a", date: "2026-08-12", amount: 300, category: "Income" },
    {
      id: "b",
      date: "2026-08-31",
      availableDate: "2026-09-05",
      amount: 1000,
      category: "Income",
    },
  ];
  const plan = conservativePlan(data, "2026-09-02");
  assert.equal(plan.baseline, 0);
  assert.equal(plan.periods.length, 4);
  data.settings.trackingSince = "2026-09-01";
  assert.equal(conservativePlan(data, "2026-09-02").baseline, 50000);
  data.settings.cadence = "irregular";
  data.settings.reserveCents = 12000;
  assert.equal(conservativePlan(data).available, 38000);
});
test("record migration round-trips legacy data and unknown fields", () => {
  const data = {
    ...emptyData(),
    transactions: [{ id: "old", amount: 42.75, date: "2026-09-08" }],
    tipEntries: [{ id: "tip", cashTipsCents: 4275 }],
    custom: { keep: true },
  };
  assert.deepEqual(inflate(flatten(data)), data);
});
test("deleted records remain tombstones, and remote edits conflict instead of being overwritten", () => {
  const before = { ...emptyData(), transactions: [{ id: "one", amount: 1 }] },
    after = { ...before, transactions: [] };
  const changes = diffData(before, after);
  assert.equal(changes[0].value, null);
  const op = { changes };
  const rows = flatten({ ...before, transactions: [{ id: "one", amount: 2 }] });
  assert.equal(prepareOperation(op, rows).conflicts.length, 1);
});
function mockBackend() {
  let rows = {},
    receipts = new Set(),
    lost = false,
    version = 1;
  return {
    get rows() {
      return rows;
    },
    loseNextResponse() {
      lost = true;
    },
    edit(collection, id, value) {
      version++;
      rows[recordKey(collection, id)] = {
        collection,
        id,
        value,
        revision: (rows[recordKey(collection, id)]?.revision || 0) + 1,
      };
    },
    async call(name, args) {
      if (name === "kovo_sync_version") return version;
      if (name === "kovo_read_records") return Object.values(rows);
      if (receipts.has(args.p_id)) return { saved: true };
      if (
        args.p_changes.some(
          (c) =>
            (rows[recordKey(c.collection, c.id)]?.revision || 0) !== c.revision,
        )
      )
        return { saved: false };
      for (const c of args.p_changes)
        rows[recordKey(c.collection, c.id)] = {
          ...c,
          revision: c.revision + 1,
        };
      receipts.add(args.p_id);
      version++;
      if (lost) {
        lost = false;
        throw new Error("connection lost after server commit");
      }
      return { saved: true };
    },
  };
}
async function device(name) {
  await initializeLocal(name);
  return visibleData(await transact(name));
}
test("offline $42.75 entry survives reopening and lost acknowledgement, appears exactly once", async () => {
  const owner = crypto.randomUUID(),
    data = await device(owner),
    tx = { id: "tip", amount: 42.75, date: "2026-09-08", category: "Income" };
  await commitData(owner, data, { ...data, transactions: [tx] });
  assert.deepEqual(visibleData(await transact(owner)).transactions, [tx]);
  const server = mockBackend();
  server.loseNextResponse();
  await assert.rejects(synchronize(owner, server.call));
  assert.equal((await transact(owner)).queue.length, 1);
  await synchronize(owner, server.call);
  await synchronize(owner, server.call);
  assert.equal(
    Object.values(server.rows).filter((r) => r.collection === "transactions")
      .length,
    1,
  );
  assert.equal((await transact(owner)).queue.length, 0);
});
test("different device edits merge, same record conflicts remain durable", async () => {
  const a = crypto.randomUUID(),
    b = crypto.randomUUID(),
    server = mockBackend();
  const da = await device(a),
    db = await device(b);
  await commitData(a, da, { ...da, transactions: [{ id: "a", amount: 1 }] });
  await commitData(b, db, { ...db, transactions: [{ id: "b", amount: 2 }] });
  await synchronize(a, server.call);
  await synchronize(b, server.call);
  await synchronize(a, server.call);
  assert.equal(visibleData(await transact(a)).transactions.length, 2);
  const before = visibleData(await transact(a));
  await commitData(a, before, {
    ...before,
    transactions: before.transactions.map((t) =>
      t.id === "a" ? { ...t, amount: 3 } : t,
    ),
  });
  server.edit("transactions", "a", { id: "a", amount: 4 });
  const conflict = await synchronize(a, server.call);
  assert.equal(conflict.conflict.changes.length, 1);
  assert.equal(server.rows[recordKey("transactions", "a")].value.amount, 4);
  await resolveConflict(a, true);
  await synchronize(a, server.call);
  assert.equal(server.rows[recordKey("transactions", "a")].value.amount, 3);
});
test("two tabs cannot overwrite the same local edit; different records are both queued", async () => {
  const owner = crypto.randomUUID(),
    data = await device(owner);
  const results = await Promise.allSettled([
    commitData(owner, data, {
      ...data,
      settings: { ...data.settings, currency: "EUR" },
    }),
    commitData(owner, data, {
      ...data,
      settings: { ...data.settings, currency: "GBP" },
    }),
  ]);
  assert.equal(results.filter((r) => r.status === "rejected").length, 1);
  const current = visibleData(await transact(owner));
  await Promise.all([
    commitData(owner, current, {
      ...current,
      transactions: [{ id: "a", amount: 1 }],
    }),
    commitData(owner, current, {
      ...current,
      goals: [{ id: "g", target: 2, saved: 0 }],
    }),
  ]);
  const result = visibleData(await transact(owner));
  assert.equal(result.transactions.length, 1);
  assert.equal(result.goals.length, 1);
});
test("account caches are isolated and unauthenticated drafts cannot leak to another account", async () => {
  const a = crypto.randomUUID(),
    b = crypto.randomUUID(),
    data = await device(a);
  await device(b);
  await commitData(a, data, {
    ...data,
    transactions: [{ id: "private", amount: 5 }],
  });
  assert.equal(visibleData(await transact(b)).transactions.length, 0);
});
test("invalid money and dates are rejected; coach always returns one deterministic insight", () => {
  const data = emptyData();
  assert.throws(() =>
    validateChanges(data, {
      ...data,
      transactions: [
        { id: "bad", amount: 1.005, date: "2026-09-09", description: "bad" },
      ],
    }),
  );
  assert.equal(nextInsight(data).id, "setup");
  assert.equal(typeof nextInsight(data).text, "string");
});
