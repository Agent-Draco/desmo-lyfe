import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";
import { Package, Clock, User } from "lucide-react";

interface InventoryItemProps {
  name: string;
  quantity: number;
  expiryDate?: Date;
  addedBy?: string;
  addedAt?: Date;
  isInStock?: boolean;
  onClick?: () => void;
  delay?: number;
}

export const InventoryItem = ({
  name,
  quantity,
  expiryDate,
  addedBy,
  addedAt,
  isInStock = true,
  onClick,
  delay = 0,
}: InventoryItemProps) => {
  const now = new Date();
  const daysUntilExpiry = expiryDate 
    ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 2 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

  const getTimeSince = (date: Date) => {
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <GlassCard 
      isExpiring={isExpiringSoon} 
      onClick={onClick}
      delay={delay}
      className="flex items-center gap-4"
    >
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center",
        isInStock ? "bg-success/10" : "bg-muted",
        isExpiringSoon && "bg-warning/20",
        isExpired && "bg-destructive/10"
      )}>
        <Package className={cn(
          "w-6 h-6",
          isInStock ? "text-success" : "text-muted-foreground",
          isExpiringSoon && "text-warning",
          isExpired && "text-destructive"
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground truncate">{name}</h3>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            isInStock 
              ? "bg-success/10 text-success" 
              : "bg-muted text-muted-foreground"
          )}>
            {isInStock ? "In Stock" : "Out"}
          </span>
        </div>
        
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
          <span className="font-medium">{quantity}x</span>
          
          {expiryDate && (
            <span className={cn(
              "flex items-center gap-1",
              isExpiringSoon && "text-warning font-medium",
              isExpired && "text-destructive font-medium"
            )}>
              <Clock className="w-3.5 h-3.5" />
              {isExpired 
                ? "Expired" 
                : isExpiringSoon 
                  ? `${daysUntilExpiry}d left` 
                  : `${daysUntilExpiry}d`
              }
            </span>
          )}
        </div>
      </div>
      
      {addedBy && addedAt && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-primary" />
          </div>
          <span>{getTimeSince(addedAt)}</span>
        </div>
      )}
    </GlassCard>
  );
};
