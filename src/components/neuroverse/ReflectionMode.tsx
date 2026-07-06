import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { saveReflectionEntry } from "@/lib/reflection-storage";
import { cn } from "@/lib/utils";

interface ReflectionModeProps {
  lessonId: number;
  reflectionPrompt: string;
  streamEchelonResponse: (message: string, operatorRequest?: string) => Promise<void>;
  onComplete: () => void;
}

type ReflectionPhase = "input" | "mirror" | "follow" | "close";

export default function ReflectionMode({
  lessonId,
  reflectionPrompt,
  streamEchelonResponse,
  onComplete,
}: ReflectionModeProps) {
  const [phase, setPhase] = useState<ReflectionPhase>("input");
  const [input, setInput] = useState("");
  const [microReply, setMicroReply] = useState("");
  const [echelonMirror, setEchelonMirror] = useState("");
  const [echelonClose, setEchelonClose] = useState("");

  const handleSubmitReflection = async () => {
    if (!input.trim()) return;

    // MIRROR Phase: Echelon acknowledges and asks ONE follow-up question
    const mirrorPrompt = `Operator has completed the FINAL stage reflection. Now entering REFLECTION MODE.

User's reflection: "${input}"

Your response MUST:
1. Acknowledge what the Operator shared (1 sentence)
2. Identify the core theme or pattern (1 sentence)
3. Ask ONE follow-up question to deepen integration

Keep total response under 80 words. Stay in mythic-tech voice.
Do NOT give advice. ONE question only.`;

    await streamEchelonResponse("[REFLECTION_DEEP_MIRROR]", mirrorPrompt);
    
    // Note: The actual mirrored text will be captured in LessonRunner's message state
    // We'll store the reflection entry when moving to next phase
    setPhase("mirror");
  };

  const handleReplyToMirror = () => {
    setPhase("follow");
  };

  const handleSkipReply = async () => {
    await handleSubmitMicroReply(true);
  };

  const handleSubmitMicroReply = async (skipped: boolean = false) => {
    const finalMicroReply = skipped ? "" : microReply;

    // CLOSE Phase: Echelon provides integration statement
    const closePrompt = skipped 
      ? "Operator chose to continue without reply. Provide a single sentence that reinforces their original insight and returns them to mission readiness. Maximum 30 words. No questions."
      : `User's follow-up reply: "${finalMicroReply}"

Provide a single sentence that:
- Reinforces the insight the Operator gained
- Returns them to mission readiness
- Uses mythic-tech language

Maximum 30 words. No questions.`;

    await streamEchelonResponse("[REFLECTION_DEEP_CLOSE]", closePrompt);
    
    // Save complete reflection entry to local storage
    saveReflectionEntry({
      lessonId,
      stage: "final",
      mode: "deep",
      prompt: "Final Reflection",
      operatorPrimary: input.slice(0, 800),
      operatorFollowup: finalMicroReply.slice(0, 300) || null,
      echelonMirror: echelonMirror,
      echelonFollowup: null,
      echelonClose: echelonClose,
      timestamp: Date.now(),
    });

    setPhase("close");
  };

  const characterCount = (text: string, max: number) => {
    return `${text.length}/${max}`;
  };

  return (
    <div className="w-full flex flex-col gap-6 p-4 sm:p-6 animate-fade-in">
      {/* Reflection Prompt Card */}
      <Card className="bg-card/50 border-neuro-border backdrop-blur-sm">
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-neuro-cyan animate-pulse"></div>
            <span className="text-sm text-neuro-cyan font-medium">Deep Reflection Mode</span>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {reflectionPrompt}
          </p>
        </CardContent>
      </Card>

      {/* ===========================
              PHASE 1 — INPUT
         =========================== */}
      {phase === "input" && (
        <div className="flex flex-col gap-4">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 800))}
              maxLength={800}
              placeholder="Your reflection..."
              className="w-full h-40 p-4 rounded-xl bg-card/80 border border-border/50 focus:ring-2 focus:ring-neuro-cyan outline-none text-foreground placeholder:text-muted-foreground resize-none"
              autoFocus
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {characterCount(input, 800)}
            </div>
          </div>

          <Button
            disabled={!input.trim()}
            onClick={handleSubmitReflection}
            className={cn(
              "w-full py-6 text-base font-medium",
              "bg-neuro-cyan/20 hover:bg-neuro-cyan/30",
              "border border-neuro-cyan/30",
              "flex items-center justify-center gap-2",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Submit Reflection <ArrowRight size={18} />
          </Button>
        </div>
      )}

      {/* ===========================
              PHASE 2 — MIRROR
         =========================== */}
      {phase === "mirror" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleReplyToMirror}
              className={cn(
                "w-full py-6 text-base font-medium",
                "bg-neuro-cyan/20 hover:bg-neuro-cyan/30",
                "border border-neuro-cyan/30",
                "flex items-center justify-center gap-2"
              )}
            >
              Reply <ArrowRight size={18} />
            </Button>

            <Button
              variant="ghost"
              onClick={handleSkipReply}
              className="w-full py-4 text-muted-foreground hover:text-foreground hover:bg-neuro-surface"
            >
              Skip to Continue
            </Button>
          </div>
        </div>
      )}

      {/* ===========================
              PHASE 3 — FOLLOW-UP
         =========================== */}
      {phase === "follow" && (
        <div className="flex flex-col gap-4">
          <div className="relative">
            <textarea
              value={microReply}
              onChange={(e) => setMicroReply(e.target.value.slice(0, 300))}
              maxLength={300}
              placeholder="Your reply..."
              className="w-full h-32 p-4 rounded-xl bg-card/80 border border-border/50 focus:ring-2 focus:ring-neuro-cyan outline-none text-foreground placeholder:text-muted-foreground resize-none"
              autoFocus
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {characterCount(microReply, 300)}
            </div>
          </div>

          <Button
            onClick={() => handleSubmitMicroReply(false)}
            disabled={!microReply.trim()}
            className={cn(
              "w-full py-6 text-base font-medium",
              "bg-neuro-cyan/20 hover:bg-neuro-cyan/30",
              "border border-neuro-cyan/30",
              "flex items-center justify-center gap-2",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Send <ArrowRight size={18} />
          </Button>
        </div>
      )}

      {/* ===========================
              PHASE 4 — CLOSE-OUT
         =========================== */}
      {phase === "close" && (
        <div className="flex flex-col gap-4">
          <Button
            onClick={onComplete}
            className={cn(
              "w-full py-6 text-base font-medium",
              "bg-neuro-cyan/20 hover:bg-neuro-cyan/30",
              "border border-neuro-cyan/30",
              "flex items-center justify-center gap-2"
            )}
          >
            Continue Mission <ArrowRight size={18} />
          </Button>
        </div>
      )}
    </div>
  );
}
