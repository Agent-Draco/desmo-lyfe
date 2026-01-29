import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExpiringItem {
  id: string;
  name: string;
  expiry_date: string;
  daysUntilExpiry: number;
}

interface PopUpReminderProps {
  isVisible: boolean;
  expiringItems: ExpiringItem[];
  onDismiss: () => void;
  onAddToShoppingList: (itemName: string) => void;
  dismissedItems?: Set<string>;
  onItemDismissed?: (itemId: string) => void;
}

export const PopUpReminder = ({
  isVisible,
  expiringItems,
  onDismiss,
  onAddToShoppingList,
  dismissedItems = new Set(),
  onItemDismissed,
}: PopUpReminderProps) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isVisible && expiringItems.length > 0) {
      setCurrentItemIndex(0);
      setAddedItems(new Set());
    }
  }, [isVisible, expiringItems.length]);

  const currentItem = expiringItems[currentItemIndex];

  const handleNext = () => {
    if (currentItemIndex < expiringItems.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    } else {
      onDismiss();
    }
  };

  const handleAddToList = () => {
    onAddToShoppingList(currentItem.name);
    setAddedItems(prev => new Set(prev).add(currentItem.id));
    handleNext();
  };

  const handleSkip = () => {
    if (onItemDismissed) {
      onItemDismissed(currentItem.id);
    }
    handleNext();
  };

  if (!isVisible || !currentItem) return null;

  const isExpired = currentItem.daysUntilExpiry <= 0;
  const isUrgent = currentItem.daysUntilExpiry <= 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        onClick={(e) => e.target === e.currentTarget && onDismiss()}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-background rounded-3xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden border border-border"
        >
          {/* Header with urgency indicator */}
          <div className={`px-6 py-5 ${isExpired ? 'bg-destructive/15' : isUrgent ? 'bg-warning/15' : 'bg-warning/10'} border-b border-border`}>
            <div className="flex items-center gap-4">
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`w-12 h-12 rounded-full flex items-center justify-center ${isExpired ? 'bg-destructive/20' : 'bg-warning/20'}`}
              >
                {isExpired ? (
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                ) : (
                  <Clock className="w-6 h-6 text-warning" />
                )}
              </motion.div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground text-lg">
                  {isExpired ? "Item Expired!" : "Expiring Soon!"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {expiringItems.length > 1 ? (
                    `Item ${currentItemIndex + 1} of ${expiringItems.length}`
                  ) : (
                    "Review this item"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <motion.div 
              key={currentItem.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center"
            >
              <h4 className="text-xl font-bold text-foreground mb-3">
                {currentItem.name}
              </h4>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                isExpired 
                  ? 'bg-destructive/10 text-destructive' 
                  : isUrgent 
                    ? 'bg-warning/20 text-warning-foreground' 
                    : 'bg-secondary text-muted-foreground'
              }`}>
                <Clock className="w-4 h-4" />
                {isExpired 
                  ? "Already expired" 
                  : `${currentItem.daysUntilExpiry} day${currentItem.daysUntilExpiry !== 1 ? 's' : ''} left`
                }
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Would you like to add a replacement to your shopping list?
              </p>
            </motion.div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 space-y-3">
            <Button
              onClick={handleAddToList}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Shopping List
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex-1 h-11"
              >
                Skip
              </Button>
              {expiringItems.length > 1 && currentItemIndex < expiringItems.length - 1 && (
                <Button
                  variant="outline"
                  onClick={handleNext}
                  className="flex-1 h-11"
                >
                  Next Item
                </Button>
              )}
            </div>

            {expiringItems.length > 1 && (
              <Button
                variant="ghost"
                onClick={onDismiss}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Dismiss All ({expiringItems.length - currentItemIndex} remaining)
              </Button>
            )}

            {/* Progress dots */}
            {expiringItems.length > 1 && (
              <div className="flex justify-center gap-1.5 pt-2">
                {expiringItems.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentItemIndex 
                        ? 'bg-primary' 
                        : idx < currentItemIndex 
                          ? addedItems.has(expiringItems[idx].id) 
                            ? 'bg-success' 
                            : 'bg-muted-foreground/30'
                          : 'bg-muted-foreground/20'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
