import { useState, useEffect } from 'react';
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

  // Local input state allows the field to be temporarily empty while typing
  // without propagating 0/NaN to the cart state
  const [inputValue, setInputValue] = useState<string>(String(item.quantity));

  // Sync local input when item.quantity changes externally (e.g. +/− buttons)
  useEffect(() => {
    setInputValue(String(item.quantity));
  }, [item.quantity]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Allow empty field temporarily (user is clearing to retype)
    if (raw === '') {
      setInputValue('');
      return;
    }

    // Strip non-digit characters (no decimals, no negatives, no letters)
    const digitsOnly = raw.replace(/[^0-9]/g, '');
    if (digitsOnly === '') {
      setInputValue('');
      return;
    }

    const parsed = parseInt(digitsOnly, 10);
    const clamped = Math.max(1, parsed);
    setInputValue(String(clamped));
    onUpdateQuantity(item.id, item.priceType, clamped);
  };

  const handleBlur = () => {
    // If the field is empty or 0 when the user leaves, reset to 1
    const parsed = parseInt(inputValue, 10);
    if (!inputValue || isNaN(parsed) || parsed <= 0) {
      setInputValue('1');
      onUpdateQuantity(item.id, item.priceType, 1);
    }
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 text-sm" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>{item.name}</div>
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
        <input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleQuantityChange}
          onBlur={handleBlur}
          className="w-10 text-center font-medium text-sm bg-transparent border-none outline-none p-0 m-0"
          style={{
            MozAppearance: 'textfield',
            WebkitAppearance: 'none',
            appearance: 'none',
          }}
        />
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
