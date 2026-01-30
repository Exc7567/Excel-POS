import type { Item, PriceType } from "../types";
import { formatCurrency } from "../utils/formatCurrency";

interface ItemCardProps {
  item: Item;
  priceType: PriceType;
  onAdd: (item: Item) => void;
}

export function ItemCard({ item, priceType, onAdd }: ItemCardProps) {
  const price = item.prices[priceType];
  const isAvailable = price > 0;

  return (
    <div
      className={`
        bg-white border border-gray-200 rounded-lg p-4 text-left transition-all
        ${isAvailable ? "hover:border-primary-400 hover:shadow-md cursor-pointer" : "opacity-50 cursor-not-allowed"}
      `}
      onClick={() => isAvailable && onAdd(item)}
    >
      <div className="font-medium text-gray-900 truncate text-xs sm:text-sm">
        {item.name}
      </div>
      <div className="text-[10px] sm:text-xs text-gray-500 mt-1">{item.category}</div>
      <div className={`
        font-semibold mt-2 text-sm sm:text-base
        ${isAvailable ? "text-primary-600" : "text-gray-400"}
      `}>
        {isAvailable ? formatCurrency(price) : "-"}
      </div>
    </div>
  );
}
