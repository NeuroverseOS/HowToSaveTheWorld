import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArchetypeAssessment } from "@/components/neuroverse/ArchetypeAssessment";
import { ensureLocalIdentity, saveState } from "@/lib/state-engine";
import { isAppAnchored } from "@/lib/pwa-detection";
import { generateCallsign } from "@/lib/vanguard-generator";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { OnboardingProgress } from "@/components/neuroverse/OnboardingProgress";

export default function Assessment() {
  const navigate = useNavigate();
  const [callsign, setCallsign] = useState<string | null>(null);

  useEffect(() => {
    // Check PWA installation or bypass
    if (!isAppAnchored()) {
      navigate("/");
      return;
    }

    // Check backup configuration (must happen before assessment)
    const state = ensureLocalIdentity();
    if (!state) {
      console.error("Assessment: Failed to ensure state");
      navigate("/");
      return;
    }

    if (!state.user.backup?.configured_at) {
      navigate("/backup-setup");
      return;
    }

    // Generate callsign for display if not already set
    if (!state.user.vanguard.callsign) {
      const { callsign: generatedCallsign } = generateCallsign(state.user.id);
      setCallsign(generatedCallsign);
    } else {
      setCallsign(state.user.vanguard.callsign);
    }
  }, [navigate]);

  const handleAssessmentComplete = (archetypes: { primary: string; shadow: string; rising: string }) => {
    const state = ensureLocalIdentity();
    if (!state) {
      console.error("Assessment: Failed to ensure state on completion");
      return;
    }

    // Generate and assign callsign NOW (after AI connection and during assessment)
    const { callsign: generatedCallsign, full_identity } = generateCallsign(state.user.id);
    
    // Update vanguard with callsign
    state.user.vanguard.callsign = generatedCallsign;
    state.user.vanguard.full_identity = full_identity;
    state.user.vanguard.assigned_at = new Date().toISOString();

    // Update state with archetypes
    state.user.archetype = {
      primary: archetypes.primary,
      shadow: archetypes.shadow,
      rising: archetypes.rising,
      assessment_complete: true,
    };

    saveState(state);

    toast({
      title: "Assessment Complete",
      description: "Your archetype triad has been mapped.",
    });

    // Navigate to Archetype Reveal
    navigate("/archetype-reveal");
  };

  if (!callsign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-neuro-cyan animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OnboardingProgress />
      {/* Header with Back Button */}
      <div className="p-4 border-b border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <ArchetypeAssessment
        callsign={callsign}
        onComplete={handleAssessmentComplete}
      />
    </div>
  );
}
