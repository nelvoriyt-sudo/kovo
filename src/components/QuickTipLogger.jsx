import React, { useState } from "react";

const DATA_KEY = "kovo-finance-data-v2";
const CENTS_PER_DOLLAR = 100;
const FALLBACK_PERSIST_DELAY_MS = 700;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function createId(prefix) {
  const randomPart = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${randomPart}`;
}

function parseStoredData() {
  try {
    return JSON.parse(localStorage.getItem(DATA_KEY) || "null");
  } catch {
    return null;
  }
}

function writeStoredData(data) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

function toCents(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? Math.round(amount * CENTS_PER_DOLLAR) : 0;
}

function toDollars(cents) {
  return Math.round(cents) / CENTS_PER_DOLLAR;
}

function formatMoney(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

function upsertById(list = [], item) {
  const existingIndex = list.findIndex((candidate) => candidate.id === item.id);
  if (existingIndex === -1) return [item, ...list];

  const next = [...list];
  next[existingIndex] = item;
  return next;
}

function transactionAlreadyStored(transactionId) {
  const storedData = parseStoredData();
  return Boolean(storedData?.transactions?.some((transaction) => transaction.id === transactionId));
}

function saveTipToLocalStorage(transaction, tipEntry) {
  const storedData = parseStoredData() || {};

  writeStoredData({
    ...storedData,
    transactions: upsertById(storedData.transactions || [], transaction),
    tipEntries: upsertById(storedData.tipEntries || [], tipEntry),
  });
}

function notifyAppOfNewTip(transaction, tipEntry) {
  // Canonical path: notify the running App instance so React state updates
  // immediately and the normal autosave/sync path owns persistence.
  window.dispatchEvent(new CustomEvent("kovo-tip-added", { detail: { transaction, tipEntry } }));
  window.dispatchEvent(new CustomEvent("kovo-open-page", { detail: { page: "ledger" } }));

  // Fallback path: if the App listener is not attached yet or a stale build is
  // still cached on the device, persist exactly the same IDs once. This avoids
  // duplicate income rows while still protecting offline tip entries.
  window.setTimeout(() => {
    if (transactionAlreadyStored(transaction.id)) return;
    saveTipToLocalStorage(transaction, tipEntry);
    window.location.reload();
  }, FALLBACK_PERSIST_DELAY_MS);
}

function TipLoggerStyles() {
  return (
    <style>{`
      .tip-capture { position: fixed; right: 18px; bottom: 18px; z-index: 60; font-family: Manrope, system-ui, sans-serif; }
      .tip-fab { min-width: 96px; height: 46px; border: 0; border-radius: 999px; background: #244d36; color: #fff; box-shadow: 0 12px 28px rgba(22, 51, 34, 0.22); cursor: pointer; font: 750 14px Manrope, system-ui, sans-serif; }
      .tip-fab:hover, .tip-fab:focus-visible { background: #1d402d; }
      .tip-card { width: min(360px, calc(100vw - 28px)); margin-bottom: 12px; padding: 16px; border: 1px solid #d7ded7; border-radius: 12px; background: #f8faf7; color: #17231c; box-shadow: 0 24px 70px rgba(20, 40, 28, 0.24); }
      .tip-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
      .tip-card-head strong { display: block; font-size: 16px; letter-spacing: -0.02em; }
      .tip-card-head span { display: block; margin-top: 3px; color: #657269; font-size: 12px; line-height: 1.45; }
      .tip-card-head button { border: 0; background: transparent; color: #647269; cursor: pointer; font-size: 24px; line-height: 1; }
      .tip-card label { display: grid; gap: 6px; margin-bottom: 11px; color: #39483e; font-size: 12px; font-weight: 700; }
      .tip-card input, .tip-card textarea { width: 100%; border: 1px solid #cbd5cc; border-radius: 7px; background: #fff; color: #17231c; font: 16px Manrope, system-ui, sans-serif; outline: none; }
      .tip-card input { height: 42px; padding: 0 11px; }
      .tip-card textarea { resize: vertical; min-height: 58px; padding: 10px 11px; }
      .tip-card input:focus, .tip-card textarea:focus { border-color: #50745e; box-shadow: 0 0 0 3px rgba(80, 116, 94, 0.11); }
      .tip-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .tip-total { display: flex; align-items: center; justify-content: space-between; margin: 6px 0 12px; padding: 11px 12px; border-radius: 8px; background: #eef2ed; color: #405046; font-size: 13px; }
      .tip-total strong { color: #17231c; font-size: 17px; }
      .tip-save { width: 100%; height: 44px; border: 1px solid #244d36; border-radius: 7px; background: #244d36; color: #fff; cursor: pointer; font: 750 13px Manrope, system-ui, sans-serif; }
      .tip-save:hover, .tip-save:focus-visible { background: #1d402d; }
      .tip-message { margin-top: 10px; padding: 9px 10px; border: 1px solid #d7ded7; border-radius: 7px; background: #eef2ed; color: #405046; font-size: 12px; line-height: 1.45; }
      @media (max-width: 780px) { .tip-capture { right: 12px; bottom: calc(82px + env(safe-area-inset-bottom)); } .tip-card { max-height: calc(100dvh - 150px); overflow: auto; } }
    `}</style>
  );
}

export default function QuickTipLogger() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState({
    shiftDate: todayISO(),
    shiftLabel: "",
    cashTips: "",
    cardTips: "",
    tipOut: "",
    notes: "",
  });

  const cashCents = toCents(draft.cashTips);
  const cardCents = toCents(draft.cardTips);
  const tipOutCents = toCents(draft.tipOut);
  const netTipCents = cashCents + cardCents - tipOutCents;
  const canSave = draft.shiftDate && netTipCents !== 0;

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setMessage("");
  };

  const saveTipEntry = () => {
    if (!canSave) {
      setMessage("Enter a shift date and at least one tip amount.");
      return;
    }

    const tipEntryId = createId("tip");
    const transactionId = createId("tx_tip");
    const shiftLabel = draft.shiftLabel.trim() || "Shift tips";
    const netTipAmount = toDollars(netTipCents);
    const createdAt = new Date().toISOString();

    const tipEntry = {
      id: tipEntryId,
      shiftDate: draft.shiftDate,
      shiftLabel,
      cashTipsCents: cashCents,
      cardTipsCents,
      tipOutCents,
      netTipCents,
      notes: draft.notes.trim(),
      transactionId,
      createdAt,
      syncStatus: navigator.onLine ? "pending" : "offline-pending",
    };

    const transaction = {
      id: transactionId,
      date: draft.shiftDate,
      description: shiftLabel,
      category: "Income",
      amount: netTipAmount,
      source: "tip-entry",
      sourceId: tipEntryId,
      createdAt,
    };

    notifyAppOfNewTip(transaction, tipEntry);

    setDraft({ shiftDate: todayISO(), shiftLabel: "", cashTips: "", cardTips: "", tipOut: "", notes: "" });
    setMessage(`${formatMoney(netTipAmount)} saved to Ledger.`);
    setOpen(false);
  };

  return (
    <div className={`tip-capture ${open ? "open" : ""}`}>
      <TipLoggerStyles />
      {open && (
        <div className="tip-card" role="dialog" aria-label="Log shift tips">
          <div className="tip-card-head">
            <div>
              <strong>Log shift tips</strong>
              <span>Works offline and syncs when Kovo reconnects.</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close tip logger">×</button>
          </div>

          <label>Shift date<input type="date" value={draft.shiftDate} onChange={(event) => updateDraft("shiftDate", event.target.value)} /></label>
          <label>Shift label<input value={draft.shiftLabel} onChange={(event) => updateDraft("shiftLabel", event.target.value)} placeholder="Friday dinner" /></label>
          <div className="tip-grid">
            <label>Cash tips<input inputMode="decimal" type="number" min="0" step="0.01" value={draft.cashTips} onChange={(event) => updateDraft("cashTips", event.target.value)} placeholder="0.00" /></label>
            <label>Card tips<input inputMode="decimal" type="number" min="0" step="0.01" value={draft.cardTips} onChange={(event) => updateDraft("cardTips", event.target.value)} placeholder="0.00" /></label>
          </div>
          <label>Tip out<input inputMode="decimal" type="number" min="0" step="0.01" value={draft.tipOut} onChange={(event) => updateDraft("tipOut", event.target.value)} placeholder="0.00" /></label>
          <label>Notes<textarea value={draft.notes} onChange={(event) => updateDraft("notes", event.target.value)} placeholder="Tip pool, section, slow shift, etc." rows="2" /></label>

          <div className="tip-total"><span>Net tips</span><strong>{formatMoney(toDollars(netTipCents))}</strong></div>
          <button className="tip-save" type="button" onClick={saveTipEntry}>Save tip entry</button>
          {message && <div className="tip-message" role="status">{message}</div>}
        </div>
      )}
      <button className="tip-fab" type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open}>+ Tips</button>
    </div>
  );
}
