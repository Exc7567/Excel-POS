import { useState, useCallback } from 'react';
import type { Item, CartItem, PriceType } from '../types';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [reprintTransactionId, setReprintTransactionId] = useState<string | null>(null);

  const addItem = useCallback((item: Item, priceType: PriceType) => {
    const price = item.prices[priceType];
    if (price === 0) return; // Don't add items with 0 price

    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id && i.priceType === priceType);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.priceType === priceType
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1, priceType }];
    });
  }, []);

  const removeItem = useCallback((id: string, priceType: PriceType) => {
    setItems((prev) => prev.filter((i) => !(i.id === id && i.priceType === priceType)));
  }, []);

  const updateQuantity = useCallback((id: string, priceType: PriceType, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => !(i.id === id && i.priceType === priceType)));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.id === id && i.priceType === priceType ? { ...i, quantity } : i))
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setReprintTransactionId(null);
  }, []);

  // Bulk-load items from a past transaction into the cart and tag with the original transaction ID
  const setCartItems = useCallback((newItems: CartItem[], transactionId: string) => {
    setItems(newItems.map(item => ({ ...item })));
    setReprintTransactionId(transactionId);
  }, []);

  const clearReprintId = useCallback(() => {
    setReprintTransactionId(null);
  }, []);

  const subtotal = items.reduce((sum, item) => {
    const price = item.prices[item.priceType];
    return sum + price * item.quantity;
  }, 0);

  const total = subtotal; // No tax for this POS

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setCartItems,
    reprintTransactionId,
    clearReprintId,
    subtotal,
    total,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

