import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, AlertTriangle, Users, Clock } from "lucide-react";
import { Header } from "@/components/Header";
import { GlassNav } from "@/components/GlassNav";
import { InventoryItem } from "@/components/InventoryItem";
import { QuickAddPreset, quickAddPresets } from "@/components/QuickAddPreset";
import { RemovalModeToggle } from "@/components/RemovalModeToggle";
import { SuccessFlash } from "@/components/SuccessFlash";
import { StatsCard } from "@/components/StatsCard";
import { cn } from "@/lib/utils";

// Mock data for demonstration
const mockInventory = [
  {
    id: "1",
    name: "Organic Whole Milk",
    quantity: 2,
    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1), // 1 day
    addedBy: "Sarah",
    addedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    isInStock: true,
  },
  {
    id: "2",
    name: "Free-Range Eggs",
    quantity: 12,
    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
    addedBy: "Mike",
    addedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    isInStock: true,
  },
  {
    id: "3",
    name: "Sourdough Bread",
    quantity: 1,
    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days
    addedBy: "Sarah",
    addedAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    isInStock: true,
  },
  {
    id: "4",
    name: "Greek Yogurt",
    quantity: 0,
    expiryDate: new Date(Date.now() - 1000 * 60 * 60 * 24), // Expired
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
      // Trigger success flash
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 300);
      
      // In real app, would decrement quantity
      console.log(`Removed item ${id}`);
    }
  };

  const handleQuickAdd = (name: string) => {
    console.log(`Quick adding: ${name}`);
    // Would add item in real app
  };

  const expiringCount = inventory.filter((item) => {
    const days = Math.ceil(
      (item.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days <= 2 && days > 0;
  }).length;

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
        {/* Stats Section */}
        <section className="mb-8">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider"
          >
            Overview
          </motion.h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Items"
              value={inventory.length}
              icon={Package}
              trend="up"
              trendValue="3"
              delay={0}
            />
            <StatsCard
              title="Expiring Soon"
              value={expiringCount}
              icon={AlertTriangle}
              variant="warning"
              delay={0.1}
            />
            <StatsCard
              title="Family Members"
              value={4}
              icon={Users}
              delay={0.2}
            />
            <StatsCard
              title="Last Scan"
              value="30m"
              icon={Clock}
              variant="success"
              delay={0.3}
            />
          </div>
        </section>

        {/* Quick Add Section */}
        <section className="mb-8">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider"
          >
            Quick Add
          </motion.h2>
          
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {quickAddPresets.map((preset, i) => (
              <QuickAddPreset
                key={preset.name}
                name={preset.name}
                emoji={preset.emoji}
                onClick={() => handleQuickAdd(preset.name)}
                delay={0.3 + i * 0.05}
              />
            ))}
          </div>
        </section>

        {/* Inventory Section */}
        <section>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between mb-4"
          >
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Inventory
            </h2>
            <span className="text-xs text-muted-foreground">
              {inventory.length} items
            </span>
          </motion.div>
          
          <div className="space-y-3">
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
                  onClick={() => handleItemClick(item.id)}
                  delay={0.5 + i * 0.1}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      </main>

      <RemovalModeToggle 
        isActive={removalMode} 
        onToggle={() => setRemovalMode(!removalMode)} 
      />
      
      <GlassNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
