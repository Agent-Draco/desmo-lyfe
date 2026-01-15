import { motion, AnimatePresence } from "framer-motion";
import { InventoryItem } from "@/components/InventoryItem";
import { Grid, List } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface InventoryViewProps {
  inventory: Array<{
    id: string;
    name: string;
    quantity: number;
    expiryDate: Date;
    addedBy: string;
    addedAt: Date;
    isInStock: boolean;
  }>;
  onItemClick: (id: string) => void;
}

export const InventoryView = ({ inventory, onItemClick }: InventoryViewProps) => {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  return (
    <section>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
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

      <div className={cn(
        viewMode === "grid" 
          ? "grid grid-cols-2 md:grid-cols-3 gap-4" 
          : "space-y-3"
      )}>
        <AnimatePresence>
          {inventory.map((item, i) => (
            <InventoryItem
              key={item.id}
              name={item.name}
              quantity={item.quantity}
              expiryDate={item.expiryDate}
              addedBy={item.addedBy}
              addedAt={item.addedAt}
              isInStock={item.isInStock}
              onClick={() => onItemClick(item.id)}
              delay={i * 0.05}
            />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
};
