import { useState, useCallback, useEffect } from 'react';
import type { Item } from '../types';
import { loadItems, saveItems, resetItems } from '../utils/storage';

export function useItems() {
  const [items, setItems] = useState<Item[]>(() => loadItems());

  useEffect(() => {
    saveItems(items);
  }, [items]);

  const updateItem = useCallback((id: string, updates: Partial<Item>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const addItem = useCallback((newItem: Omit<Item, 'id'> & { id?: string }) => {
    const item: Item = {
      id: newItem.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newItem.name,
      category: newItem.category,
      prices: newItem.prices,
    };
    setItems(prev => [...prev, item]);
  }, []);

  const resetToDefault = useCallback(() => {
    resetItems();
    setItems(loadItems());
  }, []);

  return {
    items,
    updateItem,
    deleteItem,
    addItem,
    resetToDefault,
    setItems,
  };
}
