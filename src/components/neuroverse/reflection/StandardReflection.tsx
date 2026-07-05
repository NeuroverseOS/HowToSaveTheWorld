import { useState } from "react";
import { saveReflectionEntry } from "@/lib/reflection-storage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface StandardReflectionProps {
  lessonId: number;
  stage: "drill1" | "drill2";
  prompt: string;
  streamEchelonResponse: (systemMessage: string, operatorMessage?: string) => Promise<void>;
  onComplete: () => void;
}

type ReflectionPhase = "input" | "followup" | "close";

export default function StandardReflection({
  lessonId,
  stage,
  prompt,
  streamEchelonResponse,
  onComplete,
}: StandardReflectionProps) {
  const [phase, setPhase] = useState<ReflectionPhase>("input");
  const [reflection, setReflection] = useState("");
  const [followupResponse, setFollowupResponse] = useState("");
  const [echelonMirror, setEchelonMirror] = useState("");
  const [echelonFollowup, setEchelonFollowup] = useState("");
  const [echelonClose, setEchelonClose] = useState("");

  const MAX_PRIMARY = 500;
  const MAX_FOLLOWUP = 300;

  const handlePrimarySubmit = async () => {
    if (!reflection.trim()) return;

    // Capture Echelon's mirror and followup
    const mirrorPrompt = `The Operator reflected: "${reflection}". Acknowledge what they shared in 1-2 sentences. Then ask ONE neutral follow-up question to deepen their insight.`;
    
    await streamEchelonResponse(
      "[REFLECTION_STANDARD_MIRROR]",
      mirrorPrompt
    );

    // Store mirror response (would need to capture from streamEchelonResponse)
    // For now, move to followup phase
    setPhase("followup");
  };

  const handleFollowupSubmit = async () => {
    // Echelon closes the reflection
    const closePrompt = followupResponse.trim()
      ? `The Operator responded: "${followupResponse}". Reinforce the insight gained. Return them to mission readiness. Max 30 words.`
      : "The Operator chose to continue. Acknowledge their reflection and return them to mission readiness. Max 30 words.";

    await streamEchelonResponse(
      "[REFLECTION_STANDARD_CLOSE]",
      closePrompt
    );

    // Save reflection entry
    saveReflectionEntry({
      lessonId,
      stage,
      mode: "standard",
      prompt,
      operatorPrimary: reflection,
      operatorFollowup: followupResponse || null,
      echelonMirror,
      echelonFollowup,
      echelonClose,
      timestamp: Date.now(),
    });

    setPhase("close");
  };

  const handleComplete = () => {
    onComplete();
  };

  return (
    <div className="w-full flex flex-col items-center">
      <Card className="w-full max-w-2xl p-6 space-y-6 bg-neuro-surface/90 border border-neuro-cyan/30 backdrop-blur-md">
        {/* PHASE 1 — INPUT */}
        {phase === "input" && (
          <>
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider text-neuro-orange">
                Reflection
              </div>
              <p className="text-sm font-semibold text-foreground">{prompt}</p>
            </div>
            
            <Textarea
              className="w-full h-32 p-3 bg-background/50 border border-neuro-border rounded-lg resize-none text-sm"
              maxLength={MAX_PRIMARY}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Share your insight..."
            />
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {reflection.length} / {MAX_PRIMARY}
              </span>
              <Button
                disabled={!reflection.trim()}
                onClick={handlePrimarySubmit}
                className="bg-neuro-cyan/20 hover:bg-neuro-cyan/30 text-neuro-cyan border border-neuro-cyan/40"
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {/* PHASE 2 — FOLLOWUP */}
        {phase === "followup" && (
          <>
            <div className="space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-neuro-cyan">
                Echelon Response
              </div>
              <div className="text-sm text-muted-foreground italic">
                [Echelon's mirror and follow-up question will appear here]
              </div>
            </div>

            <Textarea
              className="w-full h-24 p-3 bg-background/50 border border-neuro-border rounded-lg resize-none text-sm"
              maxLength={MAX_FOLLOWUP}
              value={followupResponse}
              onChange={(e) => setFollowupResponse(e.target.value)}
              placeholder="Your response (optional)..."
            />

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {followupResponse.length} / {MAX_FOLLOWUP}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={handleFollowupSubmit}
                  className="text-muted-foreground"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleFollowupSubmit}
                  className="bg-neuro-cyan/20 hover:bg-neuro-cyan/30 text-neuro-cyan border border-neuro-cyan/40"
                >
                  Continue
                </Button>
              </div>
            </div>
          </>
        )}

        {/* PHASE 3 — CLOSE */}
        {phase === "close" && (
          <>
            <div className="space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-neuro-cyan">
                Integration
              </div>
              <div className="text-sm text-muted-foreground italic">
                [Echelon's closing statement will appear here]
              </div>
            </div>

            <Button
              onClick={handleComplete}
              className="w-full bg-neuro-orange/20 hover:bg-neuro-orange/30 text-neuro-orange border border-neuro-orange/40"
            >
              Return to Mission
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
