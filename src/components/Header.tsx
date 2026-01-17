import { useState, useEffect } from 'react';
import type { PriceType } from '../types';

interface HeaderProps {
  priceType: PriceType;
  onPriceTypeChange: (type: PriceType) => void;
}

const PRICE_OPTIONS: { value: PriceType; label: string }[] = [
  { value: 'grosir', label: 'Grosir' },
  { value: 'eceran', label: 'Eceran' },
  { value: 'net', label: 'Net' },
];

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours} : ${minutes} : ${seconds}`;
}

export function Header({ priceType, onPriceTypeChange }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const year = currentTime.getFullYear();
  const day = DAYS[currentTime.getDay()];
  const time = formatTime(currentTime);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center">
      <h1 className="text-xl font-bold text-gray-900 w-48">Sembako Makmur Jaya</h1>

      <div className="flex-1 flex items-center justify-center gap-2">
        <span className="text-sm font-medium text-gray-600">Tipe Harga:</span>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {PRICE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onPriceTypeChange(option.value)}
              className={`px-5 py-2 text-sm font-semibold transition-colors ${
                priceType === option.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-56 text-right">
        <div className="text-sm text-gray-600">
          {year} | {day}
        </div>
        <div className="text-lg font-mono font-semibold text-gray-900">
          {time}
        </div>
      </div>
    </header>
  );
}
