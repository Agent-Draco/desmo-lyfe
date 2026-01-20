import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ShoppingListItem {
  id: string;
  item_name: string;
  quantity: number;
  household_id: string;
  created_at: string;
}

/**
 * Shopping list hook - uses localStorage for persistence since there's no shopping_list table
 * in the external database. This provides a simple client-side shopping list.
 */
export const useShoppingList = (householdId: string | null) => {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const storageKey = `shopping_list_${householdId || "default"}`;

  // Load items from localStorage
  const loadItems = useCallback(() => {
    if (!householdId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setItems(JSON.parse(stored));
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Error loading shopping list:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [householdId, storageKey]);

  // Save items to localStorage
  const saveItems = useCallback((newItems: ShoppingListItem[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newItems));
    } catch (error) {
      console.error("Error saving shopping list:", error);
    }
  }, [storageKey]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const addItem = async (item: { item_name: string; quantity?: number }) => {
    if (!householdId) return null;

    const newItem: ShoppingListItem = {
      id: crypto.randomUUID(),
      item_name: item.item_name,
      quantity: item.quantity || 1,
      household_id: householdId,
      created_at: new Date().toISOString(),
    };

    const newItems = [newItem, ...items];
    setItems(newItems);
    saveItems(newItems);

    toast({
      title: "Added to shopping list",
      description: `${item.item_name} added`,
    });

    return newItem;
  };

  const deleteItem = async (id: string) => {
    const newItems = items.filter((item) => item.id !== id);
    setItems(newItems);
    saveItems(newItems);

    toast({
      title: "Removed from shopping list",
      description: "Item removed",
    });

    return true;
  };

  const updateItem = async (id: string, updates: Partial<ShoppingListItem>) => {
    const newItems = items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    setItems(newItems);
    saveItems(newItems);
    return true;
  };

  return {
    items,
    loading,
    addItem,
    deleteItem,
    updateItem,
    refetch: loadItems,
  };
};
