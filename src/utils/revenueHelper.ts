import type { Transaction } from '../types/transaction';

/**
 * Returns the actual revenue (money received) for a single transaction.
 *
 * - Lunas transactions: full total (or uangDibayar if total is missing)
 * - Belum Lunas transactions: only the amount actually paid (uangDibayar),
 *   capped at total to handle data anomalies.
 *
 * Edge cases:
 * - If uangDibayar is missing on a Lunas transaction, we treat it as bayar = total.
 * - If uangDibayar is missing on a Belum Lunas transaction, we return 0 and log a warning.
 * - If uangDibayar exceeds total on a Belum Lunas transaction, we cap at total and log a warning.
 */
export function getActualRevenue(t: Transaction): number {
  const status = t.status ?? 'Lunas';

  if (status === 'Lunas') {
    // For Lunas, bayar and total should be equivalent; use total
    // If uangDibayar is missing, treat as bayar = total (old records)
    return t.total;
  }

  // Belum Lunas — use only the amount actually paid
  if (t.uangDibayar === undefined || t.uangDibayar === null) {
    // Missing bayar on a Belum Lunas record — flag this
    console.warn(
      `[Revenue] Belum Lunas transaction ${t.id} is missing uangDibayar. ` +
      `Contributing 0 to Total Pendapatan. Please check this record.`
    );
    return 0;
  }

  if (t.uangDibayar > t.total) {
    // Data anomaly: bayar exceeds total — cap at total
    console.warn(
      `[Revenue] Belum Lunas transaction ${t.id} has uangDibayar (${t.uangDibayar}) ` +
      `exceeding total (${t.total}). Capping at total.`
    );
    return t.total;
  }

  return t.uangDibayar;
}
