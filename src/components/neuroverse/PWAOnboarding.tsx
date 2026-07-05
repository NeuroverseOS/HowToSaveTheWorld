import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface OnboardingScreenProps {
  title: string;
  lines: string[];
  isActive: boolean;
}

const OnboardingScreen = ({ title, lines, isActive }: OnboardingScreenProps) => (
  <div
    className={`absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-8 transition-all duration-700 ${
      isActive ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
    }`}
  >
    <div className="max-w-2xl w-full space-y-8 sm:space-y-12 text-center">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-neuro-cyan via-neuro-purple to-neuro-magenta bg-clip-text text-transparent animate-fade-in">
        {title}
      </h2>
      <div className="space-y-4 sm:space-y-6">
        {lines.map((line, idx) => (
          <p
            key={idx}
            className="text-base sm:text-lg md:text-xl text-foreground/90 leading-relaxed animate-fade-in"
            style={{ animationDelay: `${idx * 0.15}s` }}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  </div>
);

interface PWAOnboardingProps {
  onComplete: () => void;
}

export default function PWAOnboarding({ onComplete }: PWAOnboardingProps) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const screens = [
    {
      title: "Awakening",
      lines: [
        "Something new is rising.",
        "A living layer of intelligence forming between the world you walk in",
        "and the one you've only imagined.",
        "AI, AR, and robotics merging into a shared reality.",
        "This is the NeuroVerse.",
      ],
    },
    {
      title: "Recognition",
      lines: [
        "The future isn't waiting to be invented.",
        "It's waiting to be led.",
        "If you feel the pull—",
        "if you sense patterns before they appear—",
        "if you know the world is shifting beneath the surface—",
        "you are already part of the Vanguard.",
      ],
    },
    {
      title: "Crossing the Threshold",
      lines: [
        "The NeuroVerse needs leaders who can guide humanity through complexity and possibility.",
        "Not with titles.",
        "With clarity, courage, and vision.",
        "Your journey begins now.",
      ],
    },
  ];

  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    }
    if (isRightSwipe && currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-neuro-surface/20 to-background">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neuro-cyan/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neuro-purple/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
      </div>

      {/* Screens container */}
      <div
        className="relative h-screen"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {screens.map((screen, idx) => (
          <OnboardingScreen
            key={idx}
            title={screen.title}
            lines={screen.lines}
            isActive={currentScreen === idx}
          />
        ))}
      </div>

      {/* Navigation dots */}
      <div className="absolute bottom-32 left-0 right-0 flex justify-center gap-2 z-10">
        {screens.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentScreen(idx)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentScreen === idx
                ? "bg-neuro-cyan w-8"
                : "bg-muted-foreground/30"
            }`}
            aria-label={`Go to screen ${idx + 1}`}
          />
        ))}
      </div>

      {/* Bottom action area */}
      <div className="absolute bottom-8 left-0 right-0 px-6 sm:px-8 z-10">
        <div className="max-w-md mx-auto space-y-4">
          {currentScreen === screens.length - 1 ? (
            <Button
              onClick={onComplete}
              className="w-full bg-gradient-to-r from-neuro-cyan to-neuro-purple hover:from-neuro-cyan/90 hover:to-neuro-purple/90 text-background font-semibold text-lg py-6 animate-fade-in"
            >
              Enter the NeuroVerse
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              variant="ghost"
              className="w-full text-neuro-cyan hover:text-neuro-cyan/80 hover:bg-neuro-surface/20"
            >
              Continue
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          )}
          
          <button
            onClick={onComplete}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}