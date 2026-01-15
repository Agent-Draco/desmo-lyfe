import { motion } from "framer-motion";
import { Camera, Keyboard, Barcode } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

interface ScanViewProps {
  onScan: () => void;
  onManualEntry: () => void;
}

export const ScanView = ({ onScan, onManualEntry }: ScanViewProps) => {
  return (
    <section className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8"
      >
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Barcode className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Add Items</h2>
        <p className="text-muted-foreground">Scan a barcode or enter manually</p>
      </motion.div>

      <div className="w-full max-w-sm space-y-4">
        <GlassCard 
          onClick={onScan}
          className="flex items-center gap-4"
          delay={0.1}
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Camera className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Scan Barcode</h3>
            <p className="text-sm text-muted-foreground">Use camera to scan product</p>
          </div>
        </GlassCard>

        <GlassCard 
          onClick={onManualEntry}
          className="flex items-center gap-4"
          delay={0.2}
        >
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
            <Keyboard className="w-6 h-6 text-accent-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Manual Entry</h3>
            <p className="text-sm text-muted-foreground">Add item details by hand</p>
          </div>
        </GlassCard>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onScan}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg"
        >
          Mock Scan (Demo)
        </motion.button>
      </div>
    </section>
  );
};
