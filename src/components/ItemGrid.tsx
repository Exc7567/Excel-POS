import React from "react";
import type { Item, PriceType } from "../types";
import { ItemCard } from "./ItemCard";

interface ItemGridProps {
  items: Item[];
  priceType: PriceType;
  onAddItem: (item: Item) => void;
  onEditItem?: (item: Item) => void;
}

export function ItemGrid({
  items,
  priceType,
  onAddItem,
  onEditItem,
}: ItemGridProps) {
  const [search, setSearch] = React.useState("");
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.category &&
        item.category.toLowerCase().includes(search.toLowerCase())),
  );
  return (
    <div className="flex-1 p-3 sm:p-6 overflow-auto bg-gray-50">
      <input
        type="text"
        placeholder="Cari barang..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3 w-full p-2 border rounded shadow-sm focus:outline-none focus:ring"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filteredItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            priceType={priceType}
            onAdd={onAddItem}
            onEdit={onEditItem}
          />
        ))}
      </div>
    </div>
  );
}
