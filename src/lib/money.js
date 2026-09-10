/** Decimal text to integer cents. Reject excess precision instead of silently rounding entries. */
export function toCents(value) {
  const text = String(value ?? "").trim() || "0";
  if (!/^-?\d+(\.\d{0,2})?$/.test(text))
    throw new Error("Enter an amount with no more than two decimal places.");
  const [whole, fraction = ""] = text.replace("-", "").split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > 100000000000)
    throw new Error("That amount is too large.");
  return text.startsWith("-") ? -cents : cents;
}
export function sumMoney(values) {
  return values.reduce((sum, value) => sum + toCents(value), 0) / 100;
}
export function percentageCents(cents, percent) {
  const basisPoints = toCents(percent);
  if (
    !Number.isSafeInteger(cents) ||
    cents < 0 ||
    basisPoints < 0 ||
    basisPoints > 10000
  )
    throw new Error("Use a percentage from 0 to 100.");
  return Number((BigInt(cents) * BigInt(basisPoints) + 5000n) / 10000n);
}
/** Equal shares; first participants receive remaining cents in the displayed order. */
export function splitPool(cents, people) {
  if (
    !Number.isSafeInteger(cents) ||
    cents < 0 ||
    !Number.isInteger(people) ||
    people < 1 ||
    people > 100
  )
    throw new Error("Choose 1 to 100 people.");
  return Array.from(
    { length: people },
    (_, index) => Math.floor(cents / people) + (index < cents % people ? 1 : 0),
  );
}
