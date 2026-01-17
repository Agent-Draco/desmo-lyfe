import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/GlassCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVigilSettings } from "@/hooks/useVigilSettings";
import { ArrowLeft, Loader2, Wifi, Check } from "lucide-react";
import desmoLogo from "@/assets/desmo-logo.png";

const VigilSetup = () => {
  const [deviceSerial, setDeviceSerial] = useState("");
  const [newHouseholdId, setNewHouseholdId] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { householdId, saveSettings } = useVigilSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceSerial.trim() || !newHouseholdId.trim()) return;

    setSaving(true);
    const result = await saveSettings(deviceSerial.trim(), newHouseholdId.trim());
    setSaving(false);

    if (result) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto pt-8"
      >
        {/* Back Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </motion.button>

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/30 flex items-center justify-center p-2"
          >
            <img src={desmoLogo} alt="Desmo Logo" className="w-full h-full object-contain" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground">Setup Vigil Device</h1>
          <p className="text-muted-foreground mt-2">
            Connect your Raspberry Pi scanner to your household
          </p>
        </div>

        {/* Current Status */}
        {householdId && (
          <GlassCard className="mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
              <Check className="w-5 h-5 text-success" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Currently Connected</p>
              <p className="text-xs text-muted-foreground font-mono">{householdId}</p>
            </div>
          </GlassCard>
        )}

        {/* Setup Form */}
        <GlassCard className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="deviceSerial">Device Serial Number</Label>
              <div className="relative">
                <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="deviceSerial"
                  type="text"
                  placeholder="VGL-XXXX-XXXX"
                  value={deviceSerial}
                  onChange={(e) => setDeviceSerial(e.target.value.toUpperCase())}
                  className="pl-10 font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Find this on your Vigil device or in the Raspberry Pi setup
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="householdId">Household ID</Label>
              <Input
                id="householdId"
                type="text"
                placeholder="Enter your household UUID"
                value={newHouseholdId}
                onChange={(e) => setNewHouseholdId(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This links the device to your kitchen inventory
              </p>
            </div>

            <motion.button
              type="submit"
              disabled={saving || !deviceSerial.trim() || !newHouseholdId.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Connect Device"
              )}
            </motion.button>
          </form>
        </GlassCard>

        {/* Info Card */}
        <GlassCard className="mt-6 p-4" delay={0.2}>
          <h3 className="font-medium text-foreground mb-2">How it works</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary">1.</span>
              Your Raspberry Pi scans barcodes and inserts items into the database
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">2.</span>
              This app syncs in real-time to show your inventory
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">3.</span>
              All items are filtered by your household ID
            </li>
          </ul>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default VigilSetup;
