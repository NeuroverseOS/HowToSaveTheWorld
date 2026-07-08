import { useOnboardingStep } from "@/hooks/useOnboardingStep";
import { ChevronRight } from "lucide-react";

export function OnboardingProgress() {
  const stepInfo = useOnboardingStep();

  if (!stepInfo) return null;

  const { step, totalSteps, label } = stepInfo;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="w-full border-b border-border/30 bg-background/95 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground font-mono">
              STEP {step}/{totalSteps}
            </span>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-foreground font-medium">{label}</span>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-muted/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-neuro-cyan via-primary to-neuro-purple transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
