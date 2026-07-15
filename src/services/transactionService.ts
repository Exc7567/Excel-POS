import { supabase } from '../supabaseClient';
import type { Transaction } from '../types/transaction';
import type { CartItem, PriceType } from '../types';

// ─── Constants ──────────────────────────────────────────────────────────────
const PENDING_KEY = 'pending_transactions';
const SYNC_INTERVAL_MS = 30_000; // 30 seconds

// ─── Types ──────────────────────────────────────────────────────────────────

/** Shape of a row in the Supabase `transactions` table. */
export interface SupabaseTransactionRow {
  id: string;
  tanggal_waktu: string; // ISO 8601 / timestamptz
  tipe_harga: string;
  items: {
    nama_item: string;
    kategori: string;
    qty: number;
    harga_satuan: number;
    subtotal: number;
  }[];
  subtotal: number;
  total: number;
  bayar: number;
  kembalian: number;
  hutang: number;
  status: string;
  created_at?: string;
}

/** A pending entry queued for sync when offline. */
export interface PendingTransaction {
  action: 'insert' | 'update';
  transaction: Transaction;
  queuedAt: string; // ISO timestamp
}

// ─── Field Mapping ──────────────────────────────────────────────────────────

const priceTypeLabel = (pt: string): string => {
  switch (pt) {
    case 'grosir': return 'Grosir';
    case 'eceran': return 'Eceran';
    case 'net': return 'Net';
    default: return pt;
  }
};

const priceTypFromLabel = (label: string): PriceType => {
  switch (label) {
    case 'Grosir': return 'grosir';
    case 'Eceran': return 'eceran';
    case 'Net': return 'net';
    default: return label.toLowerCase() as PriceType;
  }
};

/**
 * Map the app's Transaction object → Supabase row format.
 */
export function mapToSupabaseRow(t: Transaction): Omit<SupabaseTransactionRow, 'created_at'> {
  return {
    id: t.id,
    tanggal_waktu: new Date(t.timestamp).toISOString(),
    tipe_harga: priceTypeLabel(t.priceType),
    items: t.items.map((item) => {
      const hargaSatuan = item.prices[item.priceType] ?? 0;
      return {
        nama_item: item.name,
        kategori: item.category ?? '',
        qty: item.quantity,
        harga_satuan: hargaSatuan,
        subtotal: hargaSatuan * item.quantity,
      };
    }),
    subtotal: t.subtotal,
    total: t.total,
    bayar: t.uangDibayar ?? 0,
    kembalian: t.kembalian ?? 0,
    hutang: t.hutang ?? 0,
    status: t.status ?? 'Lunas',
  };
}

/**
 * Map a Supabase row → the app's Transaction object.
 *
 * Because the Supabase `items` jsonb only stores summary fields
 * (nama_item, kategori, qty, harga_satuan, subtotal) and NOT the
 * full `prices` object, we reconstruct a minimal CartItem with the
 * stored price placed under the transaction's price type.
 */
export function mapFromSupabaseRow(row: SupabaseTransactionRow): Transaction {
  const priceType = priceTypFromLabel(row.tipe_harga);

  const items: CartItem[] = (row.items || []).map((item, idx) => {
    // Build a prices object with only the stored price type populated
    const prices = { net: 0, grosir: 0, eceran: 0 };
    prices[priceType] = item.harga_satuan;

    return {
      id: `${row.id}_item_${idx}`,
      name: item.nama_item,
      category: item.kategori,
      prices,
      quantity: item.qty,
      priceType,
    };
  });

  return {
    id: row.id,
    items,
    subtotal: row.subtotal,
    total: row.total,
    priceType,
    timestamp: new Date(row.tanggal_waktu),
    uangDibayar: row.bayar,
    kembalian: row.kembalian,
    status: (row.status as 'Lunas' | 'Belum Lunas') || 'Lunas',
    hutang: row.hutang,
  };
}

// ─── Supabase CRUD ──────────────────────────────────────────────────────────

/**
 * Insert a new transaction into Supabase.
 * Returns { success: true } or { success: false, error }.
 */
export async function insertTransaction(
  t: Transaction
): Promise<{ success: boolean; error?: string }> {
  try {
    const row = mapToSupabaseRow(t);
    const { error } = await supabase.from('transactions').insert(row);
    if (error) {
      console.error('[transactionService] insert failed:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('[transactionService] insert exception:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Update an existing transaction in Supabase (for Cetak Ulang).
 */
export async function updateTransactionInDb(
  t: Transaction
): Promise<{ success: boolean; error?: string }> {
  try {
    const row = mapToSupabaseRow(t);
    const { id, ...updateFields } = row;
    const { error } = await supabase
      .from('transactions')
      .update(updateFields)
      .eq('id', id);
    if (error) {
      console.error('[transactionService] update failed:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('[transactionService] update exception:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Hard-delete a single transaction from Supabase.
 * No offline fallback — if it fails, the UI must show an error.
 */
export async function deleteTransactionFromDb(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('[transactionService] delete failed:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('[transactionService] delete exception:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Delete ALL transactions from Supabase.
 */
export async function deleteAllTransactions(): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete all rows — Supabase requires a filter; use gte on id to match everything
    const { error } = await supabase
      .from('transactions')
      .delete()
      .gte('id', '');
    if (error) {
      console.error('[transactionService] delete-all failed:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('[transactionService] delete-all exception:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Fetch transactions from Supabase, optionally filtered by date range.
 * Results are ordered by tanggal_waktu descending (newest first).
 */
export async function fetchTransactions(
  startDate?: Date,
  endDate?: Date
): Promise<{ data: Transaction[]; error?: string }> {
  try {
    let query = supabase
      .from('transactions')
      .select('*')
      .order('tanggal_waktu', { ascending: false });

    if (startDate) {
      query = query.gte('tanggal_waktu', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('tanggal_waktu', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('[transactionService] fetch failed:', error.message);
      return { data: [], error: error.message };
    }

    const transactions = (data || []).map((row: any) =>
      mapFromSupabaseRow(row as SupabaseTransactionRow)
    );
    return { data: transactions };
  } catch (err: any) {
    console.error('[transactionService] fetch exception:', err);
    return { data: [], error: err?.message || 'Network error' };
  }
}

// ─── Offline Pending Queue ──────────────────────────────────────────────────

/**
 * Read the pending transactions queue from localStorage.
 */
export function getPendingTransactions(): PendingTransaction[] {
  try {
    const stored = localStorage.getItem(PENDING_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error('[transactionService] Failed to read pending queue:', err);
  }
  return [];
}

/**
 * Save the pending queue back to localStorage.
 */
function savePendingQueue(queue: PendingTransaction[]): void {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('[transactionService] Failed to save pending queue:', err);
  }
}

/**
 * Add a transaction to the offline pending queue.
 */
export function addToPendingQueue(action: 'insert' | 'update', transaction: Transaction): void {
  const queue = getPendingTransactions();

  // If this transaction is already in the queue, replace it (latest state wins)
  const existingIdx = queue.findIndex((p) => p.transaction.id === transaction.id);
  const entry: PendingTransaction = {
    action,
    transaction,
    queuedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    queue[existingIdx] = entry;
  } else {
    queue.push(entry);
  }

  savePendingQueue(queue);
}

/**
 * Attempt to sync all pending transactions to Supabase.
 * Returns the number of successfully synced items.
 */
export async function syncPendingTransactions(): Promise<number> {
  const queue = getPendingTransactions();
  if (queue.length === 0) return 0;

  let syncedCount = 0;
  const remaining: PendingTransaction[] = [];

  for (const entry of queue) {
    let result: { success: boolean };

    if (entry.action === 'insert') {
      result = await insertTransaction(entry.transaction);
    } else {
      result = await updateTransactionInDb(entry.transaction);
    }

    if (result.success) {
      syncedCount++;
    } else {
      remaining.push(entry);
    }
  }

  savePendingQueue(remaining);
  return syncedCount;
}

/**
 * Clear the pending queue (used after delete-all).
 */
export function clearPendingQueue(): void {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch (err) {
    console.error('[transactionService] Failed to clear pending queue:', err);
  }
}

// ─── Sync Interval Manager ─────────────────────────────────────────────────

let syncIntervalId: ReturnType<typeof setInterval> | null = null;
let onSyncCallback: ((count: number) => void) | null = null;

async function runSync() {
  const count = await syncPendingTransactions();
  if (count > 0 && onSyncCallback) {
    onSyncCallback(count);
  }
}

/**
 * Start the background sync interval + online event listener.
 * Calls `onSync(count)` whenever pending items are successfully synced.
 */
export function startSyncInterval(onSync: (count: number) => void): void {
  onSyncCallback = onSync;

  // Clear any existing interval
  stopSyncInterval();

  // Periodic retry
  syncIntervalId = setInterval(runSync, SYNC_INTERVAL_MS);

  // Sync immediately when browser comes back online
  window.addEventListener('online', runSync);
}

/**
 * Stop the background sync interval and remove the online listener.
 */
export function stopSyncInterval(): void {
  if (syncIntervalId !== null) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
  window.removeEventListener('online', runSync);
  onSyncCallback = null;
}
