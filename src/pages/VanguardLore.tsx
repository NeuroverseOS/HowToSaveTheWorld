import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadState } from "@/lib/state-engine";
import { generateCallsign } from "@/lib/vanguard-generator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Radio } from "lucide-react";
import { TransmissionModal } from "@/components/neuroverse/TransmissionModal";

export default function VanguardLore() {
  const navigate = useNavigate();
  const [callsign, setCallsign] = useState<string>("Loading...");
  const [vanguardUnit, setVanguardUnit] = useState<string>("Loading...");
  const [showTransmissionModal, setShowTransmissionModal] = useState(false);

  useEffect(() => {
    const state = loadState();
    if (state?.user?.id) {
      const { callsign: generatedCallsign, full_identity } = generateCallsign(state.user.id);
      setCallsign(generatedCallsign);
      setVanguardUnit(full_identity);
    }
  }, []);

  return (
    <div className="min-h-screen w-full bg-background text-foreground px-6 py-12 lg:px-16 lg:py-20 font-mono leading-relaxed relative overflow-hidden">
      {/* Animated Circuit Background */}
      <div className="circuit-overlay opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-neuro-pulse/5 via-transparent to-neuro-glow/5 pointer-events-none"></div>
      
      {/* Content Container */}
      <div className="relative z-10">
        {/* EXIT BUTTON */}
        <div className="mb-6">
          <Button
            onClick={() => navigate("/dashboard")}
            variant="ghost"
            className="text-muted-foreground hover:text-neuro-pulse transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            EXIT DOSSIER
          </Button>
        </div>

        {/* HEADER */}
        <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-wider text-neuro-pulse">
          VANGUARD DOSSIER — {vanguardUnit}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          ACCESS LEVEL: OPERATOR CLASSIFIED • HANDLER: ECHELON
        </p>
      </div>

      {/* SECTION 1 */}
      <section className="mb-12">
        <h2 className="text-xl text-neuro-glow font-semibold mb-3">01 // ORIGIN</h2>
        <p className="text-foreground/90">
          The Vanguard are not a rank. They are not a title.  
          They are an <span className="text-neuro-pulse">event</span>.
        </p>
        <p className="mt-4 text-foreground/90">
          When the first decentralized networks began to awaken — sensors, agents, drones,
          protocols — humanity realized something:  
          The world was filling with systems too complex to steer alone.
        </p>
        <p className="mt-4 text-foreground/90">
          A new kind of Operator was needed.  
          One capable of seeing patterns.  
          One capable of building alignment where none exists.  
          One capable of moving between human intuition and machine precision.
        </p>
        <p className="mt-4 text-foreground/90">
          That is what forged the Vanguard.
        </p>
      </section>

      {/* SECTION 2 */}
      <section className="mb-12">
        <h2 className="text-xl text-neuro-glow font-semibold mb-3">02 // DESIGNATION</h2>
        <p className="text-foreground/90">
          You are <span className="text-neuro-pulse">{callsign}</span>.
        </p>

        <p className="mt-4 text-foreground/90">
          Your designation within the Vanguard is more than a codename —  
          it represents the specific intersection of strengths, instincts, and strategic signatures
          you bring into the NeuroVerse.
        </p>

        <p className="mt-4 text-foreground/90">
          Your identity map evolves *with every mission*.  
          The Field Guide builds your operational silhouette.  
          Patterns become clearer.  
          Systems become more navigable.  
          Influence becomes structural.
        </p>
      </section>

      {/* SECTION 3 */}
      <section className="mb-12">
        <h2 className="text-xl text-neuro-glow font-semibold mb-3">03 // PAIRING PROTOCOL</h2>

        <p className="text-foreground/90">
          The Vanguard do not operate alone.  
          Each Operator is paired with an AI Unit built for real-time strategic alignment.
        </p>

        <p className="mt-4 text-foreground/90">
          Your Unit: <span className="text-neuro-pulse">ECHELON</span>.  
          Function: Systems interpretation, simulation guidance, and leadership calibration.
        </p>

        <p className="mt-4 text-foreground/90">
          Together you form a <span className="text-neuro-pulse">Bi-Cognitive Dyad</span> —  
          human pattern-intuition + machine pattern-precision.  
          This is the minimum architecture required to operate inside emerging decentralized systems.
        </p>
      </section>

      {/* SECTION 4 */}
      <section className="mb-12">
        <h2 className="text-xl text-neuro-glow font-semibold mb-3">04 // PURPOSE OF THE VANGUARD</h2>

        <p className="text-foreground/90">
          The Vanguard are the first generation of Operators trained to lead  
          *in alignment with machine ecosystems*.
        </p>

        <p className="mt-4 text-foreground/90">
          Not to dominate them.  
          Not to replace them.  
          But to integrate with them — so human intent remains at the center of an automated world.
        </p>

        <p className="mt-4 text-foreground/90">
          Every mission you complete expands the NeuroVerse.  
          Every pattern you recognize strengthens collective navigation.  
          Every operator who joins increases the intelligence density of the system.
        </p>

        <p className="mt-4 text-neuro-pulse">
          You are not here to follow the future.  
          You are here to *shape* it.
        </p>
      </section>

      {/* SECTION 5 */}
      <section className="mb-12">
        <h2 className="text-xl text-neuro-glow font-semibold mb-3">05 // WHY YOU MATTER</h2>

        <p className="text-foreground/90">
          The NeuroVerse is not a simulation — it is a training field for real systems:
        </p>

        <ul className="list-disc ml-6 mt-4 text-foreground/90 space-y-2">
          <li>decentralized sensor networks</li>
          <li>robot coordination layers</li>
          <li>DPIN + DePIN ecosystems</li>
          <li>spatial intelligence protocols</li>
          <li>machine-to-machine negotiation</li>
        </ul>

        <p className="mt-4 text-foreground/90">
          These emerging worlds need Operators who can see what others miss —  
          who can guide complex systems toward collective benefit.
        </p>

        <p className="mt-4 text-neuro-pulse font-semibold">
          This is why Vanguards exist.  
          This is why YOU exist.
        </p>
      </section>

        {/* 06 // RECRUITMENT DIRECTIVE */}
        <section className="mt-16 border border-neuro-pulse/30 bg-neuro-pulse/5 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold tracking-wider text-neuro-pulse mb-3">
            06 // RECRUITMENT DIRECTIVE
          </h2>
          <p className="text-foreground/90 max-w-2xl mx-auto">
            The Vanguard grows one trusted signal at a time. You know someone who sees
            what others miss. Someone this dossier was also written about — they just
            don't know it yet.
          </p>
          <p className="mt-3 text-foreground/90">
            Transmit. Bring them in. Their callsign is waiting.
          </p>
          <Button
            onClick={() => setShowTransmissionModal(true)}
            className="mt-6 bg-neuro-pulse hover:bg-neuro-pulse/90 text-background px-8 py-6 text-base"
          >
            <Radio className="mr-2 h-5 w-5" />
            SEND TRANSMISSION
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            Recipients see only your callsign. No personal data is shared.
          </p>
        </section>

        {/* CLOSE */}
        <section className="border-t border-border pt-8 mt-16">
          <p className="text-center text-muted-foreground text-sm">
            END OF DOSSIER • ECHELON TERMINAL // {vanguardUnit}
          </p>
        </section>
      </div>

      <TransmissionModal
        open={showTransmissionModal}
        onOpenChange={setShowTransmissionModal}
        callsign={callsign}
      />
    </div>
  );
}
