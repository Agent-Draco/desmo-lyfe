import { useState, useEffect, useCallback } from "react";
import { vigilSupabase, VigilInventoryItem } from "@/integrations/vigil/client";
import { useToast } from "@/hooks/use-toast";

export const useVigilInventory = (householdId: string | null) => {
  const [items, setItems] = useState<VigilInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    if (!householdId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await vigilSupabase
        .from("inventory")
        .select("*")
        .eq("household_id", householdId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error("Error fetching Vigil inventory:", error);
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Real-time subscription for Raspberry Pi updates
  useEffect(() => {
    if (!householdId) return;

    const channel = vigilSupabase
      .channel("vigil-inventory-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventory",
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setItems((prev) => [payload.new as VigilInventoryItem, ...prev]);
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
      vigilSupabase.removeChannel(channel);
    };
  }, [householdId]);

  const updateItemStatus = async (id: string, status: "in" | "opened" | "out") => {
    try {
      const { error } = await vigilSupabase
        .from("inventory")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Item marked as ${status}`,
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
    refetch: fetchItems,
    updateItemStatus,
  };
};
