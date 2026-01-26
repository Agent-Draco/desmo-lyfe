import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";
import { 
  Package, Clock, Milk, Egg, Croissant, Beef, Drumstick, Apple, Carrot, 
  Snowflake, Wine, Cookie, Droplet, Wheat, Fish, Calendar, Hash, Zap
} from "lucide-react";
import { getVisualStateConfig, getItemState } from "@/lib/rulesEngine";


interface InventoryItemProps {
  name: string;
  quantity: number;
  expiryDate?: Date;
  mfgDate?: Date;
  batch?: string | null;
  isInStock?: boolean;
  state?: string | null;
  category?: string | null;
  lastTap?: string | null;
  onClick?: () => void;
  onOpen?: () => void;
  onTap?: () => void;
  delay?: number;
}
=======
import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";
import {
  Package, Clock, Milk, Egg, Croissant, Beef, Drumstick, Apple, Carrot,
  Snowflake, Wine, Cookie, Droplet, Wheat, Fish, Calendar, Hash, Zap
} from "lucide-react";
import { getVisualStateConfig, getItemState } from "@/lib/rulesEngine";


interface InventoryItemProps {
  name: string;
  quantity: number;
  expiryDate?: Date;
  mfgDate?: Date;
  batch?: string | null;
  isInStock?: boolean;
  state?: string | null;
  category?: string | null;
  lastTap?: string | null;
  onClick?: () => void;
  onOpen?: () => void;
  onTap?: () => void;
  delay?: number;
}
