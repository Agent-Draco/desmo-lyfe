import { useState } from "react";
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

// Mock data for demonstration
const mockInventory = [
  {
    id: "1",
    name: "Organic Whole Milk",
    quantity: 2,
    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
    addedBy: "Sarah",
    addedAt: new Date(Date.now() - 1000 * 60 * 30),
    isInStock: true,
  },
  {
    id: "2",
    name: "Free-Range Eggs",
    quantity: 12,
    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    addedBy: "Mike",
    addedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isInStock: true,
  },
  {
    id: "3",
    name: "Sourdough Bread",
    quantity: 1,
    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
    addedBy: "Sarah",
    addedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    isInStock: true,
  },
  {
    id: "4",
    name: "Greek Yogurt",
    quantity: 0,
    expiryDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
    addedBy: "Mike",
    addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    isInStock: false,
  },
  {
    id: "5",
    name: "Fresh Spinach",
    quantity: 1,
    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    addedBy: "Sarah",
    addedAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
    isInStock: true,
  },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [removalMode, setRemovalMode] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [inventory] = useState(mockInventory);

  const handleItemClick = (id: string) => {
    if (removalMode) {
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 300);
      console.log(`Removed item ${id}`);
    }
  };

  const handleQuickAdd = (name: string) => {
    console.log(`Quick adding: ${name}`);
  };

  const handleScan = () => {
    console.log("Starting scan...");
  };

  const handleManualEntry = () => {
    console.log("Manual entry...");
  };

  const expiringCount = inventory.filter((item) => {
    const days = Math.ceil(
      (item.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days <= 2 && days > 0;
  }).length;

  const renderView = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeView
            inventory={inventory}
            onItemClick={handleItemClick}
            onQuickAdd={handleQuickAdd}
          />
        );
      case "inventory":
        return (
          <InventoryView
            inventory={inventory}
            onItemClick={handleItemClick}
          />
        );
      case "scan":
        return (
          <ScanView
            onScan={handleScan}
            onManualEntry={handleManualEntry}
          />
        );
      case "family":
        return <FamilyView />;
      case "settings":
        return <SettingsView />;
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
        userName="Sarah" 
        householdName="The Smith Kitchen"
        notificationCount={expiringCount}
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
