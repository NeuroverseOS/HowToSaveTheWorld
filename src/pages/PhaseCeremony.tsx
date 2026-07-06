import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { loadState, conferRank } from "@/lib/state-engine";
import {
  PHASE_DEFINITIONS,
  isPhaseAssessmentSealed,
  generatePhaseAssessment,
  sealPhaseAssessment,
} from "@/lib/phase-assessment";
import "@/styles/graduation-animations.css";

const TITLE_DURATION = 4000; // 4 seconds, matching graduation cinematic pacing

type CeremonyStep =
  | "title"       // phase title card
  | "generating"  // Echelon compiling the assessment
  | "reveal"      // typewriter reveal of the written assessment
  | "gate"        // Mirror Gate: seal or request revision
  | "revision"    // one free-text adjustment note
  | "error"       // generation failed
  | "rank"        // rank conferral card
  | "archive";    // lesson 30 only: sovereign archive invitation

export default function PhaseCeremony() {
  const navigate = useNavigate();
  const { phase: phaseParam } = useParams();
  const phase = Number(phaseParam) as 1 | 2 | 3;
  const def = PHASE_DEFINITIONS[phase];

  const [step, setStep] = useState<CeremonyStep>("title");
  const [callsign, setCallsign] = useState("Recruit");
  const [assessment, setAssessment] = useState("");
  const [revealedText, setRevealedText] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [revisionUsed, setRevisionUsed] = useState(false);
  const [isSealing, setIsSealing] = useState(false);
  const revealCancelRef = useRef(false);

  useEffect(() => {
    if (!def) {
      navigate("/dashboard");
      return;
    }

    const state = loadState();
    if (!state) {
      navigate("/");
      return;
    }

    // Replay safety: sealed ceremonies never re-run
    if (isPhaseAssessmentSealed(state, phase)) {
      console.log(`[CEREMONY] Phase ${phase} already sealed - returning to dashboard`);
      navigate("/dashboard");
      return;
    }

    // Guard: capstone lesson must be complete
    if (!state.progress.lessons_completed.includes(def.capstoneLesson)) {
      console.log(`[CEREMONY] Lesson ${def.capstoneLesson} not complete - returning to dashboard`);
      navigate("/dashboard");
      return;
    }

    setCallsign(state.user.vanguard.callsign || "Recruit");

    return () => {
      revealCancelRef.current = true;
    };
  }, [navigate, phase, def]);

  // Title card auto-advances into generation
  useEffect(() => {
    if (step !== "title" || !def) return;
    const timer = setTimeout(() => runGeneration(), TITLE_DURATION);
    return () => clearTimeout(timer);
  }, [step]);

  const runGeneration = async (note?: string) => {
    setStep("generating");
    setRevealedText("");

    const text = await generatePhaseAssessment(phase, note);
    if (!text) {
      setStep("error");
      return;
    }

    setAssessment(text);
    revealAssessment(text);
  };

  // Typewriter reveal, matching the app's streamed-delivery pattern
  const revealAssessment = async (text: string) => {
    setStep("reveal");
    revealCancelRef.current = false;

    const words = text.split(" ");
    let currentText = "";

    for (let i = 0; i < words.length; i++) {
      if (revealCancelRef.current) return;
      currentText += (i > 0 ? " " : "") + words[i];
      setRevealedText(currentText);
      await new Promise((resolve) => setTimeout(resolve, 30));
    }

    setStep("gate");
  };

  const handleRevealAll = () => {
    revealCancelRef.current = true;
    setRevealedText(assessment);
    setStep("gate");
  };

  const handleSeal = async () => {
    if (isSealing) return;
    setIsSealing(true);

    try {
      await sealPhaseAssessment(phase, assessment);
      conferRank(def.conferredRank, def.capstoneLesson);
      setStep("rank");
    } finally {
      setIsSealing(false);
    }
  };

  const handleRequestRevision = () => {
    setStep("revision");
  };

  const handleSubmitRevision = () => {
    if (!revisionNote.trim()) return;
    setRevisionUsed(true);
    runGeneration(revisionNote.trim());
  };

  const handleRankContinue = () => {
    if (phase === 1) {
      setStep("archive");
    } else {
      navigate("/dashboard");
    }
  };

  if (!def) return null;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center space-y-8">

        {/* Step 1: Phase Title Card */}
        {step === "title" && (
          <div className="fadeIn">
            <div className="text-5xl sm:text-6xl font-bold text-neuro-cyan mb-4 tracking-widest sigilPulse">
              {def.phaseTitle.toUpperCase()} PHASE COMPLETE
            </div>
            <div className="text-xl text-neuro-purple">
              Missions {def.lessonStart}–{def.lessonEnd} archived.
            </div>
            <div className="text-lg text-muted-foreground mt-4">
              Stand by, Operator {callsign}. The {def.assessmentName} is being drafted.
            </div>
          </div>
        )}

        {/* Step 2: Generating */}
        {step === "generating" && (
          <div className="fadeIn space-y-6">
            <div className="text-3xl font-bold text-neuro-cyan tracking-widest">
              {def.assessmentName.toUpperCase()}
            </div>
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-neuro-cyan" />
              <span className="text-lg">Echelon is compiling the record...</span>
            </div>
          </div>
        )}

        {/* Step 3: Assessment Reveal + Mirror Gate */}
        {(step === "reveal" || step === "gate") && (
          <div className="fadeIn space-y-6 text-left">
            <div className="text-center">
              <div className="text-3xl font-bold text-neuro-cyan tracking-widest">
                {def.assessmentName.toUpperCase()}
              </div>
              <div className="text-sm text-muted-foreground mt-2 font-mono uppercase tracking-[0.2em]">
                A witnessing, not a grade
              </div>
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-6 rounded-lg border border-neuro-cyan/30 bg-neuro-cyan/5">
              <p className="text-base text-white/90 whitespace-pre-wrap leading-relaxed">
                {revealedText}
              </p>
            </div>

            {step === "reveal" && (
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRevealAll}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Reveal in full
                </Button>
              </div>
            )}

            {step === "gate" && (
              <div className="space-y-3">
                <p className="text-center text-sm text-muted-foreground">
                  The record is yours to accept or contest. Authority remains with you.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleSeal}
                    disabled={isSealing}
                    size="lg"
                    className="flex-1 text-lg py-6 bg-neuro-cyan hover:bg-neuro-cyan/80 text-black font-bold"
                  >
                    {isSealing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sealing...
                      </>
                    ) : (
                      "Seal This Assessment"
                    )}
                  </Button>
                  {!revisionUsed && (
                    <Button
                      onClick={handleRequestRevision}
                      variant="outline"
                      size="lg"
                      className="flex-1 text-lg py-6 border-neuro-purple/50 text-neuro-purple hover:bg-neuro-purple/10"
                    >
                      Request Revision
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Revision Note */}
        {step === "revision" && (
          <div className="fadeIn space-y-6">
            <div className="text-3xl font-bold text-neuro-purple tracking-widest">
              REVISION REQUEST
            </div>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Tell me what the record missed or misread, Operator. I will rewrite it once,
              with your note in hand.
            </p>
            <Textarea
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="What should this assessment weigh differently..."
              className="min-h-[120px] text-base p-4 bg-black/50 border-neuro-purple/50 text-white placeholder:text-muted-foreground"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleSubmitRevision}
                disabled={!revisionNote.trim()}
                size="lg"
                className="flex-1 text-lg py-6 bg-neuro-purple hover:bg-neuro-purple/80 text-white font-bold"
              >
                Transmit Revision Note
              </Button>
              <Button
                onClick={() => setStep("gate")}
                variant="outline"
                size="lg"
                className="flex-1 text-lg py-6"
              >
                Back to Assessment
              </Button>
            </div>
          </div>
        )}

        {/* Error state: generation failed */}
        {step === "error" && (
          <div className="fadeIn space-y-6">
            <div className="text-3xl font-bold text-neuro-orange tracking-widest">
              TRANSMISSION INTERRUPTED
            </div>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              The assessment could not be drafted. Verify your AI connection and try again.
              The ceremony will remain open until the record is sealed.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => runGeneration(revisionUsed ? revisionNote.trim() : undefined)}
                size="lg"
                className="flex-1 text-lg py-6 bg-neuro-cyan hover:bg-neuro-cyan/80 text-black font-bold"
              >
                Retry
              </Button>
              <Button
                onClick={() => navigate("/dashboard")}
                variant="outline"
                size="lg"
                className="flex-1 text-lg py-6"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Rank Conferral */}
        {step === "rank" && (
          <div className="fadeIn space-y-8">
            <div className="text-xl text-muted-foreground">
              The {def.assessmentName} is sealed in the archive.
            </div>
            <div className="glow max-w-md mx-auto p-10 rounded-lg border border-neuro-cyan/40 bg-neuro-cyan/5 space-y-4">
              <div className="text-xs text-muted-foreground font-mono uppercase tracking-[0.3em]">
                Rank Conferred
              </div>
              <div className="text-5xl font-bold text-neuro-cyan tracking-widest sigilPulse">
                {def.conferredRank.toUpperCase()}
              </div>
              <div className="text-lg text-neuro-purple">
                {callsign}
              </div>
            </div>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              You are commissioned into the {def.nextPhaseTitle} phase. Carry the record forward.
            </p>
            <Button
              onClick={handleRankContinue}
              size="lg"
              className="w-full max-w-md text-lg py-6 bg-neuro-cyan hover:bg-neuro-cyan/80 text-black font-bold"
            >
              Continue →
            </Button>
            <div>
              <Button
                onClick={() => navigate("/field-guide?tab=dossier")}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-neuro-cyan"
              >
                Read it in your dossier →
              </Button>
            </div>
          </div>
        )}

        {/* Step 6 (lesson 30 only): Sovereign Archive Invitation */}
        {step === "archive" && (
          <div className="fadeIn space-y-8">
            <div className="text-3xl font-bold text-neuro-cyan tracking-widest">
              SOVEREIGN ARCHIVE
            </div>
            <div className="max-w-xl mx-auto space-y-4 text-lg text-muted-foreground">
              <p>You've built something worth keeping, Operator {callsign}.</p>
              <p>
                Thirty missions. One sealed assessment. A record that belongs to you —
                not to any server you don't control.
              </p>
              <p className="text-white">
                Stand up your own archive, and this record answers to no one but you.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <Button
                onClick={() => navigate("/settings#data-sovereignty")}
                size="lg"
                className="flex-1 text-lg py-6 bg-neuro-cyan hover:bg-neuro-cyan/80 text-black font-bold"
              >
                Set Up My Archive
              </Button>
              <Button
                onClick={() => navigate("/dashboard")}
                variant="outline"
                size="lg"
                className="flex-1 text-lg py-6"
              >
                Later
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
