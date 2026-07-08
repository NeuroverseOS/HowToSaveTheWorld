import { useState, useEffect } from "react";
import { saveReflectionEntry } from "@/lib/reflection-storage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface ExerciseReflectionProps {
  lessonId: number;
  stage: "debrief";
  exerciseText: string;
  streamEchelonResponse: (systemMessage: string, operatorMessage?: string) => Promise<void>;
  /** Reads Echelon's latest streamed reply so the card can show and save it. */
  getLatestEchelon?: () => string | null;
  onComplete: () => void;
}

export default function ExerciseReflection({
  lessonId,
  stage,
  exerciseText,
  streamEchelonResponse,
  getLatestEchelon,
  onComplete,
}: ExerciseReflectionProps) {
  const [prompt, setPrompt] = useState("");
  const [reflection, setReflection] = useState("");
  const [phase, setPhase] = useState<"input" | "mirror">("input");
  const [echelonMirror, setEchelonMirror] = useState("");

  const MAX_CHARS = 600;

  // Extract Step 1 from exercise text
  useEffect(() => {
    const match = exerciseText.match(/Step 1[:\-—]\s*([^\n]+)/i);
    const extracted = match ? match[1].trim() : "What did you learn from this exercise?";
    setPrompt(`Reflect on this step: ${extracted}`);
  }, [exerciseText]);

  const handleSubmit = async () => {
    if (!reflection.trim()) return;

    // Echelon mirrors the exercise reflection
    const mirrorPrompt = `The Operator reflected on the exercise: "${reflection}". Acknowledge their learning in 1-2 observational sentences. No questions.`;
    
    await streamEchelonResponse(
      "[REFLECTION_EXERCISE_MIRROR]",
      mirrorPrompt
    );

    const mirror = getLatestEchelon?.() ?? "";
    setEchelonMirror(mirror);

    // Save exercise reflection — with Echelon's actual acknowledgment
    saveReflectionEntry({
      lessonId,
      stage,
      mode: "exercise",
      prompt,
      operatorPrimary: reflection,
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
                Exercise Reflection
              </div>
              <p className="text-sm font-semibold text-foreground">{prompt}</p>
            </div>
            
            <Textarea
              className="w-full h-32 p-3 bg-background/50 border border-neuro-border rounded-lg resize-none text-sm"
              maxLength={MAX_CHARS}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What did you discover?"
            />
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {reflection.length} / {MAX_CHARS}
              </span>
              <Button
                disabled={!reflection.trim()}
                onClick={handleSubmit}
                className="bg-neuro-cyan/20 hover:bg-neuro-cyan/30 text-neuro-cyan border border-neuro-cyan/40"
              >
                Complete Reflection
              </Button>
            </div>
          </>
        )}

        {/* PHASE 2 — MIRROR */}
        {phase === "mirror" && (
          <>
            <div className="space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-neuro-cyan">
                Integration
              </div>
              {/* The reply already streamed into the thread — don't re-print it */}
              <div className="text-sm text-muted-foreground italic">
                ↑ Echelon has acknowledged your reflection in the mission thread above. Logged to your record.
              </div>
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
