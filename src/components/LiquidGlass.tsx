import React from 'react';
import { cn } from '@/lib/utils';

interface LiquidGlassProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'subtle' | 'medium' | 'strong';
  shape?: 'rounded' | 'circular' | 'pill';
}

export const LiquidGlass: React.FC<LiquidGlassProps> = ({
  children,
  className,
  intensity = 'medium',
  shape = 'rounded',
}) => {
  const getIntensityClasses = () => {
    switch (intensity) {
      case 'subtle':
        return 'backdrop-blur-sm bg-white/10 border-white/20';
      case 'strong':
        return 'backdrop-blur-xl bg-white/20 border-white/40 shadow-2xl';
      default: // medium
        return 'backdrop-blur-md bg-white/15 border-white/30 shadow-lg';
    }
  };

  const getShapeClasses = () => {
    switch (shape) {
      case 'circular':
        return 'rounded-full';
      case 'pill':
        return 'rounded-full px-6';
      default: // rounded
        return 'rounded-2xl';
    }
  };

  return (
    <div
      className={cn(
        "relative border transition-all duration-300",
        "before:absolute before:inset-0 before:rounded-inherit before:bg-gradient-to-br before:from-white/20 before:to-transparent before:pointer-events-none",
        "after:absolute after:inset-0 after:rounded-inherit after:bg-gradient-to-tl after:from-white/10 after:to-transparent after:pointer-events-none",
        getIntensityClasses(),
        getShapeClasses(),
        className
      )}
      style={{
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      }}
    >
      {/* Inner content with subtle animation */}
      <div className="relative z-10 transition-transform duration-200 hover:scale-[1.02]">
        {children}
      </div>

      {/* Subtle inner glow */}
      <div className="absolute inset-0 rounded-inherit bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />
    </div>
  );
};
