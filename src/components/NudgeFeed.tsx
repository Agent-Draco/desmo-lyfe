import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Package, AlertTriangle, ExternalLink } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";
import { shouldTriggerNudge, ItemState, ItemCategory } from "@/lib/rulesEngine";
=======
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Package, AlertTriangle, ExternalLink } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";
import { generateNudges } from "@/lib/rulesEngine";
