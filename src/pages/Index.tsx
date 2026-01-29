import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "@/components/Header";
import { GlassNav } from "@/components/GlassNav";
import { RemovalModeToggle } from "@/components/RemovalModeToggle";
import { SuccessFlash } from "@/components/SuccessFlash";
import { PopUpReminder } from "@/components/PopUpReminder";
import { MedicineDoseReminder } from "@/components/MedicineDoseReminder";
import { RecipeDrawer } from "@/components/RecipeDrawer";
import { HomeView } from "@/components/views/HomeView";
import { InventoryView } from "@/components/views/InventoryView";
import { ShoppingListView } from "@/components/views/ShoppingListView";
import { ScanView } from "@/components/views/ScanView";
import { FamilyView } from "@/components/views/FamilyView";
import { SettingsView } from "@/components/views/SettingsView";
import { CommView } from "@/components/views/CommView";
import { NudgesView } from "@/components/views/NudgesView";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useInventory } from "@/hooks/useInventory";
import { useShoppingList } from "@/hooks/useShoppingList";
import { useExpiryNotifications } from "@/hooks/useExpiryNotifications";
import { quickAddPresets } from "@/components/QuickAddPreset";
import { Loader2 } from "lucide-react";
import { vigilSupabase } from "@/integrations/vigil/client";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [removalMode, setRemovalMode] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [expiringItems, setExpiringItems] = useState([]);
  const [dueMedicineId, setDueMedicineId] = useState<string | null>(null);
  const [recipeIngredient, setRecipeIngredient] = useState<string | null>(null);
  const [commListings, setCommListings] = useState<
    Array<{ id: string; title: string; mode: "s-comm" | "b-comm"; lister_name?: string; quantity?: number; unit?: string | null }>
  >([]);
  const navigate = useNavigate();

  const { user, profile, household, loading: authLoading, signOut, hasHousehold } = useAuth();
  const { items: inventory, loading: inventoryLoading, addItem, deleteItem, updateItem, decrementItem } = useInventory(household?.id || null);
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

  useEffect(() => {
    if (!showReminder) return;
    let cancelled = false;

    const fetchCommListings = async () => {
      try {
        const { data, error } = await vigilSupabase
          .from("listings")
          .select("id,title,mode,lister_name,quantity,unit")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(12);

        if (error) throw error;
        if (!cancelled) setCommListings(((data as any[]) || []) as any);
      } catch (e) {
        // If the Vigil schema doesn't include unit or listings isn't available, keep empty.
        if (!cancelled) setCommListings([]);
      }
    };

    void fetchCommListings();
    return () => {
      cancelled = true;
    };
  }, [showReminder]);

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

  const handleAddItem = async (item: {
    name: string;
    barcode?: string;
    exp?: string;
    mfg?: string;
    batch?: string;
    item_type?: "food" | "medicine";
    medicine_is_dosaged?: boolean;
    medicine_dose_amount?: number;
    medicine_dose_unit?: string;
    medicine_dose_times?: string[];
    medicine_timezone?: string;
    medicine_next_dose_at?: string;
  }) => {
    const result = await addItem({
      name: item.name,
      barcode: item.barcode,
      expiry_date: item.exp,
      manufacturing_date: item.mfg,
      batch_number: item.batch,
      item_type: item.item_type,
      medicine_is_dosaged: item.medicine_is_dosaged,
      medicine_dose_amount: item.medicine_dose_amount,
      medicine_dose_unit: item.medicine_dose_unit,
      medicine_dose_times: item.medicine_dose_times,
      medicine_timezone: item.medicine_timezone,
      medicine_next_dose_at: item.medicine_next_dose_at,
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

  const computeNextDoseAt = (times: string[] | null | undefined, now = new Date()) => {
    if (!times || times.length === 0) return null;
    const sorted = [...times].sort();

    for (const t of sorted) {
      const [hhRaw, mmRaw] = t.split(":");
      const hh = parseInt(hhRaw, 10);
      const mm = parseInt(mmRaw, 10);
      if (Number.isNaN(hh) || Number.isNaN(mm)) continue;

      const candidate = new Date(now);
      candidate.setSeconds(0, 0);
      candidate.setHours(hh, mm, 0, 0);
      if (candidate.getTime() > now.getTime()) return candidate.toISOString();
    }

    const [hhRaw, mmRaw] = sorted[0].split(":");
    const hh = parseInt(hhRaw, 10);
    const mm = parseInt(mmRaw, 10);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;

    const next = new Date(now);
    next.setDate(now.getDate() + 1);
    next.setSeconds(0, 0);
    next.setHours(hh, mm, 0, 0);
    return next.toISOString();
  };

  // Detect due dosaged medicines and show reminder.
  useEffect(() => {
    if (dueMedicineId) return;
    if (!inventory || inventory.length === 0) return;

    const now = new Date();

    const due = inventory.find((it: any) => {
      if (it.is_out) return false;
      if (it.item_type !== "medicine") return false;
      if (!it.medicine_is_dosaged) return false;
      if (!it.medicine_next_dose_at) return false;

      const next = new Date(it.medicine_next_dose_at);
      if (Number.isNaN(next.getTime())) return false;
      if (next.getTime() > now.getTime()) return false;

      if (it.medicine_snooze_until) {
        const snooze = new Date(it.medicine_snooze_until);
        if (!Number.isNaN(snooze.getTime()) && snooze.getTime() > now.getTime()) return false;
      }

      return true;
    });

    if (due?.id) setDueMedicineId(due.id);
  }, [inventory, dueMedicineId]);

  const dueMedicine = dueMedicineId ? (inventory as any).find((it: any) => it.id === dueMedicineId) : null;

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
      case "nudges":
        return <NudgesView inventory={inventory} />;
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

      <MedicineDoseReminder
        isVisible={Boolean(dueMedicine)}
        medicine={dueMedicine}
        onTaken={async () => {
          if (!dueMedicine) return;
          const now = new Date();
          const nextDoseAt = computeNextDoseAt(dueMedicine.medicine_dose_times, now);

          await decrementItem(dueMedicine.id);
          await updateItem(dueMedicine.id, {
            medicine_last_taken_at: now.toISOString(),
            medicine_snooze_until: null,
            medicine_next_dose_at: nextDoseAt,
          } as any);

          setDueMedicineId(null);
        }}
        onNotTaken={async () => {
          if (!dueMedicine) return;
          const snooze = new Date();
          snooze.setHours(snooze.getHours() + 1);

          await updateItem(dueMedicine.id, {
            medicine_snooze_until: snooze.toISOString(),
          } as any);

          setDueMedicineId(null);
        }}
        onDismiss={() => setDueMedicineId(null)}
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
        onSeeRecipes={(ingredient) => {
          setRecipeIngredient(ingredient);
          setShowReminder(false);
        }}
        commListings={commListings}
      />

      <RecipeDrawer
        isOpen={Boolean(recipeIngredient)}
        ingredient={recipeIngredient ?? ""}
        onClose={() => setRecipeIngredient(null)}
      />
    </div>
  );
};

export default Index;
