import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { saveReflectionEntry } from "@/lib/reflection-storage";
import { renderEmphasis } from "@/lib/render-emphasis";
import { cn } from "@/lib/utils";

interface ReflectionModeProps {
  lessonId: number;
  reflectionPrompt: string;
  streamEchelonResponse: (message: string, operatorRequest?: string) => Promise<void>;
  /** Reads Echelon's latest streamed reply — this view REPLACES the chat, so
      the reply must be re-shown here or the operator never sees it. */
  getLatestEchelon?: () => string | null;
  onComplete: () => void;
}

type ReflectionPhase = "input" | "mirror" | "follow" | "close";

export default function ReflectionMode({
  lessonId,
  reflectionPrompt,
  streamEchelonResponse,
  getLatestEchelon,
  onComplete,
}: ReflectionModeProps) {
  const [phase, setPhase] = useState<ReflectionPhase>("input");
  const [input, setInput] = useState("");
  const [microReply, setMicroReply] = useState("");
  const [echelonMirror, setEchelonMirror] = useState("");
  const [echelonClose, setEchelonClose] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const handleSubmitReflection = async () => {
    if (!input.trim() || isThinking) return;

    // MIRROR Phase: Echelon acknowledges and asks ONE follow-up question
    const mirrorPrompt = `Operator has completed the FINAL stage reflection. Now entering REFLECTION MODE.

User's reflection: "${input}"

Your response MUST:
1. Acknowledge what the Operator shared (1 sentence)
2. Identify the core theme or pattern (1 sentence)
3. Ask ONE follow-up question to deepen integration

Keep total response under 80 words. Stay in mythic-tech voice.
Do NOT give advice. ONE question only.`;

    setIsThinking(true);
    try {
      await streamEchelonResponse("[REFLECTION_DEEP_MIRROR]", mirrorPrompt);
    } finally {
      setIsThinking(false);
    }

    // The reply streamed into the (hidden) mission thread — capture it so
    // this view can actually show it. Without this, Echelon answers into
    // the void and the operator sees two unexplained buttons.
    setEchelonMirror(getLatestEchelon?.() ?? "");
    setPhase("mirror");
  };

  const handleReplyToMirror = () => {
    setPhase("follow");
  };

  const handleSkipReply = async () => {
    await handleSubmitMicroReply(true);
  };

  const handleSubmitMicroReply = async (skipped: boolean = false) => {
    if (isThinking) return;
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

    setIsThinking(true);
    try {
      await streamEchelonResponse("[REFLECTION_DEEP_CLOSE]", closePrompt);
    } finally {
      setIsThinking(false);
    }

    const close = getLatestEchelon?.() ?? "";
    setEchelonClose(close);

    // Save complete reflection entry to local storage — Echelon's actual
    // words, captured above, not empty placeholders.
    saveReflectionEntry({
      lessonId,
      stage: "final",
      mode: "deep",
      prompt: "Final Reflection",
      operatorPrimary: input.slice(0, 800),
      operatorFollowup: finalMicroReply.slice(0, 300) || null,
      echelonMirror: echelonMirror,
      echelonFollowup: null,
      echelonClose: close,
      timestamp: Date.now(),
    });

    setPhase("close");
  };

  const characterCount = (text: string, max: number) => {
    return `${text.length}/${max}`;
  };

  const thinkingIndicator = (
    <div className="flex items-center justify-center gap-3 py-4 text-neuro-cyan">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm font-mono uppercase tracking-[0.2em]">
        Echelon is reading your words…
      </span>
    </div>
  );

  return (
    <div className="w-full flex flex-col gap-6 p-4 sm:p-6 animate-fade-in">
      {/* Where the operator is, and why — this view replaces the mission
          chat, so it has to introduce itself. */}
      <Card className="bg-card/50 border-neuro-border backdrop-blur-sm">
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-neuro-cyan animate-pulse"></div>
            <span className="text-sm text-neuro-cyan font-medium">Final Transmission — Deep Reflection</span>
          </div>
          <p className="text-xs text-muted-foreground">
            The last step of this mission. What you write here becomes this
            mission's entry in your Field Guide — witnessed by Echelon, kept by you.
          </p>
          <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed font-medium">
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
              disabled={isThinking}
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {characterCount(input, 800)}
            </div>
          </div>

          {isThinking ? thinkingIndicator : (
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
          )}
        </div>
      )}

      {/* ===========================
              PHASE 2 — MIRROR
         =========================== */}
      {phase === "mirror" && (
        <div className="flex flex-col gap-4">
          {/* Echelon's mirror — shown HERE, because the chat is hidden */}
          <Card className="bg-neuro-surface/90 border border-neuro-cyan/30">
            <CardContent className="p-4 sm:p-6 space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neuro-cyan">
                Echelon
              </p>
              <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">
                {echelonMirror
                  ? renderEmphasis(echelonMirror)
                  : "Echelon has acknowledged your reflection. Answer the follow-up, or continue."}
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleReplyToMirror}
              disabled={isThinking}
              className={cn(
                "w-full py-6 text-base font-medium",
                "bg-neuro-cyan/20 hover:bg-neuro-cyan/30",
                "border border-neuro-cyan/30",
                "flex items-center justify-center gap-2"
              )}
            >
              Reply <ArrowRight size={18} />
            </Button>

            {isThinking ? thinkingIndicator : (
              <Button
                variant="ghost"
                onClick={handleSkipReply}
                className="w-full py-4 text-muted-foreground hover:text-foreground hover:bg-neuro-surface"
              >
                Skip to Continue
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ===========================
              PHASE 3 — FOLLOW-UP
         =========================== */}
      {phase === "follow" && (
        <div className="flex flex-col gap-4">
          {/* Keep Echelon's question on screen while they answer it */}
          {echelonMirror && (
            <Card className="bg-neuro-surface/90 border border-neuro-cyan/30">
              <CardContent className="p-4 sm:p-6 space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neuro-cyan">
                  Echelon
                </p>
                <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">
                  {renderEmphasis(echelonMirror)}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="relative">
            <textarea
              value={microReply}
              onChange={(e) => setMicroReply(e.target.value.slice(0, 300))}
              maxLength={300}
              placeholder="Your reply..."
              className="w-full h-32 p-4 rounded-xl bg-card/80 border border-border/50 focus:ring-2 focus:ring-neuro-cyan outline-none text-foreground placeholder:text-muted-foreground resize-none"
              autoFocus
              disabled={isThinking}
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {characterCount(microReply, 300)}
            </div>
          </div>

          {isThinking ? thinkingIndicator : (
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
          )}
        </div>
      )}

      {/* ===========================
              PHASE 4 — CLOSE-OUT
         =========================== */}
      {phase === "close" && (
        <div className="flex flex-col gap-4">
          {echelonClose && (
            <Card className="bg-neuro-surface/90 border border-neuro-cyan/30">
              <CardContent className="p-4 sm:p-6 space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neuro-cyan">
                  Echelon
                </p>
                <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">
                  {renderEmphasis(echelonClose)}
                </p>
              </CardContent>
            </Card>
          )}
          <p className="text-xs text-center text-muted-foreground">
            Reflection sealed to your Field Guide. This mission is complete.
          </p>
          <Button
            onClick={onComplete}
            className={cn(
              "w-full py-6 text-base font-medium",
              "bg-neuro-cyan/20 hover:bg-neuro-cyan/30",
              "border border-neuro-cyan/30",
              "flex items-center justify-center gap-2"
            )}
          >
            Complete Mission <ArrowRight size={18} />
          </Button>
        </div>
      )}
    </div>
  );
}
