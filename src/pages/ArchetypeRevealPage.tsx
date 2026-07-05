import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArchetypeReveal } from "@/components/neuroverse/ArchetypeReveal";
import { loadState } from "@/lib/state-engine";
import { isAppAnchored } from "@/lib/pwa-detection";
import { OnboardingProgress } from "@/components/neuroverse/OnboardingProgress";

export default function ArchetypeRevealPage() {
  const navigate = useNavigate();
  const [callsign, setCallsign] = useState<string | null>(null);
  const [archetypes, setArchetypes] = useState<{
    primary: string;
    shadow: string;
    rising: string;
  } | null>(null);

  useEffect(() => {
    // Check PWA installation or bypass
    if (!isAppAnchored()) {
      navigate("/");
      return;
    }

    const state = loadState();
    if (!state) {
      console.error("ArchetypeReveal: Failed to load state");
      navigate("/");
      return;
    }

    // Check Vanguard activation
    if (!state.user.vanguard.callsign) {
      navigate("/activation");
      return;
    }

    // Check Assessment completion
    if (!state.user.archetype.assessment_complete) {
      navigate("/assessment");
      return;
    }

    // Check archetype data exists
    if (!state.user.archetype.primary || !state.user.archetype.shadow || !state.user.archetype.rising) {
      console.error("ArchetypeReveal: Missing archetype data");
      navigate("/assessment");
      return;
    }

    setCallsign(state.user.vanguard.callsign);
    setArchetypes({
      primary: state.user.archetype.primary,
      shadow: state.user.archetype.shadow,
      rising: state.user.archetype.rising,
    });
  }, [navigate]);

  const handleRevealComplete = () => {
    navigate("/orientation");
  };

  if (!callsign || !archetypes) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-neuro-cyan animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OnboardingProgress />
      <ArchetypeReveal
        callsign={callsign}
        primary={archetypes.primary}
        shadow={archetypes.shadow}
        rising={archetypes.rising}
        onComplete={handleRevealComplete}
      />
    </div>
  );
}
