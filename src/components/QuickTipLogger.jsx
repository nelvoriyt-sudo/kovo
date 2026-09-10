import React, { useRef, useState } from "react";

import { toCents, percentageCents, splitPool } from "../lib/money.js";
import { todayISO, dateNumber, addDays } from "../lib/planning.js";
const toDollars = (cents) => cents / 100;
const previewCents = (value) => {
  try {
    return toCents(value);
  } catch {
    return 0;
  }
};

export default function QuickTipLogger({ data, setData }) {
  const saving = useRef(false);
  const [busy, setBusy] = useState(false);
  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: data.settings.currency || "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState({
    shiftDate: todayISO(data.settings.timeZone),
    shiftLabel: "",
    cashTips: "",
    cardTips: "",
    tipOut: "",
    notes: "",
    startTime: "",
    endTime: "",
    cardAvailableDate: "",
    poolPercent: "",
    poolPeople: "1",
  });

  const cashCents = previewCents(draft.cashTips);
  const cardCents = previewCents(draft.cardTips);
  const tipOutCents = previewCents(draft.tipOut);
  const netTipCents = cashCents + cardCents - tipOutCents;

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setMessage("");
  };

  const saveTipEntry = async () => {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    try {
      const cash = toCents(draft.cashTips),
        card = toCents(draft.cardTips),
        out = toCents(draft.tipOut);
      if (
        cash < 0 ||
        card < 0 ||
        out < 0 ||
        cash + card <= 0 ||
        out > cash + card
      )
        throw new Error(
          "Enter positive tips and a tip out no greater than the total.",
        );
      dateNumber(draft.shiftDate);
      const available = draft.cardAvailableDate || draft.shiftDate;
      dateNumber(available);
      if (available < draft.shiftDate)
        throw new Error("Card tips cannot be available before the shift date.");
      const id = crypto.randomUUID(),
        createdAt = new Date().toISOString();
      const timeZone =
        data.settings.timeZone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone;
      const label = draft.shiftLabel.trim() || "Shift tips";
      // Tip-out is deducted from cash first; the remainder is deducted from card tips.
      const cashNet = Math.max(0, cash - out),
        cardNet = card - Math.max(0, out - cash);
      const transactions = [
        {
          id: `${id}-cash`,
          amount: cashNet / 100,
          date: draft.shiftDate,
          availableDate: draft.shiftDate,
          description: `${label} · cash`,
        },
        {
          id: `${id}-card`,
          amount: cardNet / 100,
          date: draft.shiftDate,
          availableDate: available,
          description: `${label} · card`,
        },
      ]
        .filter((t) => t.amount > 0)
        .map((t) => ({
          ...t,
          category: "Income",
          source: "tip-entry",
          sourceId: id,
          timeZone,
          createdAt,
        }));
      const tipEntry = {
        id,
        shiftDate: draft.shiftDate,
        shiftLabel: label,
        cashTipsCents: cash,
        cardTipsCents: card,
        tipOutCents: out,
        netTipCents: cash + card - out,
        timeZone,
        startTime: draft.startTime,
        endTime: draft.endTime,
        endDate:
          draft.startTime && draft.endTime && draft.endTime <= draft.startTime
            ? addDays(draft.shiftDate, 1)
            : draft.shiftDate,
        cardAvailableDate: available,
        notes: draft.notes.trim(),
        transactionIds: transactions.map((t) => t.id),
        createdAt,
      };
      if (
        !(await setData({
          ...data,
          transactions: [...transactions, ...data.transactions],
          tipEntries: [tipEntry, ...(data.tipEntries || [])],
        }))
      ) {
        setMessage(
          "Tip entry was not saved. Keep this form open and check the storage message.",
        );
        return;
      }
      setDraft({
        shiftDate: todayISO(timeZone),
        shiftLabel: "",
        cashTips: "",
        cardTips: "",
        tipOut: "",
        notes: "",
        startTime: "",
        endTime: "",
        cardAvailableDate: "",
        poolPercent: "",
        poolPeople: "1",
      });
      setMessage(
        `${formatMoney((cash + card - out) / 100)} saved on this device.`,
      );
      setOpen(false);
      window.dispatchEvent(
        new CustomEvent("kovo-open-page", { detail: { page: "ledger" } }),
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  const calculatePool = () => {
    try {
      const pool = percentageCents(
        toCents(draft.cashTips) + toCents(draft.cardTips),
        draft.poolPercent,
      );
      const shares = splitPool(pool, Number(draft.poolPeople));
      updateDraft("tipOut", String(pool / 100));
      setMessage(
        `Pool: ${formatMoney(pool / 100)}. Shares in participant order: ${shares.map((c) => formatMoney(c / 100)).join(", ")}. Remaining cents go to the first participants.`,
      );
    } catch (error) {
      setMessage(error.message);
    }
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
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close tip logger"
            >
              ×
            </button>
          </div>

          <label>
            Shift date
            <input
              type="date"
              value={draft.shiftDate}
              onChange={(event) => updateDraft("shiftDate", event.target.value)}
            />
          </label>
          <label>
            Shift label
            <input
              value={draft.shiftLabel}
              onChange={(event) =>
                updateDraft("shiftLabel", event.target.value)
              }
              placeholder="Friday dinner"
            />
          </label>
          <div className="tip-grid">
            <label>
              Cash tips
              <input
                inputMode="decimal"
                type="number"
                min="0"
                step="0.01"
                value={draft.cashTips}
                onChange={(event) =>
                  updateDraft("cashTips", event.target.value)
                }
                placeholder="0.00"
              />
            </label>
            <label>
              Card tips
              <input
                inputMode="decimal"
                type="number"
                min="0"
                step="0.01"
                value={draft.cardTips}
                onChange={(event) =>
                  updateDraft("cardTips", event.target.value)
                }
                placeholder="0.00"
              />
            </label>
          </div>
          <label>
            Tip out
            <input
              inputMode="decimal"
              type="number"
              min="0"
              step="0.01"
              value={draft.tipOut}
              onChange={(event) => updateDraft("tipOut", event.target.value)}
              placeholder="0.00"
            />
          </label>
          <div className="tip-grid">
            <label>
              Shift starts
              <input
                type="time"
                value={draft.startTime}
                onChange={(e) => updateDraft("startTime", e.target.value)}
              />
            </label>
            <label>
              Shift ends
              <input
                type="time"
                value={draft.endTime}
                onChange={(e) => updateDraft("endTime", e.target.value)}
              />
            </label>
          </div>
          <p className="small">
            Times use{" "}
            {data.settings.timeZone ||
              Intl.DateTimeFormat().resolvedOptions().timeZone}
            . An end time before the start means the following day. Shift date
            stays the starting date.
          </p>
          <label>
            Card tips available on
            <input
              type="date"
              value={draft.cardAvailableDate || draft.shiftDate}
              onChange={(e) => updateDraft("cardAvailableDate", e.target.value)}
            />
          </label>
          <details>
            <summary>Calculate a tip pool</summary>
            <label>
              Pool percentage
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={draft.poolPercent}
                onChange={(e) => updateDraft("poolPercent", e.target.value)}
              />
            </label>
            <label>
              People sharing the pool
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                value={draft.poolPeople}
                onChange={(e) => updateDraft("poolPeople", e.target.value)}
              />
            </label>
            <button type="button" onClick={calculatePool}>
              Calculate and use as tip out
            </button>
          </details>
          <p className="small">
            Tip out is deducted from cash first, then card tips. Amounts are
            entered in {data.settings.currency || "USD"}.
          </p>
          <label>
            Notes
            <textarea
              value={draft.notes}
              onChange={(event) => updateDraft("notes", event.target.value)}
              placeholder="Tip pool, section, slow shift, etc."
              rows="2"
            />
          </label>

          <div className="tip-total">
            <span>Net tips</span>
            <strong>{formatMoney(toDollars(netTipCents))}</strong>
          </div>
          <button
            className="tip-save"
            type="button"
            disabled={busy}
            onClick={saveTipEntry}
          >
            {busy ? "Saving…" : "Save tip entry"}
          </button>
          {message && (
            <div className="tip-message" role="status">
              {message}
            </div>
          )}
        </div>
      )}
      <button
        className="tip-fab"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        + Log tips
      </button>
    </div>
  );
}
