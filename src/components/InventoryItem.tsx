import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";
import {
  Package, Clock, Milk, Egg, Croissant, Beef, Drumstick, Apple, Carrot,
  Snowflake, Wine, Cookie, Droplet, Wheat, Fish, Calendar, Hash, Zap, ChefHat
} from "lucide-react";
import { getVisualStateConfig, getItemState } from "@/lib/rulesEngine";


interface InventoryItemProps {
  name: string;
  quantity: number;
  expiryDate?: Date;
  mfgDate?: Date;
  batch?: string | null;
  isInStock?: boolean;
  state?: string | null;
  category?: string | null;
  lastTap?: string | null;
  createdAt?: Date;
  onClick?: () => void;
  onOpen?: () => void;
  onTap?: () => void;
  onViewRecipes?: () => void;
  onPulse?: () => void;
  delay?: number;
}

export const InventoryItem = ({
  name,
  quantity,
  expiryDate,
  mfgDate,
  batch,
  isInStock = true,
  state,
  category,
  lastTap,
  onClick,
  onOpen,
  onTap,
  onViewRecipes,
  onPulse,
  delay = 0
}: InventoryItemProps) => {
  const visualState = getVisualStateConfig(state || getItemState(expiryDate, category));
  const isExpiring = visualState.variant === 'warning' || visualState.variant === 'destructive';

  const getCategoryIcon = (categoryName?: string | null) => {
    if (!categoryName) return Package;

    const category = categoryName.toLowerCase();
    if (category.includes('dairy') || category.includes('milk')) return Milk;
    if (category.includes('egg')) return Egg;
    if (category.includes('bread') || category.includes('bakery')) return Croissant;
    if (category.includes('meat') || category.includes('beef')) return Beef;
    if (category.includes('chicken') || category.includes('poultry')) return Drumstick;
    if (category.includes('fruit') || category.includes('apple')) return Apple;
    if (category.includes('vegetable') || category.includes('carrot')) return Carrot;
    if (category.includes('frozen')) return Snowflake;
    if (category.includes('beverage') || category.includes('wine')) return Wine;
    if (category.includes('snack') || category.includes('cookie')) return Cookie;
    if (category.includes('liquid') || category.includes('oil')) return Droplet;
    if (category.includes('grain') || category.includes('wheat')) return Wheat;
    if (category.includes('fish') || category.includes('seafood')) return Fish;
    return Package;
  };

  const IconComponent = getCategoryIcon(category);

  const formatDate = (date?: Date) => {
    if (!date) return null;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntilExpiry = (expiry?: Date) => {
    if (!expiry) return null;
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = getDaysUntilExpiry(expiryDate);

  return (
    <GlassCard
      isExpiring={isExpiring}
      onClick={onClick}
      delay={delay}
      className={cn(
        "relative overflow-hidden",
        !isInStock && "opacity-60"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <motion.div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
            visualState.iconBg
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <IconComponent className={cn("w-6 h-6", visualState.iconColor)} />
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-foreground truncate pr-2">
              {name}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              {quantity > 1 && (
                <span className="text-sm text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                  {quantity}
                </span>
              )}
              {!isInStock && (
                <span className="text-xs text-muted-foreground bg-destructive/10 px-2 py-0.5 rounded-full">
                  Out
                </span>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {mfgDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Mfg: {formatDate(mfgDate)}</span>
              </div>
            )}
            {expiryDate && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Exp: {formatDate(expiryDate)}</span>
                {daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
                  <span className={cn(
                    "ml-1 px-1.5 py-0.5 rounded text-xs font-medium",
                    daysUntilExpiry <= 0
                      ? "bg-destructive/20 text-destructive"
                      : daysUntilExpiry <= 1
                        ? "bg-warning/20 text-warning"
                        : "bg-secondary/50 text-muted-foreground"
                  )}>
                    {daysUntilExpiry <= 0 ? "Expired" : `${daysUntilExpiry}d`}
                  </span>
                )}
              </div>
            )}
            {batch && batch !== "-" && (
              <div className="flex items-center gap-1">
                <Hash className="w-3 h-3" />
                <span>{batch}</span>
              </div>
            )}
          </div>

          {/* State indicator */}
          {state && (
            <div className="flex items-center gap-1 mt-1">
              <div className={cn("w-2 h-2 rounded-full", visualState.dotColor)} />
              <span className="text-xs text-muted-foreground capitalize">
                {state.toLowerCase()}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-2">
            {/* View Recipes button for critical food items */}
            {visualState.variant === 'warning' && category?.toLowerCase().includes('food') && onViewRecipes && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewRecipes();
                }}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-full transition-colors"
              >
                <ChefHat className="w-3 h-3" />
                View Recipes
              </button>
            )}

            {/* Manual Pulse button */}
            {onPulse && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPulse();
                }}
                className="flex items-center gap-1 text-xs text-warning hover:text-warning/80 bg-warning/10 hover:bg-warning/20 px-2 py-1 rounded-full transition-colors"
              >
                <Zap className="w-3 h-3" />
                Pulse
              </button>
            )}
          </div>
        </div>

        {/* Pulse indicator for critical items */}
        {visualState.showPulse && (
          <motion.div
            className="absolute inset-0 border-2 border-primary/30 rounded-2xl"
            animate={{
              scale: [1, 1.02, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </div>
    </GlassCard>
  );
};
