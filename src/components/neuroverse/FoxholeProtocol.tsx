import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import foxholeData from "@/data/foxholeProtocol.json";

interface Phase {
  id: string;
  title: string;
  lines: string[];
  acceptance?: boolean;
}

interface FoxholeProtocolProps {
  callsign: string;
  onComplete: () => void;
}

export function FoxholeProtocol({ callsign, onComplete }: FoxholeProtocolProps) {
  const [phaseIndex, setPhaseIndex] = useState<number>(0);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);

  const phases: Phase[] = foxholeData.phases;

  // Replace placeholder tokens
  const injectTokens = (text: string) => {
    return text.replace(/<CALLSIGN>/g, callsign);
  };

  // Initialize first line
  useEffect(() => {
    if (phases[0]?.lines[0]) {
      setDisplayedLines([injectTokens(phases[0].lines[0])]);
    }
  }, [callsign]);

  // Handle line progression
  const advanceLine = () => {
    const phase = phases[phaseIndex];
    if (currentLineIndex < phase.lines.length - 1) {
      const nextLine = injectTokens(phase.lines[currentLineIndex + 1]);
      setDisplayedLines(prev => [...prev, nextLine]);
      setCurrentLineIndex(prev => prev + 1);
    }
  };

  // Move to next phase
  const nextPhase = () => {
    if (phaseIndex < phases.length - 1) {
      const nextPhaseIndex = phaseIndex + 1;
      setPhaseIndex(nextPhaseIndex);
      setDisplayedLines([injectTokens(phases[nextPhaseIndex].lines[0])]);
      setCurrentLineIndex(0);
    }
  };

  // Accept and deploy
  const acceptProtocol = () => {
    onComplete();
  };

  const currentPhase = phases[phaseIndex];
  const hasMoreLines = currentLineIndex < currentPhase.lines.length - 1;

  return (
    <div className="w-full min-h-screen bg-background flex flex-col pb-safe">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 md:p-6">
        <div className="mb-4 sm:mb-5 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-neuro-cyan mb-2 tracking-wide font-mono">
            FOXHOLE PROTOCOL
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            Phase {phaseIndex + 1} of {phases.length}: {currentPhase.title}
          </p>
        </div>

        <Card className="bg-card/50 border-border/50 backdrop-blur-sm max-h-[55vh] sm:max-h-[60vh] overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg text-neuro-cyan font-mono">
              {currentPhase.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 overflow-y-auto flex-1">
            {displayedLines.map((line, i) => (
              <p key={i} className="text-base md:text-lg leading-relaxed text-foreground">
                {line}
              </p>
            ))}
          </CardContent>
        </Card>

        <div className="mt-4 sm:mt-5 md:mt-6 pb-4 flex gap-3 sm:gap-4">
          {!currentPhase.acceptance && (
            <>
              {hasMoreLines ? (
                <Button
                  onClick={advanceLine}
                  variant="default"
                  size="lg"
                  className="flex-1"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={nextPhase}
                  variant="default"
                  size="lg"
                  className="flex-1"
                >
                  Next Phase
                </Button>
              )}
            </>
          )}

          {currentPhase.acceptance && (
            <Button
              onClick={acceptProtocol}
              variant="critical"
              size="lg"
              className="flex-1"
            >
              I Accept
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
