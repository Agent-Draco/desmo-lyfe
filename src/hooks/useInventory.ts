import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  category: string | null;
  barcode: string | null;
  expiry_date: string | null;
  is_out: boolean;
  added_by: string | null;
  created_at: string;
  updated_at: string;
  household_id: string;
  profile?: {
    display_name: string | null;
  } | null;
}

export const useInventory = (householdId: string | null) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    if (!householdId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select(`
          *,
          profile:profiles!inventory_items_added_by_fkey(display_name)
        `)
        .eq("household_id", householdId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Real-time subscription
  useEffect(() => {
    if (!householdId) return;

    const channel = supabase
      .channel("inventory-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventory_items",
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            fetchItems(); // Refetch to get profile info
          } else if (payload.eventType === "UPDATE") {
            setItems((prev) =>
              prev.map((item) =>
                item.id === payload.new.id
                  ? { ...item, ...payload.new }
                  : item
              )
            );
          } else if (payload.eventType === "DELETE") {
            setItems((prev) =>
              prev.filter((item) => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, fetchItems]);

  const addItem = async (item: {
    name: string;
    quantity?: number;
    unit?: string;
    category?: string;
    barcode?: string;
    expiry_date?: string;
  }) => {
    if (!householdId) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .insert({
          household_id: householdId,
          name: item.name,
          quantity: item.quantity || 1,
          unit: item.unit || "pcs",
          category: item.category,
          barcode: item.barcode,
          expiry_date: item.expiry_date,
          added_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Item added",
        description: `${item.name} added to inventory`,
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const { error } = await supabase
        .from("inventory_items")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const decrementItem = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return false;

    if (item.quantity <= 1) {
      return updateItem(id, { quantity: 0, is_out: true });
    }

    return updateItem(id, { quantity: item.quantity - 1 });
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("inventory_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Item removed",
        description: "Item deleted from inventory",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    items,
    loading,
    addItem,
    updateItem,
    decrementItem,
    deleteItem,
    refetch: fetchItems,
  };
};
