import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Clock } from "lucide-react";
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
}

export const PopUpReminder = ({
  isVisible,
  expiringItems,
  onDismiss,
  onAddToShoppingList,
}: PopUpReminderProps) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  useEffect(() => {
    if (isVisible && expiringItems.length > 0) {
      setCurrentItemIndex(0);
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
    handleNext();
  };

  const handleDismiss = () => {
    handleNext();
  };

  if (!isVisible || !currentItem) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-background rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-warning/10 px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Item Expiring Soon</h3>
                <p className="text-sm text-muted-foreground">
                  {expiringItems.length > 1 && `${currentItemIndex + 1} of ${expiringItems.length}`}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-foreground mb-2">
                {currentItem.name}
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Expires in {currentItem.daysUntilExpiry} day{currentItem.daysUntilExpiry !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-muted-foreground">
                Would you like to add this to your shopping list?
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 space-y-3">
            <Button
              onClick={handleAddToList}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Shopping List
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="flex-1"
              >
                Dismiss
              </Button>
              {expiringItems.length > 1 && (
                <Button
                  variant="outline"
                  onClick={handleNext}
                  className="flex-1"
                >
                  Next
                </Button>
              )}
            </div>

            {expiringItems.length > 1 && (
              <Button
                variant="ghost"
                onClick={onDismiss}
                className="w-full text-muted-foreground"
              >
                Dismiss All
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
