import React, { useState } from "react";
import { conservativePlan, todayISO, dateNumber } from "../lib/planning.js";
import { toCents } from "../lib/money.js";
export default function IncomePlan({ data, setData, cur }) {
  const [draft, setDraft] = useState({
    cadence: data.settings.cadence || "weekly",
    payAnchor: data.settings.payAnchor || todayISO(),
    trackingSince: data.settings.trackingSince || todayISO(),
    timeZone:
      data.settings.timeZone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    baseline: String((data.settings.baselineCents || 0) / 100),
    reserve: String((data.settings.reserveCents || 0) / 100),
  });
  const [message, setMessage] = useState("");
  const update = (key, value) => setDraft({ ...draft, [key]: value });
  const plan = conservativePlan(data),
    money = (c) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: cur,
      }).format(c / 100);
  const save = async (e) => {
    e.preventDefault();
    try {
      dateNumber(draft.payAnchor);
      dateNumber(draft.trackingSince);
      todayISO(draft.timeZone);
      const baselineCents = toCents(draft.baseline),
        reserveCents = toCents(draft.reserve);
      if (baselineCents < 0 || reserveCents < 0)
        throw new Error("Use zero or positive amounts.");
      if (
        await setData({
          ...data,
          settings: {
            ...data.settings,
            cadence: draft.cadence,
            payAnchor: draft.payAnchor,
            trackingSince: draft.trackingSince,
            timeZone: draft.timeZone,
            baselineCents,
            reserveCents,
          },
        })
      )
        setMessage("Income plan saved.");
    } catch (error) {
      setMessage(error.message);
    }
  };
  return (
    <details className="panel income-plan" open={!data.settings.cadence}>
      <summary>Variable-income plan</summary>
      <p>
        Plan from the lowest of your last four complete tracked periods.
        Zero-income periods count. Pending card tips count on their availability
        date.
      </p>
      <form onSubmit={save} className="plan-form">
        <label>
          Pay rhythm
          <select
            className="field"
            value={draft.cadence}
            onChange={(e) => update("cadence", e.target.value)}
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every two weeks</option>
            <option value="daily">Daily / cash in hand</option>
            <option value="irregular">
              Irregular — manual planning window
            </option>
          </select>
        </label>
        <label>
          First day of a pay period
          <input
            className="field"
            type="date"
            required
            value={draft.payAnchor}
            onChange={(e) => update("payAnchor", e.target.value)}
          />
        </label>
        <label>
          Tracking is complete from
          <input
            className="field"
            type="date"
            required
            value={draft.trackingSince}
            onChange={(e) => update("trackingSince", e.target.value)}
          />
        </label>
        <label>
          Time zone
          <input
            className="field"
            required
            value={draft.timeZone}
            onChange={(e) => update("timeZone", e.target.value)}
          />
        </label>
        <label>
          Cautious baseline per period
          <input
            className="field"
            type="number"
            min="0"
            step="0.01"
            value={draft.baseline}
            onChange={(e) => update("baseline", e.target.value)}
          />
        </label>
        <label>
          Essentials reserved per period
          <input
            className="field"
            type="number"
            min="0"
            step="0.01"
            value={draft.reserve}
            onChange={(e) => update("reserve", e.target.value)}
          />
        </label>
        <button className="btn-primary">Save income plan</button>
      </form>
      <p role="status">{message}</p>
      <p>
        Planning baseline: <strong>{money(plan.baseline)}</strong>. After
        reserved essentials: <strong>{money(plan.available)}</strong>.
      </p>
      <p className="small">
        {plan.manual
          ? "Using your manual baseline until complete tracked periods are available. For irregular income, this applies to the planning window you choose."
          : `${plan.periods.length} complete periods used. Your positive manual baseline also caps the estimate.`}{" "}
        This is a spending plan, not a bank balance or promised income. Category
        budgets below are monthly; the reserve above is per pay period.
      </p>
    </details>
  );
}
