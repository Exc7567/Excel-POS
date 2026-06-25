import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Transaction } from '../types/transaction';

interface TransactionDetailProps {
  transaction: Transaction;
  onClose: () => void;
  onCetakUlang: (transaction: Transaction) => void;
}

export function TransactionDetail({ transaction, onClose, onCetakUlang }: TransactionDetailProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const date = new Date(transaction.timestamp);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Detail Transaksi</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <div className="text-sm text-gray-500">ID Transaksi</div>
            <div className="font-medium">{transaction.id}</div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-500">Tanggal & Waktu</div>
            <div className="font-medium">
              {format(date, 'dd MMMM yyyy', { locale: id })} pukul{' '}
              {format(date, 'HH:mm:ss')}
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-500">Tipe Harga</div>
            <div className="font-medium capitalize">{transaction.priceType}</div>
          </div>

          <div className="border-t border-b border-gray-200 py-4 my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="pb-2">Item</th>
                  <th className="pb-2 text-center">Qty</th>
                  <th className="pb-2 text-right">Harga</th>
                  <th className="pb-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {transaction.items.map((item, idx) => {
                  const price = item.prices[item.priceType];
                  const subtotal = price * item.quantity;
                  return (
                    <tr key={idx} className="border-b border-gray-100 last:border-0">
                      <td className="py-2">
                        <div>{item.name}</div>
                        <div className="text-xs text-gray-500">
                          {item.category}
                        </div>
                      </td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right">{formatCurrency(price)}</td>
                      <td className="py-2 text-right">
                        {formatCurrency(subtotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatCurrency(transaction.subtotal)}</span>
          </div>

          {transaction.uangDibayar !== undefined && (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Bayar</span>
                <span>{formatCurrency(transaction.uangDibayar)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">
                  {(transaction.hutang ?? 0) > 0 ? 'Hutang' : 'Kembalian'}
                </span>
                <span className={(transaction.hutang ?? 0) > 0 ? 'text-orange-600 font-semibold' : ''}>
                  {formatCurrency((transaction.hutang ?? 0) > 0 ? (transaction.hutang ?? 0) : (transaction.kembalian ?? 0))}
                </span>
              </div>
            </>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(transaction.total)}
            </span>
          </div>

          {/* Status Badge */}
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
            <span className="text-gray-600">Status</span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
              (transaction.status ?? 'Lunas') === 'Lunas'
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-100 text-orange-700'
            }`}>
              {transaction.status ?? 'Lunas'}
            </span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={() => onCetakUlang(transaction)}
            className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cetak Ulang
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
