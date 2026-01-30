import { useState, useEffect } from "react";
import type { PriceType } from "../types";

interface HeaderProps {
  priceType: PriceType;
  onPriceTypeChange: (type: PriceType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const PRICE_OPTIONS: { value: PriceType; label: string }[] = [
  { value: "grosir", label: "Grosir" },
  { value: "eceran", label: "Eceran" },
  { value: "net", label: "Net" },
];

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function Header({ priceType, onPriceTypeChange, searchQuery, onSearchChange }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const day = DAYS[currentTime.getDay()];
  const date = currentTime.getDate();
  const month = MONTHS[currentTime.getMonth()];
  const year = currentTime.getFullYear();
  const time = formatTime(currentTime);

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between gap-4 h-full relative">
        {/* Left: Sidebar Spacer for Mobile Trigger */}
        <div className="flex-shrink-0 w-10 lg:w-48 lg:block"></div>

        {/* Center: Search Bar & Price Buttons */}
        <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Search Bar */}
          <div className="w-full max-w-md">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
              <input
                type="text"
                placeholder="Cari items..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Price Type Buttons */}
          <div className="flex rounded-lg border border-primary-100 overflow-hidden flex-shrink-0">
            {PRICE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onPriceTypeChange(option.value)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${priceType === option.value
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-primary-50"
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Date & Time */}
        <div className="flex-shrink-0 w-48 text-right hidden lg:block">
          <div className="text-sm text-gray-500">
            {day}, {date} {month} {year}
          </div>
          <div className="text-lg font-mono font-semibold text-primary-700">
            {time}
          </div>
        </div>
      </div>
    </header>
  );
}
