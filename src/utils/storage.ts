import type { Item } from '../types';
import defaultItems from '../data/items.json';

const ITEMS_KEY = 'pos_items';

export function loadItems(): Item[] {
  try {
    const stored = localStorage.getItem(ITEMS_KEY);
    if (stored) {
      return JSON.parse(stored) as Item[];
    }
  } catch (error) {
    console.error('Failed to load items from localStorage:', error);
  }
  return defaultItems.items;
}

export function saveItems(items: Item[]): void {
  try {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save items to localStorage:', error);
  }
}

export function resetItems(): void {
  localStorage.removeItem(ITEMS_KEY);
}

export function getItemsKey(): string {
  return ITEMS_KEY;
}
