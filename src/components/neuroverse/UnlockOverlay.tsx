// NeuroVerse Unlock Overlay Component
// Renders celebration animations for trait/subskill/shadow/superpower unlocks
// Uses React Portal for full-screen rendering above all content

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Zap, Shield, Star, Award, CheckCircle } from 'lucide-react';
import { UnlockAnimationType } from '@/hooks/useUnlockAnimation';

interface UnlockOverlayProps {
  type: UnlockAnimationType;
  data: {
    name: string;
    icon?: string;
    description?: string;
  };
  onComplete: () => void;
}

// Animation duration map (must match CSS)
const ANIMATION_DURATIONS: Record<UnlockAnimationType, number> = {
  trait: 800,
  subskill: 500,
  shadow: 900,
  superpower: 1200,
  mission: 1000,
  section: 1000,
  work_mode_design: 3000,
  work_mode_build: 3000,
  work_mode_lead: 3000,
};

// Icon map for unlock types
const ICON_MAP: Record<UnlockAnimationType, React.ElementType> = {
  trait: Sparkles,
  subskill: Zap,
  shadow: Shield,
  superpower: Star,
  mission: Award,
  section: CheckCircle,
  work_mode_design: Sparkles,
  work_mode_build: Zap,
  work_mode_lead: Star,
};

export const UnlockOverlay = ({ type, data, onComplete }: UnlockOverlayProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after animation duration
    const isMobile = window.innerWidth <= 768;
    const duration = ANIMATION_DURATIONS[type];
    const adjustedDuration = isMobile ? duration * 0.5 : duration;

    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, adjustedDuration + 100); // Add 100ms buffer

    return () => clearTimeout(timer);
  }, [type, onComplete]);

  if (!isVisible) return null;

  // Section completion is full-screen gradient sweep (no content)
  if (type === 'section') {
    return createPortal(
      <div className="cosmic-sweep-overlay" />,
      document.body
    );
  }

  // Work Mode unlock cinematics
  if (type === 'work_mode_design' || type === 'work_mode_build' || type === 'work_mode_lead') {
    const modeTitle = type === 'work_mode_design' ? 'DESIGN MODE' : 
                      type === 'work_mode_build' ? 'BUILD MODE' : 'LEAD MODE';
    const modeColor = type === 'work_mode_design' ? 'text-purple-400' : 
                      type === 'work_mode_build' ? 'text-neuro-cyan' : 'text-neuro-orange';
    const Icon = ICON_MAP[type];
    
    return createPortal(
      <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/95 backdrop-blur-sm">
        <div className="text-center space-y-6 animate-fade-in px-4">
          {/* Icon with pulse */}
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div className={`absolute inset-0 ${modeColor} opacity-20 rounded-full animate-pulse`} />
            <Icon className={`w-16 h-16 ${modeColor} relative z-10`} />
          </div>
          
          {/* Title */}
          <div className="space-y-2">
            <h2 className={`text-4xl md:text-5xl font-bold ${modeColor} tracking-wider animate-scale-in`}>
              {modeTitle}
            </h2>
            <p className="text-sm text-neuro-cyan/60 uppercase tracking-widest">
              UNLOCKED
            </p>
          </div>
          
          {/* Message */}
          <div className="max-w-md mx-auto space-y-4 text-foreground/80">
            <p className="text-lg font-medium">
              Operator {data.name || '[CALLSIGN]'}
            </p>
            <p className="text-sm leading-relaxed">
              {data.description}
            </p>
          </div>
          
          {/* Grid effect */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0A3D5C15_1px,transparent_1px),linear-gradient(to_bottom,#0A3D5C15_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        </div>
      </div>,
      document.body
    );
  }

  // Mission completion is center-screen hologram stamp
  if (type === 'mission') {
    const Icon = ICON_MAP[type];
    return createPortal(
      <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
        <div className="mission-complete-stamp">
          <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-lg bg-background/90 backdrop-blur-sm border border-primary/30">
            <Icon className="w-16 h-16 text-primary" />
            <div className="text-center">
              <h3 className="text-2xl font-bold text-foreground">MISSION COMPLETE</h3>
              <p className="text-sm text-muted-foreground mt-2">{data.name}</p>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Trait, Subskill, Shadow, Superpower overlays
  const Icon = ICON_MAP[type];
  const isSuperpowerOrShadow = type === 'superpower' || type === 'shadow';
  
  // Animation class names (defined in unlock-animations.css)
  const animationClass = 
    type === 'trait' ? 'trait-unlocked' :
    type === 'subskill' ? 'subskill-unlocked' :
    type === 'shadow' ? 'shadow-revealed' :
    type === 'superpower' ? 'superpower-unlocked' : '';

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none p-4">
      <div 
        className={`${animationClass} max-w-md w-full`}
      >
        <div className={`
          flex flex-col items-center justify-center gap-4 p-8 rounded-lg 
          bg-card/95 backdrop-blur-sm border-2 
          ${type === 'shadow' ? 'border-blue-600/50' : 'border-primary/50'}
          shadow-lg
        `}>
          {/* Icon */}
          <div className={`
            p-4 rounded-full 
            ${type === 'shadow' ? 'bg-blue-600/10' : 'bg-primary/10'}
          `}>
            <Icon className={`
              w-12 h-12 
              ${type === 'shadow' ? 'text-blue-600' : 'text-primary'}
            `} />
          </div>

          {/* Content */}
          <div className="text-center space-y-2">
            <h3 className={`
              trait-name text-2xl font-bold
              ${type === 'shadow' ? 'text-blue-600' : 'text-foreground'}
            `}>
              {type === 'trait' && '🔓 TRAIT UNLOCKED'}
              {type === 'subskill' && '📈 SUBSKILL UNLOCKED'}
              {type === 'shadow' && '🌑 SHADOW REVEALED'}
              {type === 'superpower' && '⚡ SUPERPOWER UNLOCKED'}
            </h3>
            
            <p className={`
              text-lg font-semibold
              ${type === 'shadow' ? 'text-blue-500' : 'text-primary'}
            `}>
              {data.name}
            </p>

            {data.description && (
              <p className="text-sm text-muted-foreground max-w-sm">
                {data.description}
              </p>
            )}
          </div>

          {/* Additional visual indicator for superpower */}
          {type === 'superpower' && (
            <div className="flex gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i}
                  className="w-4 h-4 text-yellow-500 fill-yellow-500"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
