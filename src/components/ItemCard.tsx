import type { Item, PriceType } from "../types";
import { formatCurrency } from "../utils/formatCurrency";

interface ItemCardProps {
  item: Item;
  priceType: PriceType;
  onAdd: (item: Item) => void;
  onEdit?: (item: Item) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  MIE: "bg-blue-50 border-blue-100",
  "KECAP SAOS": "bg-amber-50 border-amber-100",
  SUSU: "bg-cyan-50 border-cyan-100",
  SABUN: "bg-pink-50 border-pink-100",
  "GULA TEPUNG": "bg-orange-50 border-orange-100",
  BUMBU: "bg-lime-50 border-lime-100",
  GARAM: "bg-slate-50 border-slate-100",
  MINYAK: "bg-yellow-50 border-yellow-100",
  "KOPI TEH": "bg-rose-50 border-rose-100",
  OBAT: "bg-emerald-50 border-emerald-100",
  SNACK: "bg-violet-50 border-violet-100",
  TISSUE: "bg-sky-50 border-sky-100",
  PEMBALUT: "bg-fuchsia-50 border-fuchsia-100",
  SPON: "bg-teal-50 border-teal-100",
};

export function ItemCard({ item, priceType, onAdd, onEdit }: ItemCardProps) {
  const price = item.prices[priceType];
  const isAvailable = price > 0;
  const categoryColor =
    CATEGORY_COLORS[item.category || ""] || "bg-gray-50 border-gray-100";

  const containerHoverClass = isAvailable
    ? "hover:shadow-lg hover:scale-[1.01]"
    : "";

  return (
    <div
      className={`${categoryColor} border rounded-lg p-4 text-left transition-all relative group ${containerHoverClass}`}
    >
      <button
        onClick={() => onAdd(item)}
        disabled={!isAvailable}
        className={`w-full h-full text-left ${
          isAvailable
            ? "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
            : "opacity-40 cursor-not-allowed"
        }`}
        style={{ minHeight: 80 }}
      >
        <div className="font-medium text-gray-900 truncate text-sm">
          {item.name}
        </div>
        <div className="text-xs text-gray-500 mt-1">{item.category}</div>
        <div className="text-gray-800 font-semibold mt-2">
          {isAvailable ? formatCurrency(price) : "-"}
        </div>
      </button>
      {onEdit && (
        <button
          onClick={() => onEdit(item)}
          aria-label={`Edit ${item.name}`}
          className="absolute top-2 right-2 rounded p-1 text-gray-600 opacity-0 group-hover:opacity-100 group-hover:-translate-y-0 translate-y-1 transition-transform transition-opacity duration-200 ease-out"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <title>Pencil</title>
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
            <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
          </svg>
        </button>
      )}
    </div>
  );
}
