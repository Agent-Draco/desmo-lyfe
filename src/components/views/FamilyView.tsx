import { motion } from "framer-motion";
import { Users, Copy, Crown, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { useToast } from "@/hooks/use-toast";
import { useHouseholdMembers, HouseholdMember } from "@/hooks/useHouseholdMembers";
import { Household } from "@/hooks/useAuth";

interface FamilyViewProps {
  household: Household | null;
  currentUserId: string | null;
}

export const FamilyView = ({ household, currentUserId }: FamilyViewProps) => {
  const { members, loading } = useHouseholdMembers(household?.id || null);
  const { toast } = useToast();

  const handleCopyCode = () => {
    if (household?.invite_code) {
      navigator.clipboard.writeText(household.invite_code);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard",
      });
    }
  };

  if (!household) {
    return (
      <section className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No Household</h2>
          <p className="text-muted-foreground">Create or join a household first</p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </section>
    );
  }

  return (
    <section>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-xl font-semibold text-foreground">{household.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your household members</p>
      </motion.div>

      {/* Invite Code Card */}
      <GlassCard className="mb-6" delay={0.1}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Invite Code</p>
            <p className="text-lg font-mono font-bold text-foreground">
              {household.invite_code}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopyCode}
            className="p-3 rounded-xl bg-primary/10 text-primary"
          >
            <Copy className="w-5 h-5" />
          </motion.button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Share this code with family members to join your household
        </p>
      </GlassCard>

      {/* Family Members */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider"
      >
        Members ({members.length})
      </motion.h3>

      <div className="space-y-3">
        {members.map((member, i) => (
          <GlassCard key={member.id} delay={0.3 + i * 0.1} className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/30 flex items-center justify-center">
              <span className="text-lg font-semibold text-primary">
                {(member.display_name || "U")[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground">
                  {member.display_name || "Unknown"}
                </h4>
                {member.id === currentUserId && (
                  <span className="text-xs text-muted-foreground">(you)</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Member</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
};
