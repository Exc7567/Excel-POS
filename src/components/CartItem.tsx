import type { CartItem, PriceType } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (id: string, priceType: PriceType, quantity: number) => void;
  onRemove: (id: string, priceType: PriceType) => void;
}

const PRICE_LABELS: Record<PriceType, string> = {
  net: 'Net',
  grosir: 'Grosir',
  eceran: 'Eceran',
};

export function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const price = item.prices[item.priceType];

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate text-sm">{item.name}</div>
        <div className="text-xs text-gray-500">
          {formatCurrency(price)} ({PRICE_LABELS[item.priceType]})
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdateQuantity(item.id, item.priceType, item.quantity - 1)}
          className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded transition-colors text-sm"
        >
          −
        </button>
        <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
        <button
          onClick={() => onUpdateQuantity(item.id, item.priceType, item.quantity + 1)}
          className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded transition-colors text-sm"
        >
          +
        </button>
      </div>

      <div className="w-24 text-right font-medium text-sm">
        {formatCurrency(price * item.quantity)}
      </div>

      <button
        onClick={() => onRemove(item.id, item.priceType)}
        className="text-gray-400 hover:text-red-500 transition-colors p-1"
        aria-label="Remove item"
      >
        ✕
      </button>
    </div>
  );
}
