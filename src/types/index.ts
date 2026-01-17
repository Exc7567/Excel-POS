export type PriceType = 'net' | 'grosir' | 'eceran';

export interface ItemPrices {
  net: number;
  grosir: number;
  eceran: number;
}

export interface Item {
  id: string;
  name: string;
  prices: ItemPrices;
  category?: string;
}

export interface CartItem extends Item {
  quantity: number;
  priceType: PriceType;
}

export interface Order {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  timestamp: Date;
}
