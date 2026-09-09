import React, { useState } from "react";

const DATA_KEY = "kovo-finance-data-v2";
const CENTS_PER_DOLLAR = 100;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function createId(prefix) {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${randomPart}`;
}

function parseStoredData() {
  try {
    return JSON.parse(localStorage.getItem(DATA_KEY) || "null");
  } catch {
    return null;
  }
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
    const currentData = parseStoredData();
    if (!currentData) {
      setMessage("Kovo is still opening. Try again in a moment.");
      return;
    }

    if (!canSave) {
      setMessage("Enter a shift date and at least one tip amount.");
      return;
    }

    const tipEntryId = createId("tip");
    const transactionId = createId("tx_tip");
    const shiftLabel = draft.shiftLabel.trim() || "Shift tips";
    const netTipAmount = toDollars(netTipCents);

    const tipEntry = {
      id: tipEntryId,
      shiftDate: draft.shiftDate,
      shiftLabel,
      cashTipsCents: cashCents,
      cardTipsCents: cardCents,
      tipOutCents,
      netTipCents,
      notes: draft.notes.trim(),
      transactionId,
      createdAt: new Date().toISOString(),
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
      createdAt: tipEntry.createdAt,
    };

    const nextData = {
      ...currentData,
      tipEntries: [tipEntry, ...(currentData.tipEntries || [])],
      transactions: [transaction, ...(currentData.transactions || [])],
    };

    localStorage.setItem(DATA_KEY, JSON.stringify(nextData));
    setDraft({
      shiftDate: todayISO(),
      shiftLabel: "",
      cashTips: "",
      cardTips: "",
      tipOut: "",
      notes: "",
    });
    setMessage(`${formatMoney(netTipAmount)} saved. It will sync automatically.`);

    window.setTimeout(() => window.location.reload(), 450);
  };

  return (
    <div className={`tip-capture ${open ? "open" : ""}`}>
      {open && (
        <div className="tip-card" role="dialog" aria-label="Log shift tips">
          <div className="tip-card-head">
            <div>
              <strong>Log shift tips</strong>
              <span>Works offline and syncs when Kovo reconnects.</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close tip logger">×</button>
          </div>

          <label>
            Shift date
            <input type="date" value={draft.shiftDate} onChange={(event) => updateDraft("shiftDate", event.target.value)} />
          </label>
          <label>
            Shift label
            <input value={draft.shiftLabel} onChange={(event) => updateDraft("shiftLabel", event.target.value)} placeholder="Friday dinner" />
          </label>
          <div className="tip-grid">
            <label>
              Cash tips
              <input inputMode="decimal" type="number" min="0" step="0.01" value={draft.cashTips} onChange={(event) => updateDraft("cashTips", event.target.value)} placeholder="0.00" />
            </label>
            <label>
              Card tips
              <input inputMode="decimal" type="number" min="0" step="0.01" value={draft.cardTips} onChange={(event) => updateDraft("cardTips", event.target.value)} placeholder="0.00" />
            </label>
          </div>
          <label>
            Tip out
            <input inputMode="decimal" type="number" min="0" step="0.01" value={draft.tipOut} onChange={(event) => updateDraft("tipOut", event.target.value)} placeholder="0.00" />
          </label>
          <label>
            Notes
            <textarea value={draft.notes} onChange={(event) => updateDraft("notes", event.target.value)} placeholder="Tip pool, section, slow shift, etc." rows="2" />
          </label>

          <div className="tip-total">
            <span>Net tips</span>
            <strong>{formatMoney(toDollars(netTipCents))}</strong>
          </div>
          <button className="tip-save" type="button" onClick={saveTipEntry}>Save tip entry</button>
          {message && <div className="tip-message" role="status">{message}</div>}
        </div>
      )}
      <button className="tip-fab" type="button" onClick={() => setOpen((current) => !current)}>
        + Tips
      </button>
    </div>
  );
}
