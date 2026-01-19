import { motion, AnimatePresence } from "framer-motion";
import { InventoryItem } from "@/components/InventoryItem";
import { Grid, List, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { FOOD_CATEGORIES } from "@/integrations/vigil/client";
import type { KitchenInventoryItem as InventoryItemType } from "@/hooks/useKitchenInventory";

interface InventoryViewProps {
  inventory: InventoryItemType[];
  onItemClick: (id: string) => void;
  loading?: boolean;
}

export const InventoryView = ({ inventory, onItemClick, loading }: InventoryViewProps) => {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Group items by category
  const categorizedItems = useMemo(() => {
    const grouped: Record<string, InventoryItemType[]> = {};
    inventory.forEach(item => {
      const cat = item.category || "other";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });
    return grouped;
  }, [inventory]);

  // Get unique categories present in inventory
  const presentCategories = useMemo(() => {
    return Object.keys(categorizedItems).sort();
  }, [categorizedItems]);

  // Filter items based on selected category
  const filteredItems = useMemo(() => {
    if (!selectedCategory) return inventory;
    return categorizedItems[selectedCategory] || [];
  }, [inventory, categorizedItems, selectedCategory]);

  return (
    <section>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <h2 className="text-xl font-semibold text-foreground">All Items</h2>
        
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "list" ? "bg-primary text-primary-foreground" : "glass-button"
            )}
          >
            <List className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "grid" ? "bg-primary text-primary-foreground" : "glass-button"
            )}
          >
            <Grid className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* Category Filter Pills */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide mb-4"
      >
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
            selectedCategory === null
              ? "bg-primary text-primary-foreground"
              : "glass-button"
          )}
        >
          All ({inventory.length})
        </button>
        {presentCategories.map(cat => {
          const info = FOOD_CATEGORIES[cat] || FOOD_CATEGORIES.other;
          const count = categorizedItems[cat]?.length || 0;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "glass-button"
              )}
            >
              <span>{info.emoji}</span>
              <span className="capitalize">{cat}</span>
              <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No items in {selectedCategory ? `${selectedCategory} category` : "inventory yet"}</p>
          <p className="text-sm mt-1">Scan items to add them</p>
        </div>
      ) : (
        <div className={cn(
          viewMode === "grid" 
            ? "grid grid-cols-2 md:grid-cols-3 gap-4" 
            : "space-y-3"
        )}>
          <AnimatePresence>
            {filteredItems.map((item, i) => (
              <InventoryItem
                key={item.id}
                name={item.name}
                quantity={item.quantity}
                category={item.category}
                expiryDate={item.expiry_date ? new Date(item.expiry_date) : undefined}
                mfgDate={item.mfg_date ? new Date(item.mfg_date) : undefined}
                batch={item.batch}
                isInStock={!item.is_out}
                onClick={() => onItemClick(item.id)}
                delay={i * 0.05}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
};