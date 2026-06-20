
import { useState, useCallback, useEffect } from 'react';
import type { Item } from '../types';
import { supabase } from '../supabaseClient.js';


export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch items from Supabase on mount
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category, net, grosir, eceran');
      if (error) {
        setError('Failed to fetch items from database.');
        setItems([]);
      } else {
        // Map Supabase data to Item[]
        setItems(
          (data || []).map((row: any) => ({
            id: row.id,
            name: row.name,
            category: row.category,
            prices: {
              net: row.net,
              grosir: row.grosir,
              eceran: row.eceran,
            },
          }))
        );
      }
      setLoading(false);
    };
    fetchItems();
  }, []);


  // Update item in Supabase
  const updateItem = useCallback(async (id: string, updates: Partial<Item>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from('products')
      .update({
        name: updates.name,
        category: updates.category,
        net: updates.prices?.net,
        grosir: updates.prices?.grosir,
        eceran: updates.prices?.eceran,
      })
      .eq('id', id);
    if (error) {
      setError('Failed to update item.');
      setLoading(false);
      return false;
    }
    // Refetch items
    const { data } = await supabase
      .from('products')
      .select('id, name, category, net, grosir, eceran');
    setItems(
      (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        prices: {
          net: row.net,
          grosir: row.grosir,
          eceran: row.eceran,
        },
      }))
    );
    setLoading(false);
    return true;
  }, []);


  // Delete item in Supabase
  const deleteItem = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (error) setError('Failed to delete item.');
    // Refetch items
    const { data } = await supabase
      .from('products')
      .select('id, name, category, net, grosir, eceran');
    setItems(
      (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        prices: {
          net: row.net,
          grosir: row.grosir,
          eceran: row.eceran,
        },
      }))
    );
    setLoading(false);
  }, []);


  // Add item to Supabase
  const addItem = useCallback(async (newItem: Omit<Item, 'id'> & { id?: string }) => {
    setLoading(true);
    setError(null);
    // Insert id if present, otherwise let Supabase autogenerate
    const insertObj: any = {
      name: newItem.name,
      category: newItem.category,
      net: newItem.prices.net,
      grosir: newItem.prices.grosir,
      eceran: newItem.prices.eceran,
    };
    if (newItem.id) insertObj.id = newItem.id;
    const { error } = await supabase
      .from('products')
      .insert(insertObj);
    if (error) setError('Failed to add item.');
    // Refetch items
    const { data } = await supabase
      .from('products')
      .select('id, name, category, net, grosir, eceran');
    setItems(
      (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        prices: {
          net: row.net,
          grosir: row.grosir,
          eceran: row.eceran,
        },
      }))
    );
    setLoading(false);
  }, []);


  // No resetToDefault for live DB
  const resetToDefault = useCallback(() => {}, []);

  return {
    items,
    updateItem,
    deleteItem,
    addItem,
    resetToDefault,
    setItems,
    loading,
    error,
  };
}
