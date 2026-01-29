import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, ChefHat, Settings, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { NudgeFeed } from "@/components/NudgeFeed";
import { generateNudges } from "@/lib/rulesEngine";
import { useInventory } from "@/hooks/useInventory";
import { useAuth } from "@/hooks/useAuth";

interface SpoonSureProfile {
  enabled: boolean;
  dietType: 'veg' | 'non-veg' | 'vegan' | 'jain';
  allergies: string[];
  customPreferences: string;
}

export const NudgesView = () => {
  const [profile, setProfile] = useState<SpoonSureProfile>({
    enabled: false,
    dietType: 'veg',
    allergies: [],
    customPreferences: ''
  });
  const [nudges, setNudges] = useState([]);
  const [activeTab, setActiveTab] = useState<'active' | 'profile'>('active');

  const { household } = useAuth();
  const { items: inventory } = useInventory(household?.id || null);

  useEffect(() => {
    if (inventory.length > 0) {
      const generatedNudges = generateNudges(inventory);
      setNudges(generatedNudges);
    }
  }, [inventory]);

  const handleProfileUpdate = (updates: Partial<SpoonSureProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
    // TODO: Save to database
  };

  const handleAllergyToggle = (allergy: string) => {
    setProfile(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy]
    }));
  };

  return (
    <section className="flex flex-col items-center justify-start min-h-[60vh] space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Bell className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Smart Nudges</h2>
        <p className="text-muted-foreground">Get intelligent suggestions for your kitchen</p>
      </div>

      {/* Tab Navigation */}
      <div className="w-full max-w-sm mx-auto">
        <div className="flex rounded-xl bg-muted p-1 mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'active'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Active Nudges
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            SpoonSure Profile
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'active' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          {nudges.length > 0 ? (
            <NudgeFeed inventory={inventory} profile={profile} />
          ) : (
            <GlassCard className="p-8 text-center">
              <ChefHat className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Active Nudges</h3>
              <p className="text-muted-foreground">
                Add some items to your inventory to get personalized recipe suggestions and expiry alerts.
              </p>
            </GlassCard>
          )}
        </motion.div>
      )}

      {activeTab === 'profile' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              SpoonSure Profile Settings
            </h3>

            {/* Enable/Disable */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <Label htmlFor="spoonsure-enabled" className="text-sm font-medium">
                  Enable Spoonacular Active Recipes
                </Label>
                <p className="text-xs text-muted-foreground">
                  Get recipe suggestions based on your preferences
                </p>
              </div>
              <Switch
                id="spoonsure-enabled"
                checked={profile.enabled}
                onCheckedChange={(enabled) => handleProfileUpdate({ enabled })}
              />
            </div>

            {profile.enabled && (
              <>
                {/* Diet Type */}
                <div className="space-y-2 mb-6">
                  <Label className="text-sm font-medium">Dietary Preference</Label>
                  <Select
                    value={profile.dietType}
                    onValueChange={(dietType: SpoonSureProfile['dietType']) =>
                      handleProfileUpdate({ dietType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="veg">Vegetarian</SelectItem>
                      <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="jain">Jain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Allergies */}
                <div className="space-y-3 mb-6">
                  <Label className="text-sm font-medium">Allergies & Restrictions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Nuts', 'Dairy', 'Gluten', 'Eggs', 'Soy', 'Shellfish'].map((allergy) => (
                      <button
                        key={allergy}
                        onClick={() => handleAllergyToggle(allergy)}
                        className={`p-2 rounded-lg border text-sm transition-colors ${
                          profile.allergies.includes(allergy)
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                        }`}
                      >
                        {allergy}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Preferences */}
                <div className="space-y-2">
                  <Label htmlFor="custom-preferences" className="text-sm font-medium">
                    Custom Preferences (Optional)
                  </Label>
                  <Textarea
                    id="custom-preferences"
                    placeholder="e.g., No spicy food, prefer low-carb recipes..."
                    value={profile.customPreferences}
                    onChange={(e) => handleProfileUpdate({ customPreferences: e.target.value })}
                    className="min-h-[80px]"
                  />
                </div>
              </>
            )}
          </GlassCard>

          {!profile.enabled && (
            <GlassCard className="p-4 border-warning/20 bg-warning/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-warning mb-1">SpoonSure Disabled</h4>
                  <p className="text-xs text-muted-foreground">
                    Enable Spoonacular Active Recipes to get personalized recipe suggestions in your food alerts.
                  </p>
                </div>
              </div>
            </GlassCard>
          )}
        </motion.div>
      )}
    </section>
  );
};
