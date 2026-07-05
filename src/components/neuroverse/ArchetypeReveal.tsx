import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ArchetypeRevealProps {
  callsign: string;
  primary: string;
  shadow: string;
  rising: string;
  onComplete: () => void;
}

const ARCHETYPE_DATA: Record<string, { subtitle: string; gift: string; challenge: string }> = {
  WATCHTOWER: {
    subtitle: "The Observer",
    gift: "You see patterns others miss. Strategic clarity under pressure.",
    challenge: "Analysis paralysis. The watcher who never acts.",
  },
  WEAVER: {
    subtitle: "The Connector",
    gift: "You build bridges. Integration of complex systems.",
    challenge: "Scattered focus. Connected to everything, anchored to nothing.",
  },
  VEIL: {
    subtitle: "The Protector",
    gift: "You shield what matters. Boundary definition and security.",
    challenge: "Isolation. The fortress that becomes a prison.",
  },
  OPERATOR: {
    subtitle: "The Executor",
    gift: "You make things real. Precision under fire.",
    challenge: "Tunnel vision. Execution without reflection.",
  },
  ENGINE: {
    subtitle: "The Driver",
    gift: "You generate momentum. Unstoppable forward energy.",
    challenge: "Burnout. The engine that consumes itself.",
  },
  LUMEN: {
    subtitle: "The Illuminator",
    gift: "You reveal truth. Clarity in fog.",
    challenge: "Exposure risk. The light that blinds.",
  },
  CIPHER: {
    subtitle: "The Decoder",
    gift: "You solve mysteries. Pattern recognition and synthesis.",
    challenge: "Over-complexity. The puzzle solver who creates puzzles.",
  },
  DRIFT: {
    subtitle: "The Adapter",
    gift: "You flow through chaos. Improvisation and resilience.",
    challenge: "Lack of foundation. The drifter who never roots.",
  },
  CHRONICLE: {
    subtitle: "The Documenter",
    gift: "You preserve wisdom. Memory and continuity.",
    challenge: "Living in the past. The historian who forgets the future.",
  },
};

export function ArchetypeReveal({ callsign, primary, shadow, rising, onComplete }: ArchetypeRevealProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(() => setPhase(4), 3500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const primaryData = ARCHETYPE_DATA[primary] || ARCHETYPE_DATA.WATCHTOWER;
  const shadowData = ARCHETYPE_DATA[shadow] || ARCHETYPE_DATA.ENGINE;
  const risingData = ARCHETYPE_DATA[rising] || ARCHETYPE_DATA.CHRONICLE;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-3xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div className={`text-center space-y-2 transition-all duration-1000 ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground font-mono">
            VANGUARD {callsign}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Archetype Signature Confirmed
          </p>
        </div>

        {/* Primary Archetype */}
        <div className={`transition-all duration-1000 delay-300 ${phase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="bg-card border-2 border-primary/30 rounded-lg p-4 sm:p-6 md:p-8 space-y-3 sm:space-y-4 shadow-lg shadow-primary/20">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
              <p className="text-xs sm:text-sm text-primary font-mono uppercase tracking-wider">
                Primary Archetype
              </p>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              {primary}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground italic">
              {primaryData.subtitle}
            </p>
            <div className="pt-2 sm:pt-4 space-y-2">
              <p className="text-sm sm:text-base text-foreground/90">
                <span className="text-primary font-semibold">Gift:</span> {primaryData.gift}
              </p>
            </div>
          </div>
        </div>

        {/* Shadow & Rising Grid */}
        <div className={`grid md:grid-cols-2 gap-4 transition-all duration-1000 delay-500 ${phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Shadow */}
          <div className="bg-card border border-border/50 rounded-lg p-4 sm:p-5 space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-destructive rounded-full" />
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                Shadow
              </p>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              {shadow}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground italic">
              {shadowData.subtitle}
            </p>
            <p className="text-xs sm:text-sm text-foreground/80 pt-1 sm:pt-2">
              <span className="text-destructive font-semibold">Challenge:</span> {shadowData.challenge}
            </p>
          </div>

          {/* Rising */}
          <div className="bg-card border border-border/50 rounded-lg p-4 sm:p-5 space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-neuro-cyan rounded-full" />
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                Rising
              </p>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              {rising}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground italic">
              {risingData.subtitle}
            </p>
            <p className="text-xs sm:text-sm text-foreground/80 pt-1 sm:pt-2">
              <span className="text-neuro-cyan font-semibold">Emerging:</span> {risingData.gift}
            </p>
          </div>
        </div>

        {/* Reading Your Triad — what these three facets mean */}
        <div className={`text-left space-y-3 rounded-lg border border-border/60 bg-card/40 p-4 sm:p-6 transition-all duration-1000 delay-500 ${phase >= 4 ? 'opacity-100' : 'opacity-0'}`}>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-neuro-cyan">Reading Your Triad</p>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <span className="text-foreground font-semibold">Primary</span> is your default lens — the
            way you instinctively read a system before you have time to think. When the Fog rises,
            this is the strength you will reach for first.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <span className="text-foreground font-semibold">Shadow</span> is not a flaw. It is the
            polarity opposite of your Primary — the mode of seeing you most neglect. ApexMesh studies
            operators; it attacks the flank you never watch. Your Shadow names that flank, so your
            training can deliberately pull you toward it before the field does.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <span className="text-foreground font-semibold">Rising</span> was measured from how your
            answers shifted as the scenarios pressed harder — the strength that gained ground under
            pressure. It is not who you are yet. It is who the mission is already making you.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground/80 leading-relaxed italic">
            Echelon knows all three. Expect your missions to lean on your Primary, guard your Shadow,
            and feed your Rising.
          </p>
        </div>

        {/* Continue Button */}
        <div className={`pt-4 sm:pt-6 transition-all duration-1000 delay-700 ${phase >= 4 ? 'opacity-100' : 'opacity-0'}`}>
          <Button
            onClick={onComplete}
            className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold"
            size="lg"
          >
            Continue to Foxhole Protocol →
          </Button>
        </div>
      </div>
    </div>
  );
}
