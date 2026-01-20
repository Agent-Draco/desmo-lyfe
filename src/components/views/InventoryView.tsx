import { motion, AnimatePresence } from "framer-motion";
import { InventoryItem } from "@/components/InventoryItem";
import { Grid, List, Loader2, Apple, Cpu, Pill, ChefHat, DollarSign, Activity } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

import type { InventoryItem as InventoryItemType } from "@/hooks/useInventory";

interface InventoryViewProps {
  inventory: InventoryItemType[];
  onItemClick: (id: string) => void;
  onOpenItem?: (id: string) => void;
  loading?: boolean;
}

export const InventoryView = ({ inventory, onItemClick, onOpenItem, loading }: InventoryViewProps) => {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const groupedInventory = useMemo(() => {
    const groups: Record<string, InventoryItemType[]> = {
      Food: [],
      Electronics: [],
      Meds: [],
      Other: []
    };

    inventory.forEach(item => {
      const category = item.category || 'Other';
      if (groups[category]) {
        groups[category].push(item);
      } else {
        groups.Other.push(item);
      }
    });

    return groups;
  }, [inventory]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Food':
        return <Apple className="w-5 h-5" />;
      case 'Electronics':
        return <Cpu className="w-5 h-5" />;
      case 'Meds':
        return <Pill className="w-5 h-5" />;
      default:
        return <ChefHat className="w-5 h-5" />;
    }
  };

  const renderCategorySection = (category: string, items: InventoryItemType[]) => {
    if (items.length === 0) return null;

    return (
      <motion.div
        key={category}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          {getCategoryIcon(category)}
          <h3 className="text-lg font-semibold text-foreground">{category}</h3>
          <span className="text-sm text-muted-foreground">({items.length})</span>
        </div>

        {category === 'Food' && (
          <div className="mb-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ChefHat className="w-4 h-4" />
              <span>Check expiry dates and 'Eat Me First' recipes</span>
            </div>
          </div>
        )}

        {category === 'Electronics' && (
          <div className="mb-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              <span>Monitor depreciation values from metadata</span>
            </div>
          </div>
        )}

        {category === 'Meds' && (
          <div className="mb-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="w-4 h-4" />
              <span>Track dosage adherence logs</span>
            </div>
          </div>
        )}

        <div className={cn(
          viewMode === "grid"
            ? "grid grid-cols-2 md:grid-cols-3 gap-4"
            : "space-y-3"
        )}>
          <AnimatePresence>
            {items.map((item, i) => (
              <InventoryItem
                key={item.id}
                name={item.name}
                quantity={item.quantity}
                expiryDate={item.expiry_date ? new Date(item.expiry_date) : undefined}
                mfgDate={item.mfg_date ? new Date(item.mfg_date) : undefined}
                batch={item.batch}
                isInStock={!item.is_out}
                state={item.state}
                category={item.category}
                onClick={() => onItemClick(item.id)}
                onOpen={onOpenItem ? () => onOpenItem(item.id) : undefined}
                delay={i * 0.05}
              />
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

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

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : inventory.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No items in inventory yet</p>
          <p className="text-sm mt-1">Scan items to add them</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedInventory).map(([category, items]) =>
            renderCategorySection(category, items)
          )}
        </div>
      )}
    </section>
  );
};
