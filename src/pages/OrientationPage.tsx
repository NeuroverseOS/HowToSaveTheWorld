import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FoxholeProtocol } from "@/components/neuroverse/FoxholeProtocol";
import { ensureLocalIdentity } from "@/lib/state-engine";
import { isAppAnchored } from "@/lib/pwa-detection";
import { OnboardingProgress } from "@/components/neuroverse/OnboardingProgress";

export default function OrientationPage() {
  const navigate = useNavigate();
  const [callsign, setCallsign] = useState<string | null>(null);

  useEffect(() => {
    // Check PWA installation or bypass
    if (!isAppAnchored()) {
      navigate("/");
      return;
    }

    // Check Vanguard activation
    const state = ensureLocalIdentity();
    if (!state) {
      console.error("Orientation: Failed to ensure state");
      navigate("/");
      return;
    }

    if (!state.user.vanguard.callsign) {
      navigate("/activation");
      return;
    }
    setCallsign(state.user.vanguard.callsign);

    // Check Assessment completion (must happen before orientation)
    if (!state.user.archetype.assessment_complete) {
      navigate("/assessment");
      return;
    }
  }, [navigate]);

  const handleOrientationComplete = () => {
    localStorage.setItem("neuroverse_orientation_complete", "true");
    navigate("/dashboard");
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
      <FoxholeProtocol
        callsign={callsign}
        onComplete={handleOrientationComplete}
      />
    </div>
  );
}
