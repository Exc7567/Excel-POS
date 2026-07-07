import { useState, useCallback, useMemo } from 'react';
import type { Transaction, TransactionFilter } from '../types/transaction';

const TRANSACTIONS_KEY = 'pos_transactions';

function loadTransactions(): Transaction[] {
  try {
    const stored = localStorage.getItem(TRANSACTIONS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((t: Transaction) => ({
        ...t,
        timestamp: new Date(t.timestamp),
      }));
    }
  } catch (error) {
    console.error('Failed to load transactions:', error);
  }
  return [];
}

function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Failed to save transactions:', error);
  }
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadTransactions()
  );

  const addTransaction = useCallback((transaction: Transaction) => {
    setTransactions((prev) => {
      const updated = [transaction, ...prev];
      saveTransactions(updated);
      return updated;
    });
  }, []);

  const updateTransaction = useCallback((transaction: Transaction) => {
    setTransactions((prev) => {
      const updated = prev.map((t) =>
        t.id === transaction.id ? { ...transaction } : t
      );
      saveTransactions(updated);
      return updated;
    });
  }, []);

  const getTransaction = useCallback(
    (id: string): Transaction | undefined => {
      return transactions.find((t) => t.id === id);
    },
    [transactions]
  );

  const filterTransactions = useCallback(
    (filter: TransactionFilter): Transaction[] => {
      return transactions.filter((t) => {
        const timestamp = new Date(t.timestamp);

        if (filter.startDate && timestamp < filter.startDate) return false;
        if (filter.endDate && timestamp > filter.endDate) return false;

        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase();
          const dateStr = timestamp.toLocaleDateString('id-ID').toLowerCase();
          const timeStr = timestamp.toLocaleTimeString('id-ID').toLowerCase();
          const itemNames = t.items.map((i) => i.name.toLowerCase()).join(' ');
          const totalStr = t.total.toString();

          return (
            t.id.toLowerCase().includes(query) ||
            dateStr.includes(query) ||
            timeStr.includes(query) ||
            itemNames.includes(query) ||
            totalStr.includes(query)
          );
        }

        return true;
      });
    },
    [transactions]
  );

  const getTodayTransactions = useCallback((): Transaction[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return transactions.filter(
      (t) => new Date(t.timestamp) >= today && new Date(t.timestamp) < tomorrow
    );
  }, [transactions]);

  const getWeekTransactions = useCallback((): Transaction[] => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    return transactions.filter((t) => new Date(t.timestamp) >= weekAgo);
  }, [transactions]);

  const getMonthTransactions = useCallback((): Transaction[] => {
    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);

    return transactions.filter((t) => new Date(t.timestamp) >= monthAgo);
  }, [transactions]);

  const stats = useMemo(() => {
    const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalCount = transactions.length;
    const averageTransaction =
      totalCount > 0 ? totalRevenue / totalCount : 0;
    const totalItems = transactions.reduce(
      (sum, t) => sum + t.items.reduce((s, i) => s + i.quantity, 0),
      0
    );

    return {
      totalRevenue,
      totalCount,
      averageTransaction,
      totalItems,
    };
  }, [transactions]);


  const clearAll = useCallback(() => {
    if (confirm('Yakin ingin menghapus semua riwayat transaksi?')) {
      setTransactions([]);
      saveTransactions([]);
    }
  }, []);

  return {
    transactions,
    addTransaction,
    updateTransaction,
    getTransaction,
    filterTransactions,
    getTodayTransactions,
    getWeekTransactions,
    getMonthTransactions,
    stats,
    clearAll,
  };
}
