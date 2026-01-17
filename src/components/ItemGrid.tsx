import type { Item, PriceType } from '../types';
import { ItemCard } from './ItemCard';

interface ItemGridProps {
  items: Item[];
  priceType: PriceType;
  onAddItem: (item: Item) => void;
}

export function ItemGrid({ items, priceType, onAddItem }: ItemGridProps) {
  return (
    <div className="flex-1 p-6 overflow-auto bg-gray-50">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            priceType={priceType}
            onAdd={onAddItem}
          />
        ))}
      </div>
    </div>
  );
}
