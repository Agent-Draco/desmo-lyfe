import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode, forwardRef } from "react";
import { LiquidGlass } from "./LiquidGlass";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  isExpiring?: boolean;
  onClick?: () => void;
  delay?: number;
  useLiquidGlass?: boolean;
  liquidGlassProps?: {
    surfaceType?: 'convex-circle' | 'convex-squircle' | 'concave' | 'lip';
    bezelWidth?: number;
    glassThickness?: number;
    refractiveIndex?: number;
    scale?: number;
    specularIntensity?: number;
  };
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(({
  children,
  className,
  isExpiring = false,
  onClick,
  delay = 0,
  useLiquidGlass = false,
  liquidGlassProps = {}
}, ref) => {
  const cardContent = (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "glass-card p-5 cursor-pointer transition-all duration-300",
        isExpiring && "glow-warning border-warning/50",
        className
      )}
    >
      {children}
    </motion.div>
  );

  if (useLiquidGlass) {
    return (
      <LiquidGlass
        intensity={liquidGlassProps.intensity || 'medium'}
        shape={liquidGlassProps.shape || 'rounded'}
        className={cn(
          "p-5 cursor-pointer transition-all duration-300",
          isExpiring && "glow-warning border-warning/50",
          className
        )}
      >
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay, ease: "easeOut" }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClick}
        >
          {children}
        </motion.div>
      </LiquidGlass>
    );
  }

  return cardContent;
});

GlassCard.displayName = "GlassCard";
