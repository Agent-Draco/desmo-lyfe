import { motion } from "framer-motion";
import { FOOD_CATEGORIES } from "@/integrations/vigil/client";

interface QuickAddPresetProps {
  name: string;
  emoji: string;
  category: string;
  onClick: () => void;
  delay?: number;
}

export const QuickAddPreset = ({ name, emoji, category, onClick, delay = 0 }: QuickAddPresetProps) => {
  const categoryInfo = FOOD_CATEGORIES[category] || FOOD_CATEGORIES.other;
  
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      whileHover={{ scale: 1.08, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="glass-button flex flex-col items-center gap-2 p-4 rounded-2xl min-w-[80px]"
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-xs font-medium text-foreground">{name}</span>
      <span className="text-[10px] text-muted-foreground">{categoryInfo.defaultExpiryDays}d shelf</span>
    </motion.button>
  );
};

export interface QuickAddPresetData {
  name: string;
  emoji: string;
  category: string;
}

export const quickAddPresets: QuickAddPresetData[] = [
  { name: "Milk", emoji: "🥛", category: "dairy" },
  { name: "Eggs", emoji: "🥚", category: "eggs" },
  { name: "Bread", emoji: "🍞", category: "bread" },
  { name: "Butter", emoji: "🧈", category: "dairy" },
  { name: "Cheese", emoji: "🧀", category: "dairy" },
  { name: "Chicken", emoji: "🍗", category: "poultry" },
  { name: "Apples", emoji: "🍎", category: "fruits" },
  { name: "Bananas", emoji: "🍌", category: "fruits" },
  { name: "Salmon", emoji: "🐟", category: "seafood" },
  { name: "Rice", emoji: "🍚", category: "grains" },
  { name: "Yogurt", emoji: "🥄", category: "dairy" },
  { name: "Orange Juice", emoji: "🍊", category: "beverages" },
];
