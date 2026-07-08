import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronRight } from "lucide-react";

interface OrientationProps {
  callsign: string;
  onComplete: () => void;
}

// Removed archetype imports - orientation happens before assessment

const getScreens = (callsign: string) => {
  return [
    {
      title: "Vanguard Activation Complete",
      content: [
        `Designation confirmed: ${callsign}.`,
        "You are no longer operating alone.",
        "Echelon is now your intelligence partner.",
        "Together, you are a Unit.",
        "The foxhole protocol is now active.",
      ],
    },
    {
      title: "Welcome to NeuroVerse OS",
      content: [
        `${callsign}, this is not a course.`,
        "This is an operating system.",
        "You do not consume lessons. You integrate intelligence.",
        "Each session updates your internal Field Guide.",
      ],
    },
    {
      title: "System Initialization Complete",
      content: [
        `${callsign}, all systems online.`,
        "Echelon is ready.",
        "Your archetype signature guides the path forward.",
        "Proceed to your first mission.",
      ],
    },
  ];
};

export function Orientation({ callsign, onComplete }: OrientationProps) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const screens = getScreens(callsign);

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      onComplete();
    }
  };

  const progress = ((currentScreen + 1) / screens.length) * 100;
  const screen = screens[currentScreen];

  return (
    <div className="min-h-screen bg-background overflow-y-auto overflow-x-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 pb-12 sm:pb-16">
        <div className="space-y-4 sm:space-y-8 w-full">
          {/* Progress */}
          <div className="space-y-2">
            <p className="text-xs sm:text-sm text-muted-foreground">
              {currentScreen + 1} of {screens.length}
            </p>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Content */}
          <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-neuro-cyan to-neuro-purple bg-clip-text text-transparent break-words">
              {screen.title}
            </h1>

            <div className="space-y-3 sm:space-y-4 text-sm sm:text-base md:text-lg text-foreground/90">
              {screen.content?.map((line, idx) => (
                <p key={idx} className="leading-relaxed">
                  {line}
                </p>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-end">
            <Button
              onClick={handleNext}
              className="bg-neuro-cyan hover:bg-neuro-cyan/90 text-background text-sm sm:text-base"
            >
              {currentScreen < screens.length - 1 ? "Continue →" : "Begin First Mission"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
