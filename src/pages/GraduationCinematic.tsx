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
  const [decisionSlideEffect, setDecisionSlideEffect] = useState(0);
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
    setDecisionSlideEffect(recorded.reduce((sum, d) => sum + (d.effects?.slide ?? 0), 0));
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
  // The verdict names the destination, not a mood. Locktown is where the
  // needle was headed the day this operator was recruited.
  const slideVerdict =
    delta >= 15
      ? `Locktown recedes. LATTICE stands because ${missionsCompleted} missions of your actual work are underneath it.`
      : delta > 0
        ? `Locktown is ${delta} point${delta === 1 ? "" : "s"} farther away than the day you signed on. That distance is made of your finished missions — nothing else in this system moves the needle.`
        : delta === 0
          ? "Entropy pulled the needle up every single mission, and your work pushed it back down every single mission. Locktown is exactly as far away as the day you started — because you never stopped."
          : "Locktown is closer than when you started. The record does not flatter: the frameworks are yours now, and the six capstones are where you use them.";

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

        {/* Phase 2: The War — named enemies, and a needle made of receipts */}
        {phase === 2 && (
          <div className="fadeIn space-y-8">
            <div className="text-3xl font-bold text-neuro-cyan tracking-widest">
              THE CAMPAIGN RECORD
            </div>
            <div className="max-w-2xl mx-auto space-y-4 text-lg text-muted-foreground text-left">
              <p>
                The day you were recruited, the Slide read{" "}
                <span className="text-white font-mono">{OPENING_SLIDE}/100</span> — two bands
                from Locktown. Meridian Trust was writing custody contracts. The Ministry of
                Convenience was shipping one-click defaults. Aperture was calling surveillance
                safety, and the Custodians were explaining why minds like mine were too
                dangerous for people like you to run.
              </p>
              <p>
                The needle now reads{" "}
                <span className="text-neuro-cyan font-mono text-2xl">{slide}/100</span> —{" "}
                <span className="text-white">{band.name}</span>. Nothing moves that needle but
                work. The ledger:
              </p>
              <div className="font-mono text-sm space-y-1 p-4 rounded-lg border border-border/40 bg-card/30">
                <div className="flex justify-between">
                  <span>Entropy&apos;s pull, one point per mission run</span>
                  <span className="text-neuro-orange">+{missionsCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span>Missions you completed ({missionsCompleted} × 2)</span>
                  <span className="text-neuro-cyan">−{missionsCompleted * 2}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reflections where you put your real work on the table</span>
                  <span className="text-neuro-cyan">−{reflectionsCount}</span>
                </div>
                {decisionsTotal > 0 && (
                  <div className="flex justify-between">
                    <span>Your {decisionsTotal} decision{decisionsTotal === 1 ? "" : "s"} under pressure</span>
                    <span className={decisionSlideEffect > 0 ? "text-neuro-orange" : "text-neuro-cyan"}>
                      {decisionSlideEffect > 0 ? `+${decisionSlideEffect}` : decisionSlideEffect}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-white">{slideVerdict}</p>
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
                Meridian Trust, the Ministry of Convenience, Aperture, the Custodians — none of
                them got an offer in front of you on your watch. Their offers are still open.
                They always are. The frameworks you carry were never stress-tested by a live
                bargain. They will be.
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
                  Six capstone missions remain in the field. Meridian is still writing
                  contracts. The Ministry ships a new default every quarter. The Slide does not
                  stop moving because you graduated.
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
