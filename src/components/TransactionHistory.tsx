import { useState, useMemo } from 'react';
import type { Transaction } from '../types/transaction';
import type { TransactionWithPending } from '../hooks/useTransactions';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { getActualRevenue } from '../utils/revenueHelper';
import { roundItemQty } from '../utils/roundItemQty';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onSelectTransaction: (transaction: Transaction) => void;
  loading?: boolean;
  onExportJSON: (filteredTransactions: Transaction[], periodLabel: string) => void;
  onDeleteAll: () => Promise<{ success: boolean; error?: string }>;
}

type PeriodFilter = 'today' | 'week' | 'month' | 'all' | 'custom';

export function TransactionHistory({
  transactions,
  onSelectTransaction,
  loading,
  onExportJSON,
  onDeleteAll,
}: TransactionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState<PeriodFilter>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // CONFIRM_DELETE modal state
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAll, setDeletingAll] = useState(false);
  const [deleteAllError, setDeleteAllError] = useState<string | null>(null);

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    switch (period) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'custom':
        if (customStart) {
          startDate = new Date(customStart);
          startDate.setHours(0, 0, 0, 0);
        }
        if (customEnd) {
          endDate = new Date(customEnd);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
    }

    if (startDate) {
      filtered = filtered.filter((t) => new Date(t.timestamp) >= startDate!);
    }
    if (endDate) {
      filtered = filtered.filter((t) => new Date(t.timestamp) <= endDate!);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((t) => {
        const dateStr = format(new Date(t.timestamp), 'dd MMM yyyy', {
          locale: id,
        }).toLowerCase();
        const timeStr = format(new Date(t.timestamp), 'HH:mm:ss').toLowerCase();
        const itemNames = t.items.map((i) => i.name.toLowerCase()).join(' ');
        const totalStr = t.total.toString();

        return (
          t.id.toLowerCase().includes(query) ||
          dateStr.includes(query) ||
          timeStr.includes(query) ||
          itemNames.includes(query) ||
          totalStr.includes(query)
        );
      });
    }

    return filtered;
  }, [transactions, period, customStart, customEnd, searchQuery]);

  // Compute stats from filtered transactions (so stats match the current period view)
  const filteredStats = useMemo(() => {
    const totalRevenue = filteredTransactions.reduce(
      (sum, t) => sum + getActualRevenue(t),
      0
    );
    const totalCount = filteredTransactions.length;
    const averageTransaction = totalCount > 0 ? totalRevenue / totalCount : 0;
    const totalItems = filteredTransactions.reduce(
      (sum, t) => sum + t.items.reduce((s, i) => s + roundItemQty(i.quantity), 0),
      0
    );
    return { totalRevenue, totalCount, averageTransaction, totalItems };
  }, [filteredTransactions]);

  const periodLabelMap: Record<PeriodFilter, string> = {
    today: 'hari-ini',
    week: '7hari',
    month: '30hari',
    all: 'semua',
    custom: `custom-${customStart || 'awal'}-${customEnd || 'akhir'}`,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDeleteAllClick = () => {
    setShowDeleteAllModal(true);
    setDeleteConfirmText('');
    setDeleteAllError(null);
  };

  const handleDeleteAllConfirm = async () => {
    if (deleteConfirmText !== 'CONFIRM_DELETE') return;
    setDeletingAll(true);
    setDeleteAllError(null);
    const result = await onDeleteAll();
    if (!result.success) {
      setDeleteAllError(result.error || 'Gagal menghapus data');
      setDeletingAll(false);
    } else {
      setDeletingAll(false);
      setShowDeleteAllModal(false);
      setDeleteConfirmText('');
    }
  };

  const handleDeleteAllCancel = () => {
    setShowDeleteAllModal(false);
    setDeleteConfirmText('');
    setDeleteAllError(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-center flex-shrink-0">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 pl-12 lg:pl-0">Riwayat Transaksi</h2>
        <div className="flex gap-2">
          <button
            onClick={() => onExportJSON(filteredTransactions, periodLabelMap[period])}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            📂 Export JSON
          </button>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-hidden flex flex-col gap-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-shrink-0">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Total Pendapatan</div>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(filteredStats.totalRevenue)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Total Transaksi</div>
            <div className="text-xl font-bold text-primary-900">{filteredStats.totalCount}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Rata-rata</div>
            <div className="text-xl font-bold text-primary-900">
              {formatCurrency(filteredStats.averageTransaction)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Item Terjual</div>
            <div className="text-xl font-bold text-primary-900">{filteredStats.totalItems}</div>
          </div>
        </div>

        {/* Filters and List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3 items-center bg-white">
            <div className="flex-1 min-w-[200px] relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
              className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="today">Hari Ini</option>
              <option value="week">7 Hari Terakhir</option>
              <option value="month">30 Hari Terakhir</option>
              <option value="custom">Custom</option>
              <option value="all">Semua</option>
            </select>

            {period === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}

            <button
              onClick={handleDeleteAllClick}
              className="ml-auto px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
            >
              Hapus Semua Data
            </button>
          </div>

          <div className="flex-1 overflow-auto p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center p-8">
                <div className="text-4xl mb-3 animate-spin">⏳</div>
                <p>Memuat transaksi...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center p-8">
                <div className="text-4xl mb-3">📋</div>
                <p>Tidak ada transaksi ditemukan</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">ID Transaksi</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Waktu</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Item</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Total</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.map((transaction) => {
                    const date = new Date(transaction.timestamp);
                    const status = transaction.status ?? 'Lunas';
                    const isPending = (transaction as TransactionWithPending)._pendingSync === true;
                    return (
                      <tr
                        key={transaction.id}
                        onClick={() => onSelectTransaction(transaction)}
                        className="hover:bg-primary-50 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900 group-hover:text-primary-700">
                          <div className="flex items-center gap-2">
                            {transaction.id}
                            {isPending && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200 whitespace-nowrap">
                                Belum Tersinkron
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {format(date, 'dd MMM yyyy, HH:mm', { locale: id })}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {transaction.items.length} item <span className="text-gray-400 ml-1">({transaction.priceType})</span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                          {formatCurrency(transaction.total)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            status === 'Lunas'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRM_DELETE Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
              <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                ⚠️ Hapus Semua Data
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                Tindakan ini akan menghapus <strong>SEMUA</strong> data transaksi secara permanen.
                Ketik <code className="bg-gray-100 px-1.5 py-0.5 rounded text-red-600 font-mono text-xs font-bold">CONFIRM_DELETE</code> untuk melanjutkan.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Ketik CONFIRM_DELETE"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 font-mono text-sm"
                autoFocus
              />
              {deleteConfirmText.length > 0 && deleteConfirmText !== 'CONFIRM_DELETE' && (
                <p className="text-xs text-gray-400 mt-2">
                  Ketik <span className="font-mono font-bold">CONFIRM_DELETE</span> untuk mengaktifkan tombol.
                </p>
              )}
              {deleteAllError && (
                <p className="text-sm text-red-600 mt-3 bg-red-50 rounded px-3 py-2">
                  ❌ {deleteAllError}
                </p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleDeleteAllConfirm}
                disabled={deleteConfirmText !== 'CONFIRM_DELETE' || deletingAll}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {deletingAll ? 'Menghapus...' : 'Konfirmasi Hapus'}
              </button>
              <button
                onClick={handleDeleteAllCancel}
                disabled={deletingAll}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
