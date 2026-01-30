import React, { useMemo } from "react";
import type { Item, PriceType } from "../types";
import { ItemCard } from "./ItemCard";
import { CategoryTabs } from "./CategoryTabs";

interface ItemGridProps {
  items: Item[];
  priceType: PriceType;
  onAddItem: (item: Item) => void;
}

interface ItemGridWithSearchProps extends ItemGridProps {
  searchQuery: string;
}

export function ItemGridWithSearch({
  items,
  priceType,
  onAddItem,
  searchQuery,
}: ItemGridWithSearchProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null,
  );

  const categories = useMemo(() => {
    const cats = items
      .map((item) => item.category)
      .filter((cat): cat is string => cat !== undefined);
    return [...new Set(cats)].sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category &&
          item.category.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        !selectedCategory || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-auto bg-gray-50">
      <CategoryTabs
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      {filteredItems.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          Tidak ada item ditemukan
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              priceType={priceType}
              onAdd={onAddItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
