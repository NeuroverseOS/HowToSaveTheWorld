import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadState, saveState, ensureLocalIdentity } from "@/lib/state-engine";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { OnboardingProgress } from "@/components/neuroverse/OnboardingProgress";

const SCREEN_DURATION = 3000; // 3 seconds per screen
const FINAL_SCREEN_DURATION = 12000; // 12 seconds for identity reveal (or manual continue)

export function VanguardActivation() {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState(0);
  const [showContinue, setShowContinue] = useState(false);
  const [autoNavTimer, setAutoNavTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load state (Dashboard ensures it exists before routing here)
    const state = ensureLocalIdentity();
    if (!state) {
      console.error("VanguardActivation: Failed to ensure state");
      return;
    }

    // Guard: If already completed, skip straight to language selection
    if (state.user.vanguard.activation_complete) {
      navigate("/language-selection");
      return;
    }

    // Screen progression
    const timers: NodeJS.Timeout[] = [];

    // Screen 1: Recognition (3s)
    timers.push(setTimeout(() => setCurrentScreen(1), SCREEN_DURATION));

    // Screen 2: Awakening (6s cumulative)
    timers.push(setTimeout(() => setCurrentScreen(2), SCREEN_DURATION * 2));

    // Screen 3: Bonding / Protocol Ready (9s cumulative)
    timers.push(setTimeout(() => setCurrentScreen(3), SCREEN_DURATION * 3));

    // After final screen has held for FINAL_SCREEN_DURATION, mark activation
    // complete and move to language selection
    const autoNav = setTimeout(() => {
      const latestState = loadState();
      if (latestState) {
        latestState.user.vanguard.activation_complete = true;
        saveState(latestState);
      }
      navigate("/language-selection");
    }, SCREEN_DURATION * 3 + FINAL_SCREEN_DURATION);

    setAutoNavTimer(autoNav);
    timers.push(autoNav);

    return () => timers.forEach(clearTimeout);
  }, [navigate]);

  const handleContinue = () => {
    if (autoNavTimer) clearTimeout(autoNavTimer);
    const latestState = ensureLocalIdentity();
    if (latestState) {
      latestState.user.vanguard.activation_complete = true;
      saveState(latestState);
    }
    navigate("/language-selection");
  };

  const screens: Array<{
    content: string;
    className?: string;
    glow?: boolean;
    circuits?: boolean;
    subtitle?: string;
    subtitle2?: string;
    massive?: boolean;
    finalReveal?: boolean;
  }> = [
    {
      // Screen 0: Recognition
      content: "Operator detected.",
      className: "animate-fade-in",
    },
    {
      // Screen 1: Awakening
      content: "Initializing...",
      className: "animate-pulse",
      glow: true,
    },
    {
      // Screen 2: Bonding
      content: "Systems preparing...",
      className: "animate-pulse",
      circuits: true,
    },
    {
      // Screen 3: Identity Preparation
      content: "VANGUARD PROTOCOL READY",
      subtitle2: "Your operational identity has been initialized.",
      massive: true,
      finalReveal: true,
    },
  ];

  const screen = screens[currentScreen];
  if (!screen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden">
      <OnboardingProgress />
      <div className="flex-1 flex items-center justify-center">
      {/* Grid Overlay */}
      <div 
        className={`absolute inset-0 opacity-20 transition-opacity duration-1000 ${
          currentScreen >= 1 ? 'opacity-40' : ''
        }`}
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Circuits Effect (Screen 2) */}
      {screen.circuits && (
        <div className="absolute inset-0">
          <svg className="w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <line x1="10%" y1="50%" x2="90%" y2="50%" stroke="rgb(6, 182, 212)" strokeWidth="2" className="animate-pulse">
              <animate attributeName="stroke-opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
            </line>
            <line x1="50%" y1="10%" x2="50%" y2="90%" stroke="rgb(6, 182, 212)" strokeWidth="2" className="animate-pulse">
              <animate attributeName="stroke-opacity" values="0;1;0" dur="2s" begin="0.5s" repeatCount="indefinite" />
            </line>
            <circle cx="50%" cy="50%" r="100" fill="none" stroke="rgb(6, 182, 212)" strokeWidth="2" className="animate-pulse">
              <animate attributeName="r" values="50;150;50" dur="3s" repeatCount="indefinite" />
              <animate attributeName="stroke-opacity" values="0;0.8;0" dur="3s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl">
        {screen.massive ? (
          <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-scale-in">
            {/* Vanguard Identity */}
            <div 
              className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-bold text-white tracking-wider"
              style={{
                textShadow: `
                  0 0 40px rgba(6, 182, 212, 0.9),
                  0 0 80px rgba(6, 182, 212, 0.6),
                  0 0 120px rgba(6, 182, 212, 0.4)
                `,
                letterSpacing: '0.1em',
              }}
            >
              {screen.content}
            </div>
            <div className="space-y-4 animate-fade-in animation-delay-1000">
              {screen.subtitle && (
                <div className="text-base sm:text-lg md:text-xl text-neuro-cyan/90 tracking-wide">
                  {screen.subtitle}
                </div>
              )}
              {screen.subtitle2 && (
                <div className="text-sm sm:text-base md:text-lg text-neuro-cyan/70 tracking-wide">
                  {screen.subtitle2}
                </div>
              )}
            </div>
            
            {/* Continue Button */}
            <div className="mt-6 sm:mt-8 md:mt-12 animate-fade-in">
              <Button
                onClick={handleContinue}
                variant="default"
                size="lg"
                className="text-lg px-8 py-6 bg-neuro-cyan hover:bg-neuro-cyan/90 text-background"
              >
                Continue <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className={`text-xl sm:text-2xl md:text-3xl text-neuro-cyan font-mono tracking-wider ${screen.className}`}
            style={{
              textShadow: screen.glow ? '0 0 20px rgba(6, 182, 212, 0.6)' : 'none',
            }}
          >
            {screen.content}
          </div>
        )}
      </div>

      {/* Holographic Pulse Effect (Screen 1) */}
      {screen.glow && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      )}
      </div>
    </div>
  );
}
