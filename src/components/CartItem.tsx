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

  // Format a quantity number for display using comma as decimal separator (Indonesian convention)
  // Trim trailing zeros: 0.5 → "0,5" (not "0,50"), 1.25 → "1,25", 2 → "2"
  const formatQtyDisplay = (qty: number): string => {
    // Round to 2 decimal places to avoid floating point noise
    const rounded = Math.round(qty * 100) / 100;
    const str = rounded.toString();
    return str.replace('.', ',');
  };

  // Local input state allows the field to be temporarily empty while typing
  // without propagating 0/NaN to the cart state
  const [inputValue, setInputValue] = useState<string>(formatQtyDisplay(item.quantity));

  // Sync local input when item.quantity changes externally (e.g. +/− buttons)
  useEffect(() => {
    setInputValue(formatQtyDisplay(item.quantity));
  }, [item.quantity]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Allow empty field temporarily (user is clearing to retype)
    if (raw === '') {
      setInputValue('');
      return;
    }

    // Normalize: replace comma with period for internal processing
    const normalized = raw.replace(',', '.');

    // Allow only digits, at most one decimal point, and up to 2 decimal places
    // Also allow a trailing period (user is about to type decimal digits)
    const match = normalized.match(/^(\d+)(\.(\d{0,2}))?$/);
    if (!match) {
      // Invalid input — don't update
      return;
    }

    // Build the display value (using comma for display)
    const displayValue = normalized.replace('.', ',');
    setInputValue(displayValue);

    // Parse and update cart state
    const parsed = parseFloat(normalized);
    if (!isNaN(parsed) && parsed > 0) {
      const clamped = Math.max(0.01, Math.round(parsed * 100) / 100);
      onUpdateQuantity(item.id, item.priceType, clamped);
    }
  };

  const handleBlur = () => {
    // Normalize: replace comma with period for parsing
    const normalized = inputValue.replace(',', '.');
    const parsed = parseFloat(normalized);
    if (!inputValue || isNaN(parsed) || parsed < 0.01) {
      setInputValue('1');
      onUpdateQuantity(item.id, item.priceType, 1);
    } else {
      // Ensure clean display on blur (remove trailing dots, etc.)
      const clamped = Math.max(0.01, Math.round(parsed * 100) / 100);
      setInputValue(formatQtyDisplay(clamped));
      onUpdateQuantity(item.id, item.priceType, clamped);
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
          inputMode="decimal"
          value={inputValue}
          onChange={handleQuantityChange}
          onBlur={handleBlur}
          className="w-14 text-center font-medium text-sm bg-transparent border-none outline-none p-0 m-0"
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
