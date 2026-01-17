import type { CartItem as CartItemType, PriceType } from '../types';
import { CartItemRow } from './CartItem';
import { formatCurrency } from '../utils/formatCurrency';

interface CartProps {
  items: CartItemType[];
  subtotal: number;
  total: number;
  width: number;
  onUpdateQuantity: (id: string, priceType: PriceType, quantity: number) => void;
  onRemove: (id: string, priceType: PriceType) => void;
  onClear: () => void;
  onPrint: () => void;
}

export function Cart({
  items,
  total,
  width,
  onUpdateQuantity,
  onRemove,
  onClear,
  onPrint,
}: CartProps) {
  const isEmpty = items.length === 0;

  return (
    <div
      className="bg-white flex flex-col flex-shrink-0"
      style={{ width: `${width}px` }}
    >
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Pesanan</h2>
      </div>

      <div className="flex-1 overflow-auto px-5 py-2">
        {isEmpty ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Belum ada item
          </div>
        ) : (
          items.map((item) => (
            <CartItemRow
              key={`${item.id}-${item.priceType}`}
              item={item}
              onUpdateQuantity={onUpdateQuantity}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      <div className="border-t border-gray-200 px-5 py-4">
        <div className="flex justify-between text-xl font-semibold text-gray-900">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-gray-200 flex gap-3">
        <button
          onClick={onClear}
          disabled={isEmpty}
          className="flex-1 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Batal
        </button>
        <button
          onClick={onPrint}
          disabled={isEmpty}
          className="flex-1 py-2.5 bg-gray-900 text-white hover:bg-gray-800 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cetak
        </button>
      </div>
    </div>
  );
}
