import { motion } from "framer-motion";
import { User, Bell, Moon, Shield, LogOut, ChevronRight, Settings } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  household_id: string | null;
}

interface Household {
  id: string;
  name: string;
  invite_code: string;
}

interface SettingsViewProps {
  profile: Profile | null;
  household: Household | null;
  onSignOut: () => Promise<void>;
}

const settingsItems = [
  { id: "profile", icon: User, label: "Profile", description: "Manage your account" },
  { id: "notifications", icon: Bell, label: "Notifications", description: "Configure alerts" },
  { id: "appearance", icon: Moon, label: "Appearance", description: "Theme & display" },
  { id: "privacy", icon: Shield, label: "Privacy", description: "Data & security" },
];

export const SettingsView = ({ profile, household, onSignOut }: SettingsViewProps) => {
  const navigate = useNavigate();
  const displayInitial = profile?.display_name?.charAt(0).toUpperCase() || "U";

  return (
    <section>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-xl font-semibold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Customize your experience</p>
      </motion.div>

      {/* Profile Card */}
      <GlassCard className="mb-6 flex items-center gap-4" delay={0.1}>
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/30 flex items-center justify-center">
          <span className="text-2xl font-semibold text-primary">{displayInitial}</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{profile?.display_name || "User"}</h3>
          <p className="text-sm text-muted-foreground">{household?.name || "No household"}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </GlassCard>

      {/* Vigil Setup Card */}
      <GlassCard 
        className="mb-6 flex items-center gap-4 cursor-pointer" 
        delay={0.15}
        onClick={() => navigate('/vigil-setup')}
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-foreground">Vigil Device Setup</h4>
          <p className="text-sm text-muted-foreground">Connect your Raspberry Pi scanner</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </GlassCard>

      {/* Settings Items */}
      <div className="space-y-3">
        {settingsItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <GlassCard key={item.id} delay={0.2 + i * 0.1} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{item.label}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </GlassCard>
          );
        })}
      </div>

      {/* Sign Out Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onSignOut}
        className="w-full mt-8 py-4 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center gap-2 font-semibold"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </motion.button>
    </section>
  );
};
