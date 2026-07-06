import { useState } from "react";
import { saveReflectionEntry } from "@/lib/reflection-storage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface MicroInsightProps {
  lessonId: number;
  stage: "video";
  prompt: string;
  streamEchelonResponse: (systemMessage: string, operatorMessage?: string) => Promise<void>;
  /** Reads Echelon's latest streamed reply so the card can show and save it. */
  getLatestEchelon?: () => string | null;
  onComplete: () => void;
}

export default function MicroInsight({
  lessonId,
  stage,
  prompt,
  streamEchelonResponse,
  getLatestEchelon,
  onComplete,
}: MicroInsightProps) {
  const [insight, setInsight] = useState("");
  const [phase, setPhase] = useState<"input" | "mirror">("input");
  const [echelonMirror, setEchelonMirror] = useState("");

  const MAX_CHARS = 240;

  const handleSubmit = async () => {
    if (!insight.trim()) return;

    // Echelon mirrors in one sentence
    const mirrorPrompt = `The Operator observed: "${insight}". Mirror this observation in one sentence. Observational only. No questions. Max 20 words.`;
    
    await streamEchelonResponse(
      "[REFLECTION_MICRO_MIRROR]",
      mirrorPrompt
    );

    const mirror = getLatestEchelon?.() ?? "";
    setEchelonMirror(mirror);

    // Save micro insight — with Echelon's actual acknowledgment
    saveReflectionEntry({
      lessonId,
      stage,
      mode: "micro",
      prompt,
      operatorPrimary: insight,
      operatorFollowup: null,
      echelonMirror: mirror,
      echelonFollowup: null,
      echelonClose: "",
      timestamp: Date.now(),
    });

    setPhase("mirror");
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
                Quick Insight
              </div>
              <p className="text-sm font-semibold text-foreground">{prompt}</p>
            </div>
            
            <Textarea
              className="w-full h-24 p-3 bg-background/50 border border-neuro-border rounded-lg resize-none text-sm"
              maxLength={MAX_CHARS}
              value={insight}
              onChange={(e) => setInsight(e.target.value)}
              placeholder="Brief observation..."
            />
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {insight.length} / {MAX_CHARS}
              </span>
              <Button
                disabled={!insight.trim()}
                onClick={handleSubmit}
                className="bg-neuro-cyan/20 hover:bg-neuro-cyan/30 text-neuro-cyan border border-neuro-cyan/40"
              >
                Save Insight
              </Button>
            </div>
          </>
        )}

        {/* PHASE 2 — MIRROR */}
        {phase === "mirror" && (
          <>
            <div className="space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-neuro-cyan">
                Acknowledged
              </div>
              {echelonMirror ? (
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{echelonMirror}</p>
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  Echelon has acknowledged your insight in the mission thread above.
                </div>
              )}
            </div>

            <Button
              onClick={handleComplete}
              className="w-full bg-neuro-orange/20 hover:bg-neuro-orange/30 text-neuro-orange border border-neuro-orange/40"
            >
              Continue Mission
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
