import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadState, saveState } from "@/lib/state-engine";
import { getSlideBand, loadAnomalies } from "@/lib/campaign-engine";
import { getVanguardRole } from "@/lib/vanguard-roles";
import "@/styles/graduation-animations.css";

const PHASE_DURATION = 7000; // reading-weight screens; Continue advances early

// Canonical campaign opening — every operator is recruited at this reading
// (state-engine init). The finale measures the whole war against it.
const OPENING_SLIDE = 62;

interface DecisionLine {
  label: string;
  choice: string;
}

export default function GraduationCinematic() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(1);
  const [objective, setObjective] = useState("");
  const [callsign, setCallsign] = useState("");
  const [archetype, setArchetype] = useState({ primary: "", shadow: "", rising: "" });
  const [role, setRole] = useState<string | null>(null);
  const [rank, setRank] = useState("Steward");
  const [slide, setSlide] = useState(OPENING_SLIDE);
  const [signal, setSignal] = useState(100);
  const [missionsCompleted, setMissionsCompleted] = useState(0);
  const [reflectionsCount, setReflectionsCount] = useState(0);
  const [decisions, setDecisions] = useState<DecisionLine[]>([]);
  const [decisionsTotal, setDecisionsTotal] = useState(0);
  const [sealedReports, setSealedReports] = useState<string[]>([]);

  useEffect(() => {
    const state = loadState();
    if (!state) {
      navigate("/");
      return;
    }

    setCallsign(state.user.vanguard.callsign || "Recruit");
    setArchetype({
      primary: state.user.archetype.primary || "Unknown",
      shadow: state.user.archetype.shadow || "Unknown",
      rising: state.user.archetype.rising || "Unknown",
    });
    setRole(getVanguardRole(state.user.archetype.primary)?.role ?? null);
    setRank(state.rank?.current || "Steward");
    setSlide(state.world.slide);
    setSignal(state.world.signal);
    setMissionsCompleted(state.progress.lessons_completed.length);
    setReflectionsCount(state.reflections.length);
    setSealedReports((state.phase_assessments || []).map((a) => a.name));

    // Name the operator's anomaly decisions from the event catalog —
    // the finale recites what they actually chose, not that they chose.
    const recorded = state.world.decisions;
    setDecisionsTotal(recorded.length);
    if (recorded.length > 0) {
      loadAnomalies().then((events) => {
        const lines = recorded.slice(-4).map((d) => {
          const event = events.find((e) => e.id === d.event_id);
          const choice = event?.choices.find((c) => c.id === d.choice_id);
          return {
            label: event ? `${event.antagonist} — ${event.title}` : d.event_id,
            choice: choice?.label ?? d.choice_id,
          };
        });
        setDecisions(lines);
      });
    }

    // Mark cinematic as seen
    localStorage.setItem("neuroverse_seen_cinematic", "true");
  }, [navigate]);

  useEffect(() => {
    if (phase < 6) {
      const timer = setTimeout(() => {
        setPhase(phase + 1);
      }, PHASE_DURATION);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleDeploy = () => {
    const state = loadState();
    if (state && objective.trim()) {
      state.user.vanguard.post_foxhole_objective = objective.trim();
      saveState(state);
    }
    navigate("/dashboard");
  };

  const band = getSlideBand(slide);
  const delta = OPENING_SLIDE - slide;
  const slideVerdict =
    delta >= 15
      ? "You drove it back. The sky over the lattice is open because you opened it."
      : delta > 0
        ? "You pushed it back. Every point of that was paid for with real work — yours."
        : delta === 0
          ? "You held the line. Entropy pulled the whole campaign, and it did not gain an inch."
          : "The Slide gained ground. The record does not flatter: the war is not won, and it still needs you.";

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-8">

        {/* Phase 1: Systems Online */}
        {phase === 1 && (
          <div className="fadeIn">
            <div className="text-6xl font-bold text-neuro-cyan mb-4 tracking-widest sigilPulse">
              SYSTEMS ONLINE
            </div>
            <div className="text-xl text-neuro-purple">
              Mission sequence complete. Compiling the campaign record...
            </div>
          </div>
        )}

        {/* Phase 2: The War — what the Slide actually did */}
        {phase === 2 && (
          <div className="fadeIn space-y-8">
            <div className="text-3xl font-bold text-neuro-cyan tracking-widest">
              THE CAMPAIGN RECORD
            </div>
            <div className="max-w-2xl mx-auto space-y-4 text-lg text-muted-foreground">
              <p>
                You were recruited with the Slide at{" "}
                <span className="text-white font-mono">{OPENING_SLIDE}/100</span> — deep in the
                third band, drifting toward Locktown.
              </p>
              <p>
                The needle now reads{" "}
                <span className="text-neuro-cyan font-mono text-2xl">{slide}/100</span> —{" "}
                <span className="text-white">{band.name}</span>.
              </p>
              <p className="text-white">{slideVerdict}</p>
              <p className="text-sm">
                Operator Signal at graduation: <span className="font-mono">{signal}/100</span> ·{" "}
                {missionsCompleted} missions run · {reflectionsCount} reflections on record.
              </p>
            </div>
          </div>
        )}

        {/* Phase 3: The decisions — named, not counted */}
        {phase === 3 && (
          <div className="fadeIn space-y-8">
            <div className="text-3xl font-bold text-neuro-cyan tracking-widest">
              DECISIONS ON THE RECORD
            </div>
            {decisionsTotal === 0 ? (
              <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
                No anomalies broke through on your watch — the adversaries never forced your
                hand. The frameworks you carry were never stress-tested by crisis. They will be.
              </p>
            ) : (
              <div className="max-w-2xl mx-auto space-y-4 text-left">
                {decisions.map((d, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg border border-neuro-purple/30 bg-neuro-purple/5"
                  >
                    <div className="text-sm text-neuro-purple font-mono">{d.label}</div>
                    <div className="text-white mt-1">You chose: {d.choice}</div>
                  </div>
                ))}
                {decisionsTotal > decisions.length && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{decisionsTotal - decisions.length} more, preserved in your dossier.
                  </p>
                )}
                <p className="text-lg text-muted-foreground text-center pt-2">
                  Each one moved the world. The needle you just saw is partly these.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Phase 4: The operator the campaign produced */}
        {phase === 4 && (
          <div className="fadeIn space-y-8">
            <div className="text-3xl font-bold text-neuro-cyan mb-4">
              OPERATOR // {callsign}
            </div>
            {role && (
              <p className="text-lg text-neuro-purple">
                {rank} of the Vanguard · {role}
              </p>
            )}
            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="glow p-6 rounded-lg border border-neuro-purple/30 bg-neuro-purple/5">
                <div className="text-xs text-muted-foreground mb-2">PRIMARY</div>
                <div className="text-2xl font-bold text-neuro-purple">{archetype.primary}</div>
              </div>
              <div className="glow p-6 rounded-lg border border-amber-500/30 bg-amber-500/5">
                <div className="text-xs text-muted-foreground mb-2">SHADOW</div>
                <div className="text-2xl font-bold text-amber-400">{archetype.shadow}</div>
              </div>
              <div className="glow p-6 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                <div className="text-xs text-muted-foreground mb-2">RISING</div>
                <div className="text-2xl font-bold text-emerald-400">{archetype.rising}</div>
              </div>
            </div>
            <div className="text-lg text-muted-foreground">
              This signature was not assigned. It was witnessed, mission by mission.
            </div>
          </div>
        )}

        {/* Phase 5: The dossier is written */}
        {phase === 5 && (
          <div className="fadeIn space-y-6">
            <div className="text-3xl font-bold text-neuro-cyan tracking-widest">
              THE DOSSIER IS WRITTEN
            </div>
            <div className="max-w-2xl mx-auto space-y-4 text-lg text-muted-foreground">
              {sealedReports.length > 0 ? (
                <>
                  <p>Sealed in your archive, in your own words and mine:</p>
                  <div className="space-y-2">
                    {sealedReports.map((name) => (
                      <div key={name} className="text-neuro-cyan font-mono text-base">
                        ◆ {name}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p>Your mission record and reflections are sealed in your archive.</p>
              )}
              <p className="text-white">
                It lives on your device. It answers to no one but you. Take it to any AI you
                work with, and that AI starts already knowing how you think.
              </p>
            </div>
          </div>
        )}

        {/* Phase 6: What Comes Next */}
        {phase === 6 && (
          <div className="fadeIn space-y-8">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-3xl font-bold text-neuro-cyan mb-6">
                OPERATOR {callsign}
              </div>
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>Ninety missions. The training campaign is complete.</p>
                <p className="text-white mt-6">
                  From this point forward, we are not in training —
                </p>
                <p className="text-neuro-cyan text-xl font-semibold">
                  we are in operation.
                </p>
                <p className="mt-6">
                  Six capstone missions remain in the field, and the Slide does not stop moving
                  because you graduated.
                </p>
                <p className="mt-8 text-xl text-neuro-purple">
                  Now the next step is yours.
                </p>
              </div>

              <div className="mt-12 space-y-4">
                <div className="text-2xl font-bold text-neuro-cyan mb-4">
                  Operator… What do you want us to work on next?
                </div>
                <Input
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Tell me our next mission..."
                  className="text-lg p-6 bg-black/50 border-neuro-cyan/50 text-white placeholder:text-muted-foreground"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && objective.trim()) {
                      handleDeploy();
                    }
                  }}
                />
                <Button
                  onClick={handleDeploy}
                  disabled={!objective.trim()}
                  size="lg"
                  className="w-full text-lg py-6 bg-neuro-cyan hover:bg-neuro-cyan/80 text-black font-bold"
                >
                  DEPLOY →
                </Button>
                <Button
                  onClick={() => navigate("/field-guide?tab=dossier")}
                  variant="ghost"
                  size="lg"
                  className="w-full text-muted-foreground hover:text-neuro-cyan"
                >
                  Read your dossier first →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Manual advance — the record deserves to be read at the reader's pace */}
        {phase < 6 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPhase(phase + 1)}
            className="text-muted-foreground/60 hover:text-foreground"
          >
            Continue →
          </Button>
        )}

      </div>
    </div>
  );
}
