import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "@/components/Header";
import { GlassNav } from "@/components/GlassNav";
import { RemovalModeToggle } from "@/components/RemovalModeToggle";
import { SuccessFlash } from "@/components/SuccessFlash";
import { HomeView } from "@/components/views/HomeView";
import { InventoryView } from "@/components/views/InventoryView";
import { ScanView } from "@/components/views/ScanView";
import { FamilyView } from "@/components/views/FamilyView";
import { SettingsView } from "@/components/views/SettingsView";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useInventory } from "@/hooks/useInventory";
import { useExpiryNotifications } from "@/hooks/useExpiryNotifications";
import { quickAddPresets } from "@/components/QuickAddPreset";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [removalMode, setRemovalMode] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const navigate = useNavigate();

  const { user, profile, household, loading: authLoading, signOut, hasHousehold } = useAuth();
  const { items: inventory, loading: inventoryLoading, addItem, deleteItem } = useInventory(household?.id || null);
  
  // Enable expiry notifications
  const { expiringCount, expiredCount } = useExpiryNotifications(inventory, {
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
    await addItem({ name, category: preset?.category });
  };

  const handleAddItem = async (item: { name: string; barcode?: string; exp?: string; mfg?: string; batch?: string }) => {
    return await addItem({
      name: item.name,
      barcode: item.barcode,
      expiry_date: item.exp,
    });
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
      case "scan":
        return <ScanView onAddItem={handleAddItem} />;
      case "family":
        return <FamilyView household={household} currentUserId={user?.id || null} />;
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
    </div>
  );
};

export default Index;
