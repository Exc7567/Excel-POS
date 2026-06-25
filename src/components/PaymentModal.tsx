import { useState } from 'react';
import { formatCurrency } from '../utils/formatCurrency';

interface PaymentModalProps {
  total: number;
  onConfirm: (uangDibayar: number, kembalian: number, hutang: number) => void;
  onCancel: () => void;
}

export function PaymentModal({ total, onConfirm, onCancel }: PaymentModalProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const [showHutangConfirm, setShowHutangConfirm] = useState(false);

  // Treat empty or invalid input as 0
  const parsed = inputValue === '' ? 0 : parseInt(inputValue, 10);
  const uangDibayar = isNaN(parsed) ? 0 : parsed;
  const isEnough = uangDibayar >= total;
  const kembalian = isEnough ? uangDibayar - total : 0;
  const hutang = isEnough ? 0 : total - uangDibayar;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Only allow digits (positive integers for Rp amounts)
    const digitsOnly = raw.replace(/[^0-9]/g, '');
    setInputValue(digitsOnly);
  };

  const handleConfirm = () => {
    if (isEnough) {
      // Fully paid — print immediately, no confirmation needed
      onConfirm(uangDibayar, kembalian, 0);
    } else {
      // Underpayment — show hutang confirmation dialog
      setShowHutangConfirm(true);
    }
  };

  const handleHutangConfirm = () => {
    // User confirmed hutang — proceed to print
    setShowHutangConfirm(false);
    onConfirm(uangDibayar, 0, hutang);
  };

  const handleHutangCancel = () => {
    // User cancelled — go back to payment modal (keep values)
    setShowHutangConfirm(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
            <h2 className="text-white text-lg font-semibold">Pembayaran</h2>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">
            {/* Total Display */}
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-sm text-gray-500 mb-1">Total Transaksi</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</div>
            </div>

            {/* Uang Dibayar Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Uang Dibayar
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  style={{
                    MozAppearance: 'textfield',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                  }}
                />
              </div>
            </div>

            {/* Conditional Kembalian / Hutang Display */}
            {isEnough ? (
              <div className="rounded-xl p-4 text-center transition-all bg-green-50 border border-green-200">
                <div className="text-sm text-gray-500 mb-1">Kembalian</div>
                <div className="text-2xl font-bold transition-colors text-green-600">
                  {formatCurrency(kembalian)}
                </div>
              </div>
            ) : (
              <div className="rounded-xl p-4 text-center transition-all bg-orange-50 border border-orange-300">
                <div className="text-sm text-orange-600 mb-1 font-medium">⚠️ Hutang</div>
                <div className="text-2xl font-bold transition-colors text-orange-600">
                  {formatCurrency(hutang)}
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 bg-primary-600 text-white hover:bg-primary-700 rounded-xl font-medium shadow-lg shadow-primary-200 hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <span>🖨️</span> Cetak
            </button>
          </div>
        </div>
      </div>

      {/* Hutang Confirmation Dialog */}
      {showHutangConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xs mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
              <h3 className="text-white text-lg font-semibold flex items-center gap-2">
                <span>⚠️</span> Konfirmasi Hutang
              </h3>
            </div>
            <div className="px-6 py-5 text-center">
              <p className="text-gray-700 text-base mb-2">
                Pelanggan berhutang
              </p>
              <p className="text-2xl font-bold text-orange-600 mb-3">
                {formatCurrency(hutang)}
              </p>
              <p className="text-sm text-gray-500">
                Lanjutkan cetak?
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleHutangCancel}
                className="flex-1 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleHutangConfirm}
                className="flex-1 py-3 bg-orange-500 text-white hover:bg-orange-600 rounded-xl font-medium shadow-lg shadow-orange-200 hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <span>🖨️</span> Ya, Cetak
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
