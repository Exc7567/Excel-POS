import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Transaction } from '../types/transaction';
import { getActualRevenue } from '../utils/revenueHelper';
import { roundItemQty } from '../utils/roundItemQty';
import {
  fetchTransactions as fetchFromSupabase,
  insertTransaction as insertIntoSupabase,
  updateTransactionInDb,
  deleteTransactionFromDb,
  deleteAllTransactions as deleteAllFromSupabase,
  addToPendingQueue,
  getPendingTransactions,
  clearPendingQueue,
  startSyncInterval,
  stopSyncInterval,
} from '../services/transactionService';

export interface TransactionWithPending extends Transaction {
  _pendingSync?: boolean;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<TransactionWithPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // ── Load from Supabase on mount, merge pending ──────────────────────────
  const refreshTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await fetchFromSupabase();

    if (!mountedRef.current) return;

    if (fetchError) {
      setError(fetchError);
      // Even on error, show any pending transactions so no sale is invisible
      const pending = getPendingTransactions();
      const pendingTxns: TransactionWithPending[] = pending.map((p) => ({
        ...p.transaction,
        timestamp: new Date(p.transaction.timestamp),
        _pendingSync: true,
      }));
      setTransactions(pendingTxns);
    } else {
      // Merge: Supabase data + any pending items not yet in Supabase
      const pending = getPendingTransactions();
      const supabaseIds = new Set(data.map((t) => t.id));
      const pendingTxns: TransactionWithPending[] = pending
        .filter((p) => !supabaseIds.has(p.transaction.id))
        .map((p) => ({
          ...p.transaction,
          timestamp: new Date(p.transaction.timestamp),
          _pendingSync: true,
        }));

      const merged: TransactionWithPending[] = [
        ...pendingTxns,
        ...data.map((t) => ({ ...t, _pendingSync: false })),
      ];

      // Sort by timestamp descending (newest first)
      merged.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setTransactions(merged);
    }

    setLoading(false);
  }, []);

  // ── Mount/unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    refreshTransactions();

    // Start background sync — on successful sync, refresh the list
    startSyncInterval((syncedCount) => {
      if (syncedCount > 0 && mountedRef.current) {
        refreshTransactions();
      }
    });

    return () => {
      mountedRef.current = false;
      stopSyncInterval();
    };
  }, [refreshTransactions]);

  // ── Add Transaction (checkout) ──────────────────────────────────────────
  const addTransaction = useCallback(
    async (transaction: Transaction): Promise<{ success: boolean }> => {
      // Optimistically add to state immediately
      const txnWithPending: TransactionWithPending = { ...transaction, _pendingSync: true };
      setTransactions((prev) => [txnWithPending, ...prev]);

      // Attempt Supabase insert
      const result = await insertIntoSupabase(transaction);

      if (result.success) {
        // Mark as synced in state
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === transaction.id ? { ...t, _pendingSync: false } : t
          )
        );
      } else {
        // Save to offline queue — the item stays in UI with pending badge
        addToPendingQueue('insert', transaction);
      }

      return { success: result.success };
    },
    []
  );

  // ── Update Transaction (Cetak Ulang) ────────────────────────────────────
  const updateTransaction = useCallback(
    async (transaction: Transaction): Promise<{ success: boolean }> => {
      // Optimistically update in state
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transaction.id
            ? { ...transaction, _pendingSync: true }
            : t
        )
      );

      // Attempt Supabase update
      const result = await updateTransactionInDb(transaction);

      if (result.success) {
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === transaction.id ? { ...t, _pendingSync: false } : t
          )
        );
      } else {
        addToPendingQueue('update', transaction);
      }

      return { success: result.success };
    },
    []
  );

  // ── Delete Single Transaction ───────────────────────────────────────────
  const deleteTransaction = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      const result = await deleteTransactionFromDb(id);

      if (result.success) {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Gagal menghapus transaksi' };
      }
    },
    []
  );

  // ── Delete All Transactions ─────────────────────────────────────────────
  const deleteAll = useCallback(
    async (): Promise<{ success: boolean; error?: string }> => {
      const result = await deleteAllFromSupabase();

      if (result.success) {
        clearPendingQueue();
        setTransactions([]);
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Gagal menghapus semua data' };
      }
    },
    []
  );

  // ── Stats (computed from current in-memory list) ────────────────────────
  const stats = useMemo(() => {
    const totalRevenue = transactions.reduce(
      (sum, t) => sum + getActualRevenue(t),
      0
    );
    const totalCount = transactions.length;
    const averageTransaction = totalCount > 0 ? totalRevenue / totalCount : 0;
    const totalItems = transactions.reduce(
      (sum, t) =>
        sum + t.items.reduce((s, i) => s + roundItemQty(i.quantity), 0),
      0
    );

    return {
      totalRevenue,
      totalCount,
      averageTransaction,
      totalItems,
    };
  }, [transactions]);

  return {
    transactions,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteAll,
    refreshTransactions,
    stats,
  };
}
