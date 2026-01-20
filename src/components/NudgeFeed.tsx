import { useState, useEffect } from "react";
import { vigilSupabase, NudgeHistoryItem } from "@/integrations/vigil/client";
import { GlassCard } from "./GlassCard";
import { motion } from "framer-motion";
import { Bell, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface NudgeFeedProps {
  householdId: string;
}

export const NudgeFeed = ({ householdId }: NudgeFeedProps) => {
  const [nudges, setNudges] = useState<NudgeHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNudges = async () => {
      try {
        const { data, error } = await vigilSupabase
          .from("nudge_history")
          .select("*")
          .eq("household_id", householdId)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;
        setNudges(data || []);
      } catch (error) {
        console.error("Error fetching nudges:", error);
      } finally {
        setLoading(false);
      }
    };

    if (householdId) {
      fetchNudges();
    }
  }, [householdId]);

  const getNudgeIcon = (type: string) => {
    switch (type) {
      case "expiry":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "low_stock":
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  if (loading) {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded flex-1" />
        </div>
      </GlassCard>
    );
  }

  if (nudges.length === 0) {
    return (
      <GlassCard className="p-4 text-center text-muted-foreground">
        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No active nudges</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-2">
      {nudges.map((nudge, index) => (
        <motion.div
          key={nudge.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <GlassCard className="p-3">
            <div className="flex items-start gap-3">
              {getNudgeIcon(nudge.nudge_type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {nudge.item_name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {nudge.message}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
};
