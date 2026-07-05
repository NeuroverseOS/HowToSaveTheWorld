import { useLocation } from "react-router-dom";

export interface OnboardingStep {
  step: number;
  totalSteps: number;
  label: string;
  route: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  { step: 1, totalSteps: 9, label: "PWA Install", route: "/" },
  { step: 2, totalSteps: 9, label: "AI Connection", route: "/activate-echelon" },
  { step: 3, totalSteps: 9, label: "Vanguard Activation", route: "/activation" },
  { step: 4, totalSteps: 9, label: "Language Selection", route: "/language-selection" },
  { step: 5, totalSteps: 9, label: "Backup Configuration", route: "/backup-setup" },
  { step: 6, totalSteps: 9, label: "Archetype Assessment", route: "/assessment" },
  { step: 7, totalSteps: 9, label: "Archetype Reveal", route: "/archetype-reveal" },
  { step: 8, totalSteps: 9, label: "Foxhole Protocol", route: "/orientation" },
  { step: 9, totalSteps: 9, label: "Mission Deployment", route: "/dashboard" },
];

export function useOnboardingStep(): OnboardingStep | null {
  const location = useLocation();
  
  const currentStep = ONBOARDING_STEPS.find(
    (step) => step.route === location.pathname
  );
  
  return currentStep || null;
}
