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
      <TipLoggerStyles />
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
        + Tips
      </button>
    </div>
  );
}
