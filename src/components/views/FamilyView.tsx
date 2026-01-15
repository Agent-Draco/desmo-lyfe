import { motion } from "framer-motion";
import { Users, Copy, UserPlus, Crown } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

const mockFamily = [
  { id: "1", name: "Sarah", avatar: "S", isOwner: true },
  { id: "2", name: "Mike", avatar: "M", isOwner: false },
  { id: "3", name: "Emma", avatar: "E", isOwner: false },
  { id: "4", name: "Jack", avatar: "J", isOwner: false },
];

const inviteCode = "SMITH-2024";

export const FamilyView = () => {
  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
  };

  return (
    <section>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-xl font-semibold text-foreground">Family</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your household members</p>
      </motion.div>

      {/* Invite Code Card */}
      <GlassCard className="mb-6" delay={0.1}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Invite Code</p>
            <p className="text-lg font-mono font-bold text-foreground">{inviteCode}</p>
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
        Members ({mockFamily.length})
      </motion.h3>

      <div className="space-y-3">
        {mockFamily.map((member, i) => (
          <GlassCard key={member.id} delay={0.3 + i * 0.1} className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/30 flex items-center justify-center">
              <span className="text-lg font-semibold text-primary">{member.avatar}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground">{member.name}</h4>
                {member.isOwner && (
                  <Crown className="w-4 h-4 text-warning" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {member.isOwner ? "Owner" : "Member"}
              </p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Add Member Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mt-6 py-4 rounded-2xl glass-button flex items-center justify-center gap-2 font-semibold"
      >
        <UserPlus className="w-5 h-5" />
        Invite Member
      </motion.button>
    </section>
  );
};
