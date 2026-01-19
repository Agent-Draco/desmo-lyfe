import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";
import { 
  Package, Clock, Milk, Egg, Croissant, Beef, Drumstick, Apple, Carrot, 
  Snowflake, Wine, Cookie, Droplet, Wheat, Fish, Calendar, Hash
} from "lucide-react";


interface InventoryItemProps {
  name: string;
  quantity: number;
  expiryDate?: Date;
  mfgDate?: Date;
  batch?: string | null;
  isInStock?: boolean;
  onClick?: () => void;
  delay?: number;
}



export const InventoryItem = ({
  name,
  quantity,
  expiryDate,
  mfgDate,
  batch,
  isInStock = true,
  onClick,
  delay = 0,
}: InventoryItemProps) => {
  const now = new Date();
  const daysUntilExpiry = expiryDate
    ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 3 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

  const CategoryIcon = Package;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <GlassCard 
      isExpiring={isExpiringSoon} 
      onClick={onClick}
      delay={delay}
      className="flex items-start gap-4"
    >
      {/* Category Icon */}
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
        isInStock ? "bg-primary/10" : "bg-muted",
        isExpiringSoon && "bg-warning/20",
        isExpired && "bg-destructive/10"
      )}>
        <CategoryIcon className={cn(
          "w-6 h-6",
          isInStock ? "text-primary" : "text-muted-foreground",
          isExpiringSoon && "text-warning",
          isExpired && "text-destructive"
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        {/* Header Row */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">📦</span>
          <h3 className="font-semibold text-foreground truncate">{name}</h3>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium shrink-0",
            isInStock 
              ? "bg-success/10 text-success" 
              : "bg-muted text-muted-foreground"
          )}>
            {isInStock ? "In Stock" : "Out"}
          </span>
        </div>
        
        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {/* Quantity */}
          <div className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" />
            <span>{quantity}x</span>
          </div>
          
          {/* Expiry Date */}
          {expiryDate && (
            <div className={cn(
              "flex items-center gap-1.5",
              isExpiringSoon && "text-warning font-medium",
              isExpired && "text-destructive font-medium"
            )}>
              <Clock className="w-3.5 h-3.5" />
              <span>
                {isExpired 
                  ? "Expired" 
                  : isExpiringSoon 
                    ? `${daysUntilExpiry}d left` 
                    : formatDate(expiryDate)
                }
              </span>
            </div>
          )}
          
          {/* Manufacturing Date */}
          {mfgDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Mfg: {formatDate(mfgDate)}</span>
            </div>
          )}
          
          {/* Batch Number */}
          {batch && (
            <div className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" />
              <span className="truncate">Batch: {batch}</span>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
};
