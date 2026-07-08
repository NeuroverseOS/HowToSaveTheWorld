import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, HelpCircle } from "lucide-react";
import type { AnomalyEvent, AnomalyChoice } from "@/lib/campaign-engine";

interface AnomalyEventCardProps {
  event: AnomalyEvent;
  onResolve: (choice: AnomalyChoice) => void;
}

/**
 * THE SLIDE — anomaly event interstitial. An antagonist makes a genuinely
 * tempting offer mid-mission; the operator chooses, and the world remembers.
 * "Ask Echelon" is always free: knowing what you don't know is command judgment.
 */
export function AnomalyEventCard({ event, onResolve }: AnomalyEventCardProps) {
  const [showTeach, setShowTeach] = useState(false);

  return (
    <Card className="border-neuro-orange/60 bg-neuro-orange/5 p-4 sm:p-5 space-y-4 animate-fade-in shadow-lg shadow-neuro-orange/10">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-neuro-orange animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-neuro-orange">
            Anomaly Detected
          </span>
        </div>
        <Badge variant="outline" className="border-neuro-orange/50 text-neuro-orange text-xs font-mono">
          {event.antagonist}
        </Badge>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">{event.title}</h3>
        <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{event.narrative}</p>
      </div>

      {showTeach && (
        <div className="border-l-2 border-neuro-cyan/60 pl-3 py-1 animate-fade-in">
          <p className="text-sm text-neuro-cyan/90 whitespace-pre-wrap leading-relaxed">{event.teach}</p>
        </div>
      )}

      <div className="space-y-2">
        {!showTeach && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTeach(true)}
            className="w-full justify-start text-neuro-cyan hover:text-neuro-cyan hover:bg-neuro-cyan/10"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Ask Echelon first (always free)
          </Button>
        )}
        {event.choices.map((choice) => (
          <Button
            key={choice.id}
            variant="outline"
            onClick={() => onResolve(choice)}
            className="w-full h-auto py-2.5 px-3 flex flex-col items-start gap-0.5 text-left border-neuro-border hover:border-neuro-orange/60 hover:bg-neuro-orange/10"
          >
            <span className="text-sm font-medium text-foreground">{choice.label}</span>
            <span className="text-xs text-muted-foreground font-normal">{choice.detail}</span>
          </Button>
        ))}
      </div>

      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        Concept: {event.concept} · Your choice is recorded in the world
      </p>
    </Card>
  );
}
