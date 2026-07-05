import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ensureLocalIdentity, saveState, type StateSchema } from "@/lib/state-engine";
import { isAppAnchored } from "@/lib/pwa-detection";
import { getPhaseForCapstoneLesson, getPendingCeremonyPhase, isPhaseAssessmentSealed, PHASE_DEFINITIONS } from "@/lib/phase-assessment";
import { Progress } from "@/components/ui/progress";
import { ViewportDebugPanel } from "@/components/debug/ViewportDebugPanel";
import { LessonRunner } from "@/components/neuroverse/LessonRunner";
import { ArchetypeAssessment } from "@/components/neuroverse/ArchetypeAssessment";
import { Orientation } from "@/components/neuroverse/Orientation";
import { saveReflection, type Lesson } from "@/lib/lesson-queries";
import { getLessonByNumber, getLessonById, forceSupabaseRefresh } from "@/lib/lesson-loader";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { LogOut, HelpCircle, Shield, List, Settings as SettingsIcon, Cpu, Smartphone, BookOpen, Menu, Anchor, FileText, Radio, Heart, ScrollText, FileCode, Scale, Database } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Session } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TransmissionModal } from "@/components/neuroverse/TransmissionModal";

export default function Dashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<StateSchema | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isLoadingLesson, setIsLoadingLesson] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);
  const [hasCompletedOrientation, setHasCompletedOrientation] = useState(false);
  const [archetype, setArchetype] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showTransmissionModal, setShowTransmissionModal] = useState(false);
  const [aiProvider, setAiProvider] = useState<string>("");
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // PHASE 0: Check if running as PWA or bypass is enabled
    const bypassPWA = localStorage.getItem('neuroverse_bypass_pwa') === 'true';
    const pwaInstalled = isAppAnchored();
    setIsPWA(pwaInstalled);

    // Dev bypass: Force fresh load from Supabase
    if (bypassPWA) {
      console.log('[DASHBOARD] Dev bypass detected, forcing Supabase refresh');
      forceSupabaseRefresh().catch(err => console.error('[DASHBOARD] Failed to refresh lessons:', err));
    }

    if (!pwaInstalled) {
      // PWA not installed - redirect to landing page
      navigate("/");
      return;
    }

    // PHASE 1: Check Vanguard activation
    const currentState = ensureLocalIdentity();
    if (!currentState) {
      console.error("Dashboard: Failed to ensure state");
      navigate("/");
      return;
    }
    setState(currentState);

    if (!currentState.user.vanguard.activation_complete) {
      navigate("/activation");
      return;
    }

    // PHASE 2: Check AI connection (must come before assessment)
    const storedProvider = localStorage.getItem("neuroverse_ai_provider") || "openai";
    const apiKey = localStorage.getItem("neuroverse_api_key");
    const ollamaEndpoint = localStorage.getItem("neuroverse_ollama_endpoint");
    const hasAIConnection = (storedProvider === "ollama" && ollamaEndpoint) || (storedProvider !== "ollama" && apiKey);

    if (!hasAIConnection) {
      navigate("/activate-echelon");
      return;
    }
    setAiProvider(storedProvider);

    // PHASE 2.5: Check language selection
    if (!currentState.user.language.selected_at) {
      navigate("/language-selection");
      return;
    }

    // PHASE 2.6: Check backup setup
    if (!currentState.user.backup?.method) {
      navigate("/backup-setup");
      return;
    }

    // PHASE 3: Check Assessment completion
    const hasArchetype = currentState.user.archetype.primary;
    if (!hasArchetype) {
      navigate("/assessment");
      return;
    }
    setArchetype(hasArchetype);
    setHasCompletedAssessment(true);

    // PHASE 4: Check Orientation
    const hasOrientation = localStorage.getItem("neuroverse_orientation_complete");
    if (!hasOrientation) {
      navigate("/orientation");
      return;
    }
    setHasCompletedOrientation(true);

    // PHASE 4.5: Check Graduation Cinematic
    const seenCinematic = localStorage.getItem("neuroverse_seen_cinematic");
    if (currentState.user.vanguard.is_graduated && !seenCinematic) {
      console.log('[DASHBOARD] Graduated but haven\'t seen cinematic - redirecting');
      navigate("/graduation-cinematic");
      return;
    }

    // PHASE 5: All checks passed - ready for lessons
    // Optional: Check for auth session to enable cloud sync features
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkAdminStatus(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!state) return;
    
    const fetchLesson = async () => {
      setIsLoadingLesson(true);
      console.log('[DASHBOARD] Fetching lesson number:', state.progress.current_lesson_id);
      console.log('[DASHBOARD] Current state:', state);
      // current_lesson_id holds a lesson_number (1-96), but older builds
      // stored the database row id — fall back to an id lookup and heal
      // the stored value so progress keeps working.
      let lesson = await getLessonByNumber(state.progress.current_lesson_id);
      if (!lesson) {
        lesson = await getLessonById(state.progress.current_lesson_id);
        if (lesson) {
          const healed = { ...state };
          healed.progress.current_lesson_id = lesson.lesson_number;
          saveState(healed);
        }
      }
      if (lesson) {
        console.log('[DASHBOARD] Lesson loaded successfully:', lesson.lesson_title);
        setCurrentLesson(lesson);
      } else {
        console.error('[DASHBOARD] Lesson not found for number:', state.progress.current_lesson_id);
        toast({
          title: "Lesson Not Found",
          description: "Could not load lesson content.",
          variant: "destructive",
        });
      }
      setIsLoadingLesson(false);
    };

    fetchLesson();
  }, [state?.progress.current_lesson_id]);

  const handleLessonComplete = async (reflection: string) => {
    if (!state || !currentLesson) return;

    setIsSaving(true);
    try {
      // Save reflection to database
      await saveReflection(state.user.id, currentLesson.id, reflection);

      // Update local state
      state.reflections.push({
        lesson_id: state.progress.current_lesson_id,
        timestamp: new Date().toISOString(),
        content: reflection,
        mission_choice: null,
      });

      // Mark lesson as completed
      if (!state.progress.lessons_completed.includes(state.progress.current_lesson_id)) {
        state.progress.lessons_completed.push(state.progress.current_lesson_id);
      }

      // GRADUATION TRIGGER: Check if lesson 90 complete (canonical graduation capstone)
      // Note: TOTAL_MISSIONS is 96, but graduation triggers at lesson 90
      const TOTAL_MISSIONS = 96;
      const completedLessonNumber = state.progress.current_lesson_id;
      const hasCompletedLesson90 = state.progress.lessons_completed.includes(90);
      if (hasCompletedLesson90 && !state.user.vanguard.is_graduated) {
        console.log('[GRADUATION] All missions complete - triggering graduation ceremony');
        state.user.vanguard.is_graduated = true;
        state.user.vanguard.graduation_timestamp = new Date().toISOString();
        saveState(state);
        // Phase ceremony (Command Assessment + Steward conferral) runs first;
        // the Dashboard cinematic redirect takes over once it completes.
        const commandPhase = getPhaseForCapstoneLesson(90);
        if (commandPhase && !isPhaseAssessmentSealed(state, commandPhase)) {
          navigate(`/phase-ceremony/${commandPhase}`);
        } else {
          navigate("/graduation-cinematic");
        }
        return; // Exit early, don't advance to next lesson
      }

      // Check if this is a badge unlock (every 10th lesson)
      const isBadgeUnlock = completedLessonNumber % 10 === 0;

      // PHASE GRADUATION TRIGGER: capstone lessons 30/60 route into the ceremony
      // (replay-safe: sealed assessments never re-run the ceremony)
      const ceremonyPhase = getPhaseForCapstoneLesson(completedLessonNumber);
      if (ceremonyPhase && !isPhaseAssessmentSealed(state, ceremonyPhase)) {
        console.log(`[CEREMONY] Lesson ${completedLessonNumber} complete - entering phase ${ceremonyPhase} ceremony`);
        state.progress.current_lesson_id += 1;
        state.progress.current_section = Math.ceil(state.progress.current_lesson_id / 10);
        saveState(state);
        navigate(`/phase-ceremony/${ceremonyPhase}`);
        return; // Ceremony flow takes over before returning to Dashboard
      }

      // Advance to next lesson
      state.progress.current_lesson_id += 1;
      
      // Update section
      state.progress.current_section = Math.ceil(state.progress.current_lesson_id / 10);

      saveState(state);
      setState({ ...state });

      toast({
        title: "Mission Complete",
        description: "Advancing to next lesson...",
      });

      // Navigate to funding page on badge unlocks (every 10th lesson)
      if (isBadgeUnlock) {
        setTimeout(() => {
          navigate("/support?variant=long");
        }, 1500); // Small delay for toast to show first
      }
    } catch (error) {
      console.error("Error saving progress:", error);
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .single();
      
      setIsAdmin(!!data);
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleAssessmentComplete = (archetypes: { primary: string; shadow: string; rising: string }) => {
    if (!state) return;
    
    // Update state with all three archetypes
    state.user.archetype = {
      primary: archetypes.primary,
      shadow: archetypes.shadow,
      rising: archetypes.rising,
      assessment_complete: true
    };
    
    saveState(state);
    setState({ ...state });
    setArchetype(archetypes.primary);
    setHasCompletedAssessment(true);
  };

  const handleOrientationComplete = () => {
    localStorage.setItem("neuroverse_orientation_complete", "true");
    setHasCompletedOrientation(true);
    
    // Navigate to funding page after archetype reveal
    const hasSeenArchetypeFunding = localStorage.getItem("neuroverse_archetype_funding_shown");
    if (!hasSeenArchetypeFunding) {
      navigate("/support?variant=long");
      localStorage.setItem("neuroverse_archetype_funding_shown", "true");
    }
  };

  // TEST FUNCTION - For graduation system testing
  const testGraduation = () => {
    if (!state) return;
    
    const testState = { ...state };
    // Populate 90 completed missions
    testState.progress.lessons_completed = Array.from({ length: 90 }, (_, i) => i + 1);
    testState.progress.current_lesson_id = 90;
    testState.user.vanguard.is_graduated = true;
    testState.user.vanguard.graduation_timestamp = new Date().toISOString();
    saveState(testState);
    setState(testState);
    
    // Clear cinematic flag so it shows again
    localStorage.removeItem("neuroverse_seen_cinematic");
    
    navigate("/graduation-cinematic");
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-mono text-sm uppercase tracking-[0.2em] text-primary animate-pulse">Initializing NeuroVerse OS...</div>
      </div>
    );
  }

  // Show archetype assessment if not completed
  if (!hasCompletedAssessment) {
    return (
      <ArchetypeAssessment 
        callsign={state.user.vanguard.callsign || undefined}
        onComplete={handleAssessmentComplete} 
      />
    );
  }

  // Show orientation if not completed
  if (!hasCompletedOrientation) {
    return (
      <Orientation
        callsign={state.user.vanguard.callsign || "Operator"}
        onComplete={handleOrientationComplete}
      />
    );
  }

  const lessonId = state.progress.current_lesson_id;
  const sectionId = state.progress.current_section;
  const progressPercent = (state.progress.lessons_completed.length / 96) * 100;
  const currentRank = state.rank?.current || "Recruit";
  const pendingCeremonyPhase = getPendingCeremonyPhase(state);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src="/logo-transparent.png" 
                alt="NeuroVerse OS" 
                className="h-8 w-auto opacity-90 cursor-pointer hover:opacity-100 transition-opacity"
                onClick={() => navigate("/")}
              />
              <div className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-primary">
                {state.user.vanguard.full_identity || "NeuroVerse OS"}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                {isPWA && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="outline" 
                        className="font-mono text-[10px] sm:text-xs tracking-wider px-1.5 py-0 h-5 border-neuro-cyan/50 bg-neuro-cyan/10 text-neuro-cyan hover:bg-neuro-cyan/20 animate-pulse-once cursor-help"
                      >
                        <Anchor className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                        <span className="hidden xs:inline">OS ANCHORED</span>
                        <span className="xs:hidden">ANCHORED</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">NeuroVerse OS is installed as a Progressive Web App</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px] sm:text-xs tracking-wider px-1.5 py-0 h-5 border-neuro-purple/50 bg-neuro-purple/10 text-neuro-purple hover:bg-neuro-purple/20 cursor-help"
                    >
                      <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                      {currentRank.toUpperCase()}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Operator Rank: {currentRank}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="font-mono text-xs sm:text-sm tracking-wide text-muted-foreground shrink-0 cursor-help">
                      S{sectionId} · L{lessonId}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Current Position: Section {sectionId}, Lesson {lessonId}</p>
                  </TooltipContent>
                </Tooltip>
                {aiProvider && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="outline" 
                        className="font-mono text-[10px] sm:text-xs tracking-wider px-1.5 py-0 h-5 border-neuro-orange/30 bg-neuro-orange/5 text-neuro-orange hover:bg-neuro-orange/10 cursor-help"
                      >
                        <Cpu className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                        <span className="hidden xs:inline">
                          {aiProvider === "openai" ? "OpenAI" :
                           aiProvider === "anthropic" ? "Claude" :
                           aiProvider === "google" ? "Gemini" :
                           "Ollama"}
                        </span>
                        <span className="xs:hidden">
                          {aiProvider === "openai" ? "OAI" :
                           aiProvider === "anthropic" ? "CLD" :
                           aiProvider === "google" ? "GEM" :
                           "OLL"}
                        </span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        Echelon AI Provider: {
                          aiProvider === "openai" ? "OpenAI GPT" :
                          aiProvider === "anthropic" ? "Anthropic Claude" :
                          aiProvider === "google" ? "Google Gemini" :
                          "Local Ollama"
                        }
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-neuro-cyan hover:text-neuro-cyan/80">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover/95 backdrop-blur-md border-border/70 shadow-deep z-50">
                  {/* Core Section */}
                  <DropdownMenuItem onClick={() => navigate("/missions")}>
                    <List className="mr-2 h-4 w-4" /> Missions
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/field-guide")}>
                    <BookOpen className="mr-2 h-4 w-4" /> Field Guide
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/work")}>
                    <Cpu className="mr-2 h-4 w-4" /> Work Mode
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowTransmissionModal(true)}>
                    <Radio className="mr-2 h-4 w-4" /> Send Transmission
                  </DropdownMenuItem>
                  
                  {/* System Knowledge Section */}
                  <DropdownMenuSeparator className="my-1.5 bg-border/70" />
                  <DropdownMenuLabel className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    SYSTEM KNOWLEDGE
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => navigate("/system-info")}>
                    <Database className="mr-2 h-4 w-4" /> System Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/operator-doctrine")}>
                    <Scale className="mr-2 h-4 w-4" /> Operator Doctrine
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/security")}>
                    <Shield className="mr-2 h-4 w-4" /> Security
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/verify")}>
                    <FileCode className="mr-2 h-4 w-4" /> Verify Build
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/vanguard-lore")} className="text-neuro-orange hover:text-neuro-orange/80">
                    <FileText className="mr-2 h-4 w-4" /> Classified
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <SettingsIcon className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Shield className="mr-2 h-4 w-4" /> Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate("/guide")}>
                    <HelpCircle className="mr-2 h-4 w-4" /> Help &amp; Guide
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/faq")}>
                    <Smartphone className="mr-2 h-4 w-4" /> Questions &amp; Answers
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1.5 bg-border/70" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem onClick={() => navigate("/support")} className="text-primary hover:text-primary/80">
                        <Heart className="mr-2 h-4 w-4" /> 
                        <span>Support Mission</span>
                        <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 h-4 border-primary/30 bg-primary/5 text-primary">
                          Optional
                        </Badge>
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="text-xs">
                        Help maintain NeuroVerse as a free, sovereign, human-first OS. 
                        Your contribution funds decentralized infrastructure and keeps this system independent.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  {session && (
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" /> Logout
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* DEV TEST PANEL - development builds only */}
      {import.meta.env.DEV && (
        <div className="container mx-auto px-3 sm:px-4 py-3 max-w-4xl">
          <Alert className="border-amber-500 bg-amber-500/10">
            <AlertTitle className="text-amber-500 font-bold">🧪 DEV TEST MODE</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-4">
              <span className="text-sm">Test the graduation system with 90 completed missions</span>
              <Button
                onClick={testGraduation}
                variant="outline"
                size="sm"
                className="border-amber-500 text-amber-500 hover:bg-amber-500/20"
              >
                Trigger Graduation
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 md:py-6 max-w-4xl pb-safe">
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Pending Phase Ceremony (re-entry is always available until sealed) */}
          {pendingCeremonyPhase && (
            <Card className="p-4 bg-neuro-cyan/10 border-neuro-cyan/40">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-neuro-cyan mb-1">PHASE GRADUATION PENDING</div>
                  <div className="text-sm font-medium text-foreground">
                    Your {PHASE_DEFINITIONS[pendingCeremonyPhase].assessmentName} awaits your seal, Operator.
                  </div>
                </div>
                <Button variant="outline" size="sm" className="border-neuro-cyan/50 text-neuro-cyan hover:bg-neuro-cyan/10 shrink-0" onClick={() => navigate(`/phase-ceremony/${pendingCeremonyPhase}`)}>
                  Enter Ceremony
                </Button>
              </div>
            </Card>
          )}

          {/* Post-Graduation Dyad Objective */}
          {state.user.vanguard.is_graduated && state.user.vanguard.post_foxhole_objective && (
            <Card className="p-4 bg-neuro-purple/10 border-neuro-purple/40">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-neuro-purple mb-1">DYAD OBJECTIVE</div>
                  <div className="text-sm font-medium text-foreground">{state.user.vanguard.post_foxhole_objective}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/graduation-cinematic")}>
                  Change
                </Button>
              </div>
            </Card>
          )}
          
          {/* Progress Bar */}
          <Card className="p-3 sm:p-4 md:p-6 bg-card/60 backdrop-blur-sm border-border/70">
            <div className="space-y-2 sm:space-y-2.5 w-full">
              <div className="flex justify-between items-baseline text-xs sm:text-sm gap-2 flex-wrap">
                <span className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.15em] text-muted-foreground">Overall Progress</span>
                <span className="font-mono tabular-nums text-foreground font-medium">
                  {state.progress.lessons_completed.length} / 96
                </span>
              </div>
              <Progress value={progressPercent} className="h-2 w-full" />
            </div>
          </Card>

          {/* Lesson Runner - Conversational Experience */}
          {isLoadingLesson ? (
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border">
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </Card>
          ) : currentLesson && state ? (
            <LessonRunner
              lesson={currentLesson}
              userId={state.user.id}
              state={state}
              onLessonComplete={handleLessonComplete}
            />
          ) : (
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Lesson not found</p>
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* Viewport Debug Panel */}
      {import.meta.env.DEV && <ViewportDebugPanel />}

      {/* Transmission Modal */}
      <TransmissionModal
        open={showTransmissionModal}
        onOpenChange={setShowTransmissionModal}
        callsign={state.user.vanguard.callsign || "UNKNOWN"}
      />
    </div>
  );
}