import { motion } from "framer-motion";
import { ChefHat, Package, AlertTriangle, Settings, User } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { NudgeFeed } from "@/components/NudgeFeed";
import { RecipeDrawer } from "@/components/RecipeDrawer";
import { EbayListingModal } from "@/components/EbayListingModal";
import { generateNudges } from "@/lib/rulesEngine";
import type { InventoryItem } from "@/hooks/useInventory";
=======
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChefHat, Package, AlertTriangle, Settings, User } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { NudgeFeed } from "@/components/NudgeFeed";
import { RecipeDrawer } from "@/components/RecipeDrawer";
import { EbayListingModal } from "@/components/EbayListingModal";
import { SpoonSureProfile } from "@/components/SpoonSureProfile";
import { generateNudges } from "@/lib/rulesEngine";
import type { InventoryItem } from "@/hooks/useInventory";
