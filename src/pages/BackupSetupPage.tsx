import { useNavigate } from "react-router-dom";
import { BackupSetup } from "@/components/neuroverse/BackupSetup";
import { ensureLocalIdentity, saveState } from "@/lib/state-engine";
import { OnboardingProgress } from "@/components/neuroverse/OnboardingProgress";

export default function BackupSetupPage() {
  const navigate = useNavigate();

  const handleComplete = (backupChoice: 'manual' | 'cloud' | 'declined') => {
    const state = ensureLocalIdentity();
    if (!state) {
      console.error("BackupSetup: Failed to ensure state");
      navigate("/");
      return;
    }

    // Update state with backup preference
    state.user.backup = {
      method: backupChoice,
      configured_at: new Date().toISOString(),
      last_export_at: null,
    };

    saveState(state);

    // Continue to assessment
    navigate("/assessment");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OnboardingProgress />
      <BackupSetup onComplete={handleComplete} />
    </div>
  );
}
