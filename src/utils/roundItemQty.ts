/**
 * Round a decimal quantity to a whole number for display purposes (e.g. item counts).
 *
 * Rules:
 * - 0.1–0.9 → 1 (any sub-1 fractional item counts as 1 whole item)
 * - ≥1: fractional ≤0.5 → floor, fractional >0.5 → ceil
 * - 0 or negative → 0
 */
export function roundItemQty(qty: number): number {
  if (qty <= 0) return 0;
  if (qty < 1) return 1;
  const frac = qty - Math.floor(qty);
  return frac > 0.5 ? Math.ceil(qty) : Math.floor(qty);
}
