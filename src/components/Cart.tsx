import { useState, useEffect } from "react";
import type { CartItem as CartItemType, PriceType } from "../types";
import { CartItemRow } from "./CartItem";
import { formatCurrency } from "../utils/formatCurrency";

interface CartProps {
  items: CartItemType[];
  subtotal: number;
  total: number;
  width: number;
  onUpdateQuantity: (
    id: string,
    priceType: PriceType,
    quantity: number,
  ) => void;
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isExpanded, setIsExpanded] = useState(false);
  const isEmpty = items.length === 0;

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setIsExpanded(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate total items count for badge
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Mobile Backdrop when expanded */}
      {isMobile && isExpanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div
        className={`
          bg-white flex flex-col flex-shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200 
          shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] lg:shadow-none 
          z-40 transition-all duration-300 ease-in-out
          ${isMobile ? 'fixed bottom-0 left-0 right-0 rounded-t-2xl' : 'h-full'}
        `}
        style={{
          width: isMobile ? "100%" : `${width}px`,
          height: isMobile ? (isExpanded ? "85vh" : "auto") : "auto",
        }}
      >
        {/* Header / Toggle Handle for Mobile */}
        <div
          className={`
            px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex justify-between items-center cursor-pointer lg:cursor-default
            ${isMobile ? 'active:bg-gray-100' : ''}
          `}
          onClick={() => isMobile && setIsExpanded(!isExpanded)}
        >
          <h2 className="text-sm sm:text-base font-medium text-gray-900 flex items-center gap-2">
            <span className="text-primary-600 text-base">🛒</span>
            Pesanan
            {totalItemsCount > 0 && (
              <span className="bg-primary-100 text-primary-700 text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full">
                {totalItemsCount}
              </span>
            )}
          </h2>

          {isMobile && (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="font-semibold text-sm sm:text-base text-gray-900">{formatCurrency(total)}</span>
              <span className={`text-gray-400 text-sm transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-auto px-5 py-2 min-h-0">
          {isEmpty ? (
            <div className={`flex flex-col items-center justify-center h-full text-gray-400 gap-2 ${isMobile && !isExpanded ? 'py-4 hidden' : 'py-8'}`}>
              <span className="text-4xl">🛍️</span>
              <span className="text-sm">Belum ada item</span>
            </div>
          ) : (
            <div className={`${isMobile && !isExpanded ? 'hidden' : 'block'}`}>
              {items.map((item) => (
                <CartItemRow
                  key={`${item.id}-${item.priceType}`}
                  item={item}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemove={onRemove}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`
          border-t border-gray-200 bg-gray-50
          ${isMobile && !isExpanded ? 'hidden' : 'block'}
        `}>
          {!isMobile && (
            <div className="px-5 py-4">
              <div className="flex justify-between text-xl font-bold text-gray-900">
                <span>Total</span>
                <span className="text-primary-700">{formatCurrency(total)}</span>
              </div>
            </div>
          )}

          <div className="px-5 py-4 flex gap-3 bg-white border-t border-gray-200">
            <button
              onClick={onClear}
              disabled={isEmpty}
              className="flex-1 py-3 text-gray-600 bg-gray-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-transparent rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Batal
            </button>
            <button
              onClick={onPrint}
              disabled={isEmpty}
              className="flex-1 py-3 bg-primary-600 text-white hover:bg-primary-700 rounded-xl font-medium shadow-lg shadow-primary-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <span>🖨️</span> Bayar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
