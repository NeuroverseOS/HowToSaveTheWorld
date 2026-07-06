import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminRoute } from "@/components/AdminRoute";
import { DevToolsPanel } from "@/components/debug/DevToolsPanel";
import { UnlockAnimationProvider } from "@/components/neuroverse/UnlockAnimationProvider";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import AdminImportLessons from "./pages/AdminImportLessons";
import ActivateEchelon from "./pages/ActivateEchelon";
import VanguardActivationPage from "./pages/VanguardActivationPage";
import Assessment from "./pages/Assessment";
import ArchetypeRevealPage from "./pages/ArchetypeRevealPage";
import OrientationPage from "./pages/OrientationPage";
import LanguageSelectionPage from "./pages/LanguageSelectionPage";
import MissionList from "./pages/MissionList";
import Lesson from "./pages/Lesson";
import Auth from "./pages/Auth";
import Guide from "./pages/Guide";
import FieldGuide from "./pages/FieldGuide";
import Settings from "./pages/Settings";
import SupabaseSetupGuide from "./pages/SupabaseSetupGuide";
import NotFound from "./pages/NotFound";
import BuildYourOwn from "./pages/BuildYourOwn";
import Educators from "./pages/Educators";
import VanguardLore from "./pages/VanguardLore";
import BackupSetupPage from "./pages/BackupSetupPage";
import SupportMission from "./pages/SupportMission";
import GraduationCinematic from "./pages/GraduationCinematic";
import PhaseCeremony from "./pages/PhaseCeremony";
import SystemsPanel from "./pages/SystemsPanel";
import WorkModePage from "./pages/WorkModePage";
import WorkContextPage from "./pages/WorkContextPage";
import WorkSessionPage from "./pages/WorkSessionPage";
import UnlockPreview from "./pages/UnlockPreview";
import SecurityPage from "./pages/SecurityPage";
import VerifyBuild from "./pages/VerifyBuild";
import OperatorDoctrine from "./pages/OperatorDoctrine";
import SystemInfo from "./pages/SystemInfo";
import FAQ from "./pages/FAQ";

import { initInstallPromptCapture } from "@/lib/install-prompt";
// Capture the browser install prompt as early as possible (one-tap install)
initInstallPromptCapture();

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Force dark mode for NeuroVerse OS
    document.documentElement.classList.add("dark");
  }, []);

  // The Sovereignty Inspector ships in production on purpose: inspecting,
  // exporting, and destroying your own data is a product promise, not a
  // debug tool. (Floating button, bottom-left; Ctrl+Shift+D also toggles.)
  const showDevTools = true;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UnlockAnimationProvider>
          <Toaster />
          <Sonner />
          {showDevTools && <DevToolsPanel />}
          <BrowserRouter>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/sync-to-cloud" element={<Auth />} />
            <Route path="/activate-echelon" element={<ActivateEchelon />} />
            <Route path="/activation" element={<VanguardActivationPage />} />
            <Route path="/language-selection" element={<LanguageSelectionPage />} />
            <Route path="/backup-setup" element={<BackupSetupPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/archetype-reveal" element={<ArchetypeRevealPage />} />
          <Route path="/orientation" element={<OrientationPage />} />
            <Route path="/missions" element={<MissionList />} />
            <Route path="/lesson/:lessonId" element={<Lesson />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/field-guide" element={<FieldGuide />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/systems" element={<SystemsPanel />} />
            <Route path="/support" element={<SupportMission />} />
            <Route path="/graduation-cinematic" element={<GraduationCinematic />} />
            <Route path="/phase-ceremony/:phase" element={<PhaseCeremony />} />
            <Route path="/supabase-setup-guide" element={<SupabaseSetupGuide />} />
            <Route path="/vanguard-lore" element={<VanguardLore />} />
            <Route path="/work" element={<WorkModePage />} />
            <Route path="/work/context" element={<WorkContextPage />} />
            <Route path="/work/session" element={<WorkSessionPage />} />
            <Route path="/unlock-preview" element={<UnlockPreview />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/verify" element={<VerifyBuild />} />
            <Route path="/operator-doctrine" element={<OperatorDoctrine />} />
            <Route path="/system-info" element={<SystemInfo />} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="/admin/import-lessons" element={<AdminRoute><AdminImportLessons /></AdminRoute>} />
            <Route path="/build" element={<BuildYourOwn />} />
            <Route path="/educators" element={<Educators />} />
            <Route path="/faq" element={<FAQ />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </UnlockAnimationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
