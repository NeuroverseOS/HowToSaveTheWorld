import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageSelection } from "@/components/neuroverse/LanguageSelection";
import { ensureLocalIdentity, saveState } from "@/lib/state-engine";
import { isAppAnchored } from "@/lib/pwa-detection";
import { toast } from "@/hooks/use-toast";
import { OnboardingProgress } from "@/components/neuroverse/OnboardingProgress";

export default function LanguageSelectionPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check prerequisites
    if (!isAppAnchored()) {
      navigate("/");
      return;
    }

    const state = ensureLocalIdentity();
    if (!state) {
      console.error("LanguageSelection: Failed to ensure state");
      navigate("/");
      return;
    }

    if (!state.user.vanguard.activation_complete) {
      navigate("/activation");
      return;
    }

    // Check AI connection
    const aiProvider = localStorage.getItem("neuroverse_ai_provider");
    const apiKey = localStorage.getItem("neuroverse_api_key");
    const ollamaEndpoint = localStorage.getItem("neuroverse_ollama_endpoint");

    if (!aiProvider || (aiProvider !== "ollama" && !apiKey) || (aiProvider === "ollama" && !ollamaEndpoint)) {
      navigate("/activate-echelon");
      return;
    }
  }, [navigate]);

  const handleLanguageSelect = (code: string, name: string) => {
    const state = ensureLocalIdentity();
    if (!state) {
      toast({
        title: "Error",
        description: "Failed to initialize state. Please restart.",
        variant: "destructive",
      });
      return;
    }

    // Update language in state
    state.user.language = {
      code,
      name,
      selected_at: new Date().toISOString(),
    };
    saveState(state);

    toast({
      title: "Language Locked",
      description: `Linguistic preference set to ${name}`,
    });

    // Navigate to backup setup
    setTimeout(() => {
      navigate("/backup-setup");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OnboardingProgress />
      <LanguageSelection onLanguageSelect={handleLanguageSelect} />
    </div>
  );
}
