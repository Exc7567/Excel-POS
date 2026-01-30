import type { CartItem, PriceType } from './index';

export interface Transaction {
  id: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  priceType: PriceType;
  timestamp: Date;
  paymentMethod?: string;
}

export interface TransactionSummary {
  id: string;
  total: number;
  itemCount: number;
  timestamp: Date;
}

export interface TransactionFilter {
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
}

export function generateTransactionId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `TXN_${dateStr}_${timeStr}_${random}`;
}
