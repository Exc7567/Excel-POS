import React, { useCallback } from 'react';

interface CategoryTabsProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export function CategoryTabs({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryTabsProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  }, []);

  return (
    <div className="mb-4">
      <div
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className="flex gap-2 overflow-x-auto pb-3 pt-1 px-1 custom-scrollbar"
      >
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex-shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 border ${selectedCategory === null
            ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
            : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
            }`}
        >
          Semua
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`flex-shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 border ${selectedCategory === category
              ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
              }`}
          >
            {category}
          </button>
        ))}
        {/* Spacer to ensure last item isn't cut off */}
        <div className="w-1 flex-shrink-0" />
      </div>
    </div>
  );
}
