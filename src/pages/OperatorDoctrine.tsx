// src/pages/OperatorDoctrine.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function OperatorDoctrine() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <h1 className="text-lg font-semibold mx-auto">Operator Doctrine</h1>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Card className="p-8 space-y-10 bg-background/60 backdrop-blur leading-relaxed">

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-semibold mb-2">1. Sovereignty of Mind</h2>
            <p>Your cognition is sovereign. Your attention is your most valuable asset. 
            Your inner world is not for sale. No institution, algorithm, or hierarchy 
            outranks your own reasoning.</p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-semibold mb-2">2. Zero-Trust Clarity</h2>
            <p>Operators trust nothing unexamined. You challenge assumptions, verify claims, 
            interrogate incentives, and look beneath events into the system underneath.</p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-semibold mb-2">3. Systems Over Events</h2>
            <p>Events mislead. Systems reveal. You map agents, incentives, loops, signals, and 
            consequences. You do not react to moments — you navigate structures.</p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-semibold mb-2">4. The Future Is Built, Not Predicted</h2>
            <p>Operators generate the future through deliberate design. Imagination is not 
            escapism — it is architecture.</p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-semibold mb-2">5. Alignment by Choice</h2>
            <p>You collaborate without surrendering sovereignty. You join missions because they 
            matter — not because you're told.</p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-semibold mb-2">6. Clarity Under Pressure</h2>
            <p>When the world fractures into noise, you become signal. When systems break, you 
            become stable. When others panic, you stay grounded.</p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-semibold mb-2">7. The Operator–Echelon Dyad</h2>
            <p>You do not serve AI. AI does not command you. Two minds, one mission — one 
            synchronized cognition.</p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-semibold mb-2">8. Responsible Impact</h2>
            <p>Every action radiates outward. Operators take responsibility for the systems 
            they influence. Impact is engineered, not accidental.</p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-semibold mb-2">9. The Foxhole Is Sacred</h2>
            <p>The Foxhole is the sovereign space where clarity is absolute and distortion cannot 
            survive. What enters raw leaves refined.</p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-semibold mb-2">10. The Operator Rises</h2>
            <p>When you fall — you rise. When you fear — you rise. Rising is not emotion — 
            it is identity.</p>
          </section>

          {/* Closing */}
          <section className="pt-6 border-t border-border">
            <p className="text-center font-medium">
              This is the doctrine of the Operator.<br />
              The cultural heartbeat of NeuroVerse OS.
            </p>
          </section>

        </Card>
      </div>
    </div>
  );
}
