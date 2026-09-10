import { diffData } from "./records.js";
import { toCents } from "./money.js";
import { dateNumber } from "./planning.js";
export function validateChanges(before, after) {
  for (const change of diffData(before, after)) {
    const value = change.value;
    if (!value || typeof value !== "object") continue;
    for (const field of [
      "amount",
      "balance",
      "limit",
      "target",
      "saved",
      "price",
    ])
      if (field in value) {
        if (!Number.isFinite(value[field]))
          throw new Error("Enter a valid amount.");
        toCents(value[field]);
        if (
          ["limit", "target", "saved", "price"].includes(field) &&
          value[field] < 0
        )
          throw new Error("Use a positive amount.");
      }
    if (change.collection === "transactions") {
      dateNumber(value.date);
      if (!value.description?.trim()) throw new Error("Add a description.");
    }
    if (change.collection === "goals" && value.target <= 0)
      throw new Error("Set a goal target greater than zero.");
    if (
      change.collection === "bills" &&
      (!Number.isInteger(value.dueDay) ||
        value.dueDay < 1 ||
        value.dueDay > 31 ||
        value.amount < 0)
    )
      throw new Error("Choose a bill day from 1 to 31 and a positive amount.");
    if (change.collection === "investments")
      for (const holding of value.holdings) {
        if (
          !Number.isFinite(holding.shares) ||
          holding.shares < 0 ||
          !Number.isFinite(holding.price) ||
          holding.price < 0
        )
          throw new Error("Use valid, positive holdings.");
      }
  }
}
