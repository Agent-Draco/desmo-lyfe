import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "@/components/Header";
import { GlassNav } from "@/components/GlassNav";
import { RemovalModeToggle } from "@/components/RemovalModeToggle";
import { SuccessFlash } from "@/components/SuccessFlash";
import { PopUpReminder } from "@/components/PopUpReminder";
import { HomeView } from "@/components/views/HomeView";
import { InventoryView } from "@/components/views/InventoryView";
import { ShoppingListView } from "@/components/views/ShoppingListView";
import { ScanView } from "@/components/views/ScanView";
import { FamilyView } from "@/components/views/FamilyView";
import { SettingsView } from "@/components/views/SettingsView";
import { CommView } from "@/components/views/CommView";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useInventory } from "@/hooks/useInventory";
import { useShoppingList } from "@/hooks/useShoppingList";
import { useExpiryNotifications } from "@/hooks/useExpiryNotifications";
import { quickAddPresets } from "@/components/QuickAddPreset";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [removalMode, setRemovalMode] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [expiringItems, setExpiringItems] = useState([]);
  const navigate = useNavigate();

  const { user, profile, household, loading: authLoading, signOut, hasHousehold } = useAuth();
  const { items: inventory, loading: inventoryLoading, addItem, deleteItem } = useInventory(household?.id || null);
  const { items: shoppingList, loading: shoppingListLoading, addItem: addShoppingItem, deleteItem: deleteShoppingItem } = useShoppingList(household?.id || null);

  // Enable expiry notifications - cast to any to bypass type checking between different inventory formats
  const { expiringCount, expiredCount } = useExpiryNotifications(inventory as any, {
    warningDays: 3,
    checkInterval: 300000, // Check every 5 minutes
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!authLoading && user && !hasHousehold) {
      navigate("/onboarding");
    }
  }, [authLoading, user, hasHousehold, navigate]);

  // Check for expiring items and show reminder on initial load
  useEffect(() => {
    if (inventory.length > 0) {
      const now = new Date();
      const expiringSoon = inventory.filter(item => {
        if (!item.expiry_date || item.is_out) return false;
        const expiryDate = new Date(item.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
      }).map(item => {
        const expiryDate = new Date(item.expiry_date!);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: item.id,
          name: item.name,
          expiry_date: item.expiry_date!,
          daysUntilExpiry
        };
      });

      if (expiringSoon.length > 0 && !showReminder) {
        setExpiringItems(expiringSoon);
        // Small delay to let the page load first
        setTimeout(() => setShowReminder(true), 1000);
      }
    }
  }, [inventory]);

  const handleItemClick = async (id: string) => {
    if (removalMode) {
      const success = await deleteItem(id);
      if (success) {
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 300);
      }
    }
  };

  const handleQuickAdd = async (name: string) => {
    const preset = quickAddPresets.find(p => p.name === name);

    // Calculate manufacturing and expiry dates based on market standards
    const today = new Date();
    const manufacturingDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    let expiryDate: string;
    const nameLower = name.toLowerCase();

    // Market standard expiry calculations
    if (nameLower.includes('milk') || nameLower.includes('cheese') || nameLower.includes('yogurt') || nameLower.includes('butter')) {
      // Dairy: 7-14 days
      const expiry = new Date(today);
      expiry.setDate(today.getDate() + 10); // Average 10 days
      expiryDate = expiry.toISOString().split('T')[0];
    } else if (nameLower.includes('chicken') || nameLower.includes('salmon') || nameLower.includes('meat')) {
      // Meat: 3-5 days
      const expiry = new Date(today);
      expiry.setDate(today.getDate() + 4); // Average 4 days
      expiryDate = expiry.toISOString().split('T')[0];
    } else if (nameLower.includes('bread')) {
      // Bakery: 3-5 days
      const expiry = new Date(today);
      expiry.setDate(today.getDate() + 4); // Average 4 days
      expiryDate = expiry.toISOString().split('T')[0];
    } else if (nameLower.includes('rice') || nameLower.includes('grains')) {
      // Grains: 1-2 years
      const expiry = new Date(today);
      expiry.setFullYear(today.getFullYear() + 1); // 1 year
      expiryDate = expiry.toISOString().split('T')[0];
    } else if (nameLower.includes('juice') || nameLower.includes('beverages')) {
      // Beverages: 7-14 days
      const expiry = new Date(today);
      expiry.setDate(today.getDate() + 10); // Average 10 days
      expiryDate = expiry.toISOString().split('T')[0];
    } else {
      // Default for fruits/vegetables: 7-14 days
      const expiry = new Date(today);
      expiry.setDate(today.getDate() + 10); // Average 10 days
      expiryDate = expiry.toISOString().split('T')[0];
    }

    await addItem({
      name,
      category: preset?.category,
      manufacturing_date: manufacturingDate,
      expiry_date: expiryDate,
      batch_number: "-"
    });
  };

  const handleAddItem = async (item: { name: string; barcode?: string; exp?: string; mfg?: string; batch?: string }) => {
    const result = await addItem({
      name: item.name,
      barcode: item.barcode,
      expiry_date: item.exp,
      manufacturing_date: item.mfg,
      batch_number: item.batch,
    });

    // Remove from shopping list if item was successfully added to inventory
    if (result) {
      const shoppingItem = shoppingList.find(s => s.item_name.toLowerCase() === item.name.toLowerCase());
      if (shoppingItem) {
        await deleteShoppingItem(shoppingItem.id);
      }
    }

    return result;
  };

  // Combined notification count
  const notificationCount = expiringCount + expiredCount;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !hasHousehold) return null;

  const renderView = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeView
            inventory={inventory}
            onItemClick={handleItemClick}
            onQuickAdd={handleQuickAdd}
            shoppingList={shoppingList}
            onViewShoppingList={() => setActiveTab("shopping")}
            shoppingListLoading={shoppingListLoading}
            loading={inventoryLoading}
          />
        );
      case "inventory":
        return (
          <InventoryView
            inventory={inventory}
            onItemClick={handleItemClick}
            loading={inventoryLoading}
          />
        );
      case "shopping":
        return (
          <ShoppingListView
            shoppingList={shoppingList}
            onAddItem={addShoppingItem}
            onDeleteItem={deleteShoppingItem}
            loading={shoppingListLoading}
          />
        );
      case "scan":
        return <ScanView onAddItem={handleAddItem} />;
      case "family":
        return <FamilyView household={household} currentUserId={user?.id || null} />;
      case "comm":
        return <CommView household={household} currentUserId={user?.id || null} inventory={inventory} />;
      case "settings":
        return <SettingsView profile={profile} household={household} onSignOut={signOut} />;
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500",
      removalMode ? "removal-mode" : "bg-background"
    )}>
      <SuccessFlash isVisible={showFlash} />
      <Header 
        userName={profile?.display_name || "User"} 
        householdName={household?.name || "Kitchen"}
        notificationCount={notificationCount}
      />
      
      <main className="pt-24 pb-44 px-4 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {(activeTab === "home" || activeTab === "inventory") && (
        <RemovalModeToggle 
          isActive={removalMode} 
          onToggle={() => setRemovalMode(!removalMode)} 
        />
      )}
      
      <GlassNav activeTab={activeTab} onTabChange={setActiveTab} />

      <PopUpReminder
        isVisible={showReminder}
        expiringItems={expiringItems}
        onDismiss={() => setShowReminder(false)}
        onAddToShoppingList={async (itemName) => {
          // Add to shopping list
          await addShoppingItem({ item_name: itemName, quantity: 1 });
          setShowReminder(false);
        }}
      />
    </div>
  );
};

export default Index;
