import { useState, useEffect, useRef } from "react";
import { renderEmphasis } from "@/lib/render-emphasis";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase, getEdgeFunctionUrl, ACTIVE_SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { streamEchelonDirect } from "@/lib/echelon-direct";
import { VoiceRecorder } from "@/components/neuroverse/VoiceRecorder";
import { VideoPlayer } from "@/components/neuroverse/VideoPlayer";
import ReflectionMode from "@/components/neuroverse/ReflectionMode";
import { StandardReflection, MicroInsight, ExerciseReflection } from "@/components/neuroverse/reflection";
import type { Lesson } from "@/lib/lesson-queries";
import type { StateSchema } from "@/lib/state-engine";
import { MissionStage } from "@/lib/state-engine";
import { Loader2, CheckCircle2, RefreshCw, Share2, Download, RotateCcw, ChevronLeft } from "lucide-react";
import { clearLessonCache } from "@/lib/echelon-store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TransmissionModal } from "@/components/neuroverse/TransmissionModal";
import { EchelonAudioToggle } from "@/components/EchelonAudioToggle";
import { saveState } from "@/lib/state-engine";
import { useMissionProgress } from "@/hooks/useMissionProgress";
import { analyzeAndUnlockTraits, generateFieldGuideEntry } from "@/lib/trait-unlock-engine";
import { compileMissionLog, generateEchelonRead } from "@/lib/field-guide-engine";
import { attachEchelonRead, type MissionLogEntry } from "@/lib/mission-log";
import { getReflectionEntries } from "@/lib/reflection-storage";
import {
  rollAnomalyEvent,
  resolveAnomaly,
  applyMissionCompletion,
  buildWorldPromptContext,
  getEffectiveFog,
  type AnomalyEvent,
  type AnomalyChoice,
} from "@/lib/campaign-engine";
import { AnomalyEventCard } from "./AnomalyEventCard";
import { downloadFullBackup } from "@/lib/full-backup";
import { maybeAutoSync } from "@/lib/auto-sync";
import { generateReflectionQuestion, generateVideoBridge, fetchVideoMeta, type VideoBridge } from "@/lib/reflection-question";
import { hasOperatorAIKey } from "@/lib/operator-ai";
import { cn } from "@/lib/utils";
import { 
  loadThread, 
  loadMessages, 
  saveThread, 
  saveMessages, 
  createThread,
  updateThreadActivity 
} from "@/lib/echelon-store";
import { useSpeech } from "@/hooks/useSpeech";
import { detectSystemLiteracyTrigger, getRelevantEntries, formatEntriesForContext } from "@/lib/ace-loader";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface LessonRunnerProps {
  lesson: Lesson;
  userId: string;
  state: StateSchema;
  onLessonComplete: (reflection: string) => void;
  mode?: "active" | "replay";
}


// Control-channel messages: instructions from the interface to Echelon,
// never operator speech. They must reach the model as the current turn but
// never render as chat bubbles and never enter the persistent thread cache.
const INTERNAL_TAG = /^\[(STAGE_CONTENT|REFLECTION_|RE-ENGAGE)/;

export function LessonRunner({ lesson, userId, state, onLessonComplete, mode = "active" }: LessonRunnerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentStage, setCurrentStage] = useState<MissionStage>(MissionStage.BRIEFING);
  const [stagesCompleted, setStagesCompleted] = useState<Set<MissionStage>>(new Set());
  const [showReengagePulse, setShowReengagePulse] = useState(false);
  const [showTransmissionModal, setShowTransmissionModal] = useState(false);
  const [showExportReminder, setShowExportReminder] = useState(false);
  const [isResumedSession, setIsResumedSession] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [activeAnomaly, setActiveAnomaly] = useState<AnomalyEvent | null>(null); // THE SLIDE: pending world event
  const [redoStages, setRedoStages] = useState<Set<MissionStage>>(new Set()); // stages re-entered via back/dot navigation — their reflections re-prompt and overwrite
  const [videoBridge, setVideoBridge] = useState<(VideoBridge & { lessonId: number }) | null>(null); // Echelon's "why this footage" + post-watch question
  const [isInReflectionMode, setIsInReflectionMode] = useState(false);
  const [systemLiteracyMode, setSystemLiteracyMode] = useState(false);
  const [savedMissionState, setSavedMissionState] = useState<{ lessonId: number; stage: MissionStage } | null>(null);
  
  // Pending reflection state for v2 multi-stage reflections
  interface PendingReflection {
    mode: "standard" | "micro" | "exercise";
    stage: string;
    prompt?: string;
    exerciseText?: string;
  }
  const [pendingReflection, setPendingReflection] = useState<PendingReflection | null>(null);
  const [readyToAdvance, setReadyToAdvance] = useState(false);
  // The record written at mission end — surfaced, not buried in a toast
  const [missionRecord, setMissionRecord] = useState<MissionLogEntry | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isReplayMode = mode === "replay";
  
  // Speech integration
  const { speak, stop: stopSpeech, settings: audioSettings } = useSpeech();

  // Mission progress tracking
  const { 
    progress,
    isLoading: progressLoading,
    startMission,
    advanceStage: advanceMissionStage,
    completeMission,
    markFieldGuideGenerated,
    currentStage: trackedStage,
  } = useMissionProgress(lesson.id);

  // Initialize mission progress on mount
  useEffect(() => {
    const initializeMission = async () => {
      if (!progress && !isReplayMode && !progressLoading) {
        await startMission();
      }
    };
    initializeMission();
  }, [progress, isReplayMode, progressLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Inactivity detection for Re-engage Protocol pulse
  useEffect(() => {
    const resetActivity = () => {
      lastActivityRef.current = Date.now();
      setShowReengagePulse(false);
      
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      
      inactivityTimerRef.current = setTimeout(() => {
        setShowReengagePulse(true);
        console.log('[INACTIVITY] 2 minutes passed - showing Re-engage Protocol pulse');
      }, 120000); // 2 minutes
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetActivity));
    
    // Initialize timer
    resetActivity();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetActivity));
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  // ECHELON PERSISTENCE: Rehydrate session on mount
  useEffect(() => {
    if (hasOpened || progressLoading || isReplayMode) return;
    
    const rehydrateSession = async () => {
      // Try to load existing thread and messages from localStorage
      const existingThread = loadThread(lesson.id);
      // Heal caches written before control-channel separation: internal tags
      // and raw instruction prompts must not resurface as operator speech.
      const LEGACY_INSTRUCTION = /^(Operator has completed the FINAL stage|Operator chose to continue without reply|User's follow-up reply:|The Operator reflected:|The Operator responded:|The Operator observed:)/;
      const cachedMessages = loadMessages(lesson.id).filter(
        (m) => !(m.role === "user" && (INTERNAL_TAG.test(m.content) || LEGACY_INSTRUCTION.test(m.content)))
      );
      
      if (existingThread && cachedMessages.length > 0) {
        // Session rehydration: restore from local cache
        console.log(`[ECHELON REHYDRATE] Found ${cachedMessages.length} cached messages for lesson ${lesson.id}`);
        setMessages(cachedMessages);
        setCurrentStage(existingThread.currentStage);
        if (existingThread.currentStage === MissionStage.COMPLETE) {
          setIsComplete(true);
        }
        setHasOpened(true);
        setIsResumedSession(true);
        
        // Update thread activity timestamp
        updateThreadActivity(lesson.id, {});
        
        // Show resume notification
        toast({
          title: "Session Restored",
          description: `Continuing from ${getStageLabel(existingThread.currentStage)}`,
        });
        
        return;
      }
      
      // Fallback: Try to rehydrate from Supabase (if cache is empty but DB has messages)
      if (cachedMessages.length === 0) {
        try {
          const { data, error } = await supabase
            .from('echelon_conversations')
            .select('role, content, created_at')
            .eq('user_id', userId)
            .eq('lesson_id', lesson.id)
            .order('created_at', { ascending: true });
          
          if (!error && data && data.length > 0) {
            console.log(`[ECHELON REHYDRATE] Found ${data.length} messages in database, syncing to cache`);
            const rehydratedMessages = data.map(d => ({ 
              role: d.role as "user" | "assistant", 
              content: d.content 
            }));
            setMessages(rehydratedMessages);
            saveMessages(lesson.id, rehydratedMessages);
            setHasOpened(true);
            setIsResumedSession(true);
            
            toast({
              title: "Session Restored",
              description: "Continuing from previous conversation",
            });
            
            return;
          }
        } catch (error) {
          console.error('[ECHELON REHYDRATE] Failed to load from database:', error);
        }
      }
      
      // Fresh start: Create new thread and deliver opening
      console.log(`[ECHELON REHYDRATE] Starting fresh session for lesson ${lesson.id}`);
      const newThread = createThread(lesson.id, MissionStage.BRIEFING);
      saveThread(newThread);
      setHasOpened(true);
      deliverOpening();
    };
    
    rehydrateSession();
  }, [hasOpened, progressLoading, isReplayMode, lesson.id, userId]);

  const getStageFlow = (): MissionStage[] => [
    MissionStage.BRIEFING,
    MissionStage.DRILL1,
    ...(lesson.video_url ? [MissionStage.VIDEO] : []),
    MissionStage.HP,
    MissionStage.DRILL2,
    MissionStage.DEBRIEF,
    MissionStage.FINAL,
    MissionStage.REFLECTION,
    MissionStage.COMPLETE,
  ];

  // A dossier entry already exists for this stage of this lesson —
  // don't prompt again when the operator revisits via the Back button.
  const hasReflectionFor = (stage: string): boolean =>
    getReflectionEntries(lesson.id).some((e) => e.stage === stage);

  // Jump backward to any earlier stage (Back button and dot navigation).
  // Backward is always safe: the operator has already seen that content.
  // Forward stays locked — content never leaks ahead of the mission.
  // Every stage from the target onward becomes re-answerable: fresh answers
  // overwrite the old ones in the dossier (reflection storage replaces
  // same-lesson same-stage entries).
  const jumpToStage = (target: MissionStage) => {
    if (isStreaming) return;
    const stageFlow = getStageFlow();
    const targetIndex = stageFlow.indexOf(target);
    const currentIndex = stageFlow.indexOf(currentStage);
    if (targetIndex < 0 || targetIndex >= currentIndex) return;
    // A pending reflection must not trap the operator — going back dismisses
    // it; it re-triggers on the next pass.
    if (pendingReflection) setPendingReflection(null);
    // Jumping back out of a completed mission reopens it for input, so
    // unanswered questions can be answered without restarting.
    if (isComplete) setIsComplete(false);
    setRedoStages((prev) => {
      const next = new Set(prev);
      for (const s of stageFlow.slice(targetIndex, currentIndex)) next.add(s);
      return next;
    });
    setReadyToAdvance(false);
    setIsInReflectionMode(false);
    setCurrentStage(target);
    updateThreadActivity(lesson.id, { currentStage: target });
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Returning to ${getStageLabel(target)}, Operator. Your previous work stands until you replace it.`,
      },
    ]);
    console.log(`Stage jump: ${currentStage} → ${target}`);
  };

  const goBackStage = () => {
    const stageFlow = getStageFlow();
    const currentIndex = stageFlow.indexOf(currentStage);
    if (currentIndex <= 0) return;
    let prev = stageFlow[currentIndex - 1];
    if (prev === MissionStage.REFLECTION && currentIndex - 2 >= 0) {
      prev = stageFlow[currentIndex - 2];
    }
    jumpToStage(prev);
  };

  // Specificity source for Echelon-generated reflection questions: the
  // operator's most recent message is the drill answer they just gave.
  const lastOperatorMessage = (): string | null =>
    [...messages].reverse().find((m) => m.role === "user")?.content ?? null;

  // Reflection cards capture Echelon's streamed reply after their await
  // resolves — by then the parent has re-rendered, so they need a live ref,
  // not a stale closure over `messages`.
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;
  const latestEchelonMessage = (): string | null =>
    [...messagesRef.current].reverse().find((m) => m.role === "assistant")?.content ?? null;

  // Visual Intel bridge: when the video stage arrives, Echelon explains why
  // this footage was selected and prepares the post-watch question.
  useEffect(() => {
    if (currentStage !== MissionStage.VIDEO || !lesson.video_url) return;
    if (videoBridge?.lessonId === lesson.id) return;
    const concept = [lesson.head, lesson.lesson_summary, lesson.briefing]
      .filter(Boolean)
      .join("\n\n");
    (async () => {
      // Ground the bridge in what the footage actually is — without the
      // real title the model invents subjects ("emergency responders"
      // for a sprinter's reaction-time drill).
      // Stored description (harvested) beats a live title fetch; only hit
      // oEmbed when the archive has nothing for this footage.
      const meta = lesson.video_description ? null : await fetchVideoMeta(lesson.video_url!);
      const bridge = await generateVideoBridge({
        lessonTitle: lesson.lesson_title,
        concept,
        videoTitle: meta?.title,
        videoAuthor: meta?.author,
        videoDescription: lesson.video_description,
        authoredIntro: lesson.video_intro,
        fallbackIntro:
          "Field footage incoming, Operator. This is the mission concept running live in the real world — watch how the practitioners handle it.",
        fallbackQuestion: "Where does what you just watched already operate in your own life or work?",
        language: state.user.language,
      });
      setVideoBridge({ ...bridge, lessonId: lesson.id });
    })();
  }, [currentStage, lesson.id, lesson.video_url]);

  // A stage re-entered via back navigation re-prompts its reflection once,
  // and the fresh answer overwrites the old entry.
  const shouldPromptReflection = (stage: MissionStage, stageKey: string): boolean =>
    redoStages.has(stage) || !hasReflectionFor(stageKey);

  const clearRedo = (stage: MissionStage) =>
    setRedoStages((prev) => {
      const next = new Set(prev);
      next.delete(stage);
      return next;
    });

  // Stage advancement logic: advance to next stage after user response
  const advanceStage = async () => {
    const stageFlow: MissionStage[] = getStageFlow();

    const currentIndex = stageFlow.indexOf(currentStage);
    if (currentIndex < stageFlow.length - 1) {
      const nextStage = stageFlow[currentIndex + 1];
      setStagesCompleted((prev) => new Set(prev).add(currentStage));
      setCurrentStage(nextStage);
      setReadyToAdvance(false);
      
      // Update database progress
      await advanceMissionStage();
      
      // ECHELON PERSISTENCE: Update thread state
      updateThreadActivity(lesson.id, { currentStage: nextStage });
      
      console.log(`Stage advancement: ${currentStage} → ${nextStage}`);

      // THE SLIDE: the world can interrupt at a stage transition
      rollAnomalyEvent(lesson.id, lesson.lesson_number).then((ev) => {
        if (ev) setActiveAnomaly(ev);
      });
      
      // Check if reflection should trigger AFTER current stage completion
      // Reflections trigger when LEAVING a stage (after user response)
      
      // After DRILL1 → Standard Reflection
      if (currentStage === MissionStage.DRILL1 && lesson.drill1_prompt && !pendingReflection && shouldPromptReflection(MissionStage.DRILL1, "drill1")) {
        clearRedo(MissionStage.DRILL1);
        const prompt = await generateReflectionQuestion({
          drillPrompt: lesson.drill1_prompt,
          operatorResponse: lastOperatorMessage(),
          fallback: "What insight emerged from this drill?",
          authored: lesson.reflection_prompt,
          language: state.user.language,
        });
        setPendingReflection({
          mode: "standard",
          stage: "drill1",
          prompt,
        });
        return; // Don't advance yet
      }
      
      // After VIDEO → Micro Insight
      if (currentStage === MissionStage.VIDEO && lesson.video_url && !pendingReflection && shouldPromptReflection(MissionStage.VIDEO, "video")) {
        clearRedo(MissionStage.VIDEO);
        setPendingReflection({
          mode: "micro",
          stage: "video",
          prompt:
            (videoBridge?.lessonId === lesson.id && videoBridge.question) ||
            "Where does what you just watched already operate in your own life or work?",
        });
        return;
      }
      
      // After DRILL2 → Standard Reflection
      if (currentStage === MissionStage.DRILL2 && lesson.drill2_prompt && !pendingReflection && shouldPromptReflection(MissionStage.DRILL2, "drill2")) {
        clearRedo(MissionStage.DRILL2);
        const prompt = await generateReflectionQuestion({
          drillPrompt: lesson.drill2_prompt,
          operatorResponse: lastOperatorMessage(),
          fallback: "What pattern or realization surfaced during this drill?",
          authored: lesson.reflection_prompt,
          language: state.user.language,
        });
        setPendingReflection({
          mode: "standard",
          stage: "drill2",
          prompt,
        });
        return;
      }
      
      // After DEBRIEF → Exercise Reflection
      if (currentStage === MissionStage.DEBRIEF && lesson.debrief && !pendingReflection && shouldPromptReflection(MissionStage.DEBRIEF, "debrief")) {
        clearRedo(MissionStage.DEBRIEF);
        setPendingReflection({
          mode: "exercise",
          stage: "debrief",
          exerciseText: lesson.debrief
        });
        return;
      }
      
      // Auto-trigger content delivery for appropriate stages
      const contentStages = [
        MissionStage.DRILL1,
        // HP removed - it's a non-conversational, read-only stage
        MissionStage.DRILL2,
        MissionStage.DEBRIEF,
        MissionStage.FINAL
      ];

      if (contentStages.includes(nextStage)) {
        // Delay allows UI to update before Echelon starts speaking
        setTimeout(() => deliverStageContent(nextStage), 500);
      } else if (nextStage === MissionStage.REFLECTION) {
        // Guard: Only enter reflection mode when coming from FINAL stage
        if (currentStage === MissionStage.FINAL && lesson.final_question) {
          setIsInReflectionMode(true);
        } else {
          // Skip reflection if guard fails
          advanceStage();
        }
      } else if (nextStage === MissionStage.COMPLETE) {
        setTimeout(() => handleComplete(), 1000);
      }
    }
  };

  const getStageLabel = (stage: MissionStage): string => {
    const labels: Record<MissionStage, string> = {
      // Onboarding stages
      [MissionStage.ONBOARDING_SCREEN_1]: "System Init",
      [MissionStage.LANGUAGE_SELECTION]: "Language",
      [MissionStage.ASSESSMENT]: "Assessment",
      [MissionStage.ORIENTATION_FOXHOLE]: "Orientation",
      
      // Mission stages
      [MissionStage.BRIEFING]: "Mission Briefing",
      [MissionStage.DRILL1]: "Primary Drill",
      [MissionStage.VIDEO]: "Visual Intel",
      [MissionStage.HP]: "Integration",
      [MissionStage.DRILL2]: "Secondary Drill",
      [MissionStage.DEBRIEF]: "Debrief",
      [MissionStage.FINAL]: "Final Reflection",
      [MissionStage.REFLECTION]: "Deep Reflection",
      [MissionStage.COMPLETE]: "Complete",
    };
    return labels[stage] || stage;
  };

  // Auto-deliver stage content when entering a new stage
  const deliverStageContent = async (stage: MissionStage) => {
    if (!lesson) return;

    let stageContent = "";

    switch (stage) {
      case MissionStage.DRILL1:
        stageContent = lesson.drill1_prompt || "";
        break;
      case MissionStage.HP:
        stageContent = `${lesson.head || ""}\n\n${lesson.practical || ""}`;
        break;
      case MissionStage.DRILL2:
        stageContent = lesson.drill2_prompt || "";
        break;
      case MissionStage.DEBRIEF:
        stageContent = lesson.debrief || "";
        break;
      case MissionStage.FINAL:
        stageContent = lesson.final_question || "";
        break;
    }

    if (!stageContent.trim()) return;

    // Stream Echelon delivery of stage content
    setIsStreaming(true);
    try {
      await streamEchelonResponse(`[STAGE_CONTENT: ${stage}]`, stageContent);
    } finally {
      setIsStreaming(false);
    }
  };

  const deliverOpening = async () => {
    // With an AI connected, the briefing is delivered LIVE: Echelon opens
    // with the full mission frame — what the concept is, how it serves the
    // campaign, why this operator was recruited, what the mission will ask,
    // ending on the readiness check (Box 3). The canned text below is only
    // the no-AI fallback — without it, the enriched briefing never reaches
    // the operator, because nothing else calls Echelon at mission start.
    if (hasOperatorAIKey()) {
      setIsStreaming(true);
      try {
        await streamEchelonResponse("[STAGE_CONTENT: briefing]");
        return;
      } catch (error) {
        console.warn("[BRIEFING] Live delivery failed — canned opening fallback:", error);
      } finally {
        setIsStreaming(false);
      }
    }

    setIsStreaming(true);
    
    // Use canonical echelon_opening text
    const openingText = lesson.echelon_opening || "Operator. Your next mission is ready.";
    
    // Stream it for effect
    let currentText = "";
    const words = openingText.split(" ");
    
    setMessages([{ role: "assistant", content: "" }]);
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? " " : "") + words[i];
      setMessages([{ role: "assistant", content: currentText }]);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Canon: raw chat is never saved. Conversation lives in the local
    // Echelon cache only; confirmed reflections persist separately.

    // ECHELON PERSISTENCE: Save opening to local cache
    const updatedMessages = [{ role: "assistant" as const, content: openingText }];
    saveMessages(lesson.id, updatedMessages);
    
    setIsStreaming(false);
  };

  const streamEchelonResponse = async (userMessage: string, operatorRequest?: string) => {
    const CHAT_URL = getEdgeFunctionUrl("echelon-chat");

    // Detect System Literacy trigger
    const isSystemLiteracyRequest = detectSystemLiteracyTrigger(userMessage);
    let systemLiteracyContext: string | undefined;
    let mode: string | undefined;

    if (isSystemLiteracyRequest) {
      console.log('[SYSTEM LITERACY] Trigger detected, fetching ACE Box 08 content');
      
      // Save current mission state (non-destructive pause)
      setSavedMissionState({ lessonId: lesson.id, stage: currentStage });
      setSystemLiteracyMode(true);
      
      // Fetch relevant ACE entries
      const entries = await getRelevantEntries(userMessage);
      systemLiteracyContext = formatEntriesForContext(entries);
      mode = "system_literacy";
      
      console.log('[SYSTEM LITERACY] Context loaded:', entries.length, 'entries');
    }

    // Get AI provider config from localStorage
    const aiProvider = localStorage.getItem("neuroverse_ai_provider") || "google";
    const apiKey = localStorage.getItem("neuroverse_api_key") || "";
    const ollamaEndpoint = localStorage.getItem("neuroverse_ollama_endpoint") || "http://localhost:11434";
    const ollamaModel = localStorage.getItem("neuroverse_ollama_model") || "llama2";

    // The instruction the model acts on THIS turn. Interface calls pass a
    // control tag plus the real instruction as the second argument; operator
    // sends pass their text directly. (Previously the current message was
    // never put on the wire — the model always ran one turn behind.)
    const turnContent =
      operatorRequest && operatorRequest !== "REENGAGE_PROTOCOL" ? operatorRequest : userMessage;
    const wireHistory = messages
      .filter((m) => m.content && !INTERNAL_TAG.test(m.content))
      .map((m) => ({ role: m.role, content: m.content }));
    const last = wireHistory[wireHistory.length - 1];
    const wireMessages =
      last && last.role === "user" && last.content === turnContent
        ? wireHistory
        : [...wireHistory, { role: "user", content: turnContent }];

    const chatBody = {
        messages: wireMessages,
        lesson: {
          id: lesson.id,
          lesson_number: lesson.lesson_number,
          lesson_title: lesson.lesson_title,
          section_name: lesson.section_name,
          lesson_summary: lesson.lesson_summary,
          story_beat: lesson.story_beat,
          briefing: lesson.briefing,
          echelon_opening: lesson.echelon_opening,
          drill1_prompt: lesson.drill1_prompt,
          drill2_prompt: lesson.drill2_prompt,
          head: lesson.head,
          practical: lesson.practical,
          debrief: lesson.debrief,
          final_question: lesson.final_question,
          echelon_closing: lesson.echelon_closing,
          video_url: lesson.video_url,
          tone: lesson.tone,
          // The world presses on the mission: authored fog + Slide band + degraded link
          fog_level: getEffectiveFog(lesson.fog_level ?? 0),
          phase: lesson.phase,
        },
        userData: {
          userId: userId,
          callsign: state.user.vanguard.callsign,
          archetype: {
            primary: state.user.archetype.primary,
            shadow: state.user.archetype.shadow,
            rising: state.user.archetype.rising,
          },
          language: {
            code: state.user.language.code,
            name: state.user.language.name,
          },
        },
        currentStage: currentStage,
        world: buildWorldPromptContext({ section_id: lesson.section_id, section_name: lesson.section_name }),
        ...(operatorRequest && { operatorRequest }),
        ...(mode && { mode }),
        ...(systemLiteracyContext && { system_literacy_context: systemLiteracyContext }),
        ...(savedMissionState && { paused_mission: savedMissionState }),
    };

    // DIRECT PATH FIRST: the Eight-Box prompt is assembled in this browser
    // from the same kernel files the relay runs, and streamed straight to the
    // operator's provider — the conversation never transits our
    // infrastructure. The relay is only an automatic fallback for networks
    // that block the direct call. Ollama is direct-only: a cloud relay can
    // never reach an operator's localhost.
    let resp: Response;
    try {
      resp = await streamEchelonDirect(chatBody, {
        provider: aiProvider,
        apiKey,
        ollamaEndpoint,
        ollamaModel,
      });
    } catch (directError) {
      if (aiProvider === "ollama") {
        console.error("[ECHELON] Local model unreachable:", directError);
        toast({
          title: "Can't reach your local model",
          description: "Echelon couldn't connect to Ollama at your configured endpoint. Make sure it's running (ollama serve) and allows this site (OLLAMA_ORIGINS).",
          variant: "destructive",
        });
        return;
      }
      console.warn("[ECHELON] Direct provider call blocked, falling back to relay:", directError);
      resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ACTIVE_SUPABASE_PUBLISHABLE_KEY}`,
          "x-ai-provider": aiProvider,
          "x-ai-key": apiKey,
          "x-ollama-endpoint": ollamaEndpoint,
          "x-ollama-model": ollamaModel,
        },
        body: JSON.stringify(chatBody),
      });
    }

    if (!resp.ok) {
      if (resp.status === 429) {
        toast({
          title: "Rate Limited",
          description: "Echelon is at capacity. Please wait a moment.",
          variant: "destructive",
        });
        return;
      }
      if (resp.status === 402) {
        toast({
          title: "Payment Required",
          description: "Please add funds to continue.",
          variant: "destructive",
        });
        return;
      }
      if (resp.status === 401) {
        toast({
          title: "Echelon can't reach your AI",
          description: "Your API key is missing or invalid. Update it in Settings.",
          variant: "destructive",
        });
        return;
      }
      throw new Error("Failed to connect with Echelon");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;
    let assistantContent = "";

    // Add placeholder for assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        let jsonStr: string;
        if (line.startsWith("data: ")) jsonStr = line.slice(6).trim();
        else if (line.trim().startsWith("{")) jsonStr = line.trim(); // Ollama NDJSON
        else continue;
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = (parsed.choices?.[0]?.delta?.content ?? // OpenAI
            parsed.delta?.text ?? // Anthropic
            parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? // Gemini
            parsed.message?.content) as string | undefined; // Ollama
          if (content) {
            assistantContent += content;
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1].content = assistantContent;
              return newMessages;
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Canon: raw chat is never saved. The exchange persists only in the
    // local Echelon cache below; confirmed reflections persist separately.

    // ECHELON PERSISTENCE: Save messages to local cache after each exchange
    const currentMessages = messages.filter(m => m.content !== ""); // Filter out empty placeholders
    saveMessages(lesson.id, [
      ...currentMessages,
      ...(INTERNAL_TAG.test(userMessage) ? [] : [{ role: "user" as const, content: userMessage }]),
      { role: "assistant" as const, content: assistantContent },
    ]);
    
    // SPEECH LAYER: Speak Echelon's response (if audio enabled)
    if (audioSettings.enabled && assistantContent) {
      speak(assistantContent);
    }
  };

  const handleAnomalyResolve = (choice: AnomalyChoice) => {
    if (!activeAnomaly) return;
    const resolved = activeAnomaly;
    const snap = resolveAnomaly(resolved, choice, lesson.id);
    setActiveAnomaly(null);
    setMessages((prev) => [...prev, { role: "assistant", content: choice.echo }]);
    toast({
      title: `${resolved.antagonist} — decision recorded`,
      description: snap
        ? `The Slide: ${snap.slide} (${snap.band.name}) · Signal: ${snap.signal}/100`
        : undefined,
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming || isComplete || activeAnomaly) return;

    const userMessage = input.trim();
    
    // Detect "Resume Mission" command to exit System Literacy mode
    const RESUME_TRIGGERS = ["resume mission", "continue", "back to lesson", "resume"];
    const isResumeCommand = RESUME_TRIGGERS.some(t => userMessage.toLowerCase().includes(t));
    
    if (isResumeCommand && systemLiteracyMode && savedMissionState) {
      console.log('[SYSTEM LITERACY] Resume command detected, returning to mission');
      setSystemLiteracyMode(false);
      setSavedMissionState(null);
      
      toast({
        title: "Mission Resumed",
        description: `Returning to ${getStageLabel(savedMissionState.stage)}`,
      });
      
      return;
    }

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsStreaming(true);

    try {
      await streamEchelonResponse(userMessage);

      // The operator controls the pace: after their first exchange in a
      // response stage, offer Continue — never yank the stage away on a
      // timer. They can keep talking with Echelon as long as they want.
      if (currentStage !== MissionStage.BRIEFING && !systemLiteracyMode) {
        setReadyToAdvance(true);
      }
    } catch (error) {
      console.error("Send error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleAdvanceStage = () => {
    if (activeAnomaly) return; // the world is waiting on a decision
    advanceStage();
  };

  const handleReengageProtocol = async () => {
    if (isStreaming || isComplete) return;
    try {
      setIsStreaming(true);
      await streamEchelonResponse("[RE-ENGAGE PROTOCOL]", "REENGAGE_PROTOCOL");
    } catch (error) {
      console.error("[RE-ENGAGE] Failed:", error);
      toast({
        title: "Re-engagement Failed",
        description: "Unable to re-engage protocol. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleComplete = async () => {
    setIsComplete(true);
    setIsStreaming(true);

    // THE SLIDE: completion pushes the world back against entropy
    applyMissionCompletion(lesson.id, getReflectionEntries(lesson.id).length > 0, { id: lesson.section_id, name: lesson.section_name });

    // Linked vault: back up the full record in the background
    maybeAutoSync(`mission ${lesson.lesson_number} complete`);

    // Deliver closing message
    const closingText = lesson.echelon_closing || "Mission complete, Operator. Integration in progress.";
    
    // Stream closing
    let currentText = "";
    const words = closingText.split(" ");
    
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? " " : "") + words[i];
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = currentText;
        return newMessages;
      });
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Canon: raw chat is never saved. Closing line stays local only.

    setIsStreaming(false);

    // Extract user reflections for Field Guide
    const userReflections = messages
      .filter(m => m.role === "user")
      .map(m => m.content)
      .join("\n\n");

    // Generate Field Guide entry and unlock traits
    toast({
      title: "Processing Insights",
      description: "Analyzing mission reflections...",
    });

    try {
      // Compile mission log from all reflections (local-first)
      const lessonReflections = getReflectionEntries(lesson.id);
      if (lessonReflections.length > 0) {
        const missionLog = compileMissionLog(
          lesson.id,
          lesson.lesson_title || `Mission ${lesson.lesson_number}`,
          lessonReflections
        );
        console.log('[FIELD GUIDE ENGINE] Mission log compiled:', missionLog);
        setMissionRecord(missionLog);

        // Two minds, one record: Echelon writes its own read of the
        // operator's thinking into the same entry — the AI contributing
        // context, not just mirroring. Fire-and-attach; the record card
        // updates when it lands.
        generateEchelonRead(
          lesson.lesson_title || `Mission ${lesson.lesson_number}`,
          lessonReflections,
          { archetype: state.user.archetype.primary, language: state.user.language }
        ).then((read) => {
          if (read) {
            attachEchelonRead(lesson.id, read);
            setMissionRecord((prev) => (prev ? { ...prev, echelonRead: read } : prev));
          }
        });
      }

      // Cloud identity analysis is a signed-in feature; anonymous operators
      // stay fully local and never hit the network here. Each cloud step is
      // best-effort — a failure must never block the mission completing.
      const { data: { session } } = await supabase.auth.getSession();
      let unlockedTraits: string[] = [];
      let fieldGuideEntry: unknown = null;
      if (session) {
        try {
          unlockedTraits = await analyzeAndUnlockTraits(userId, lesson.id, userReflections);
        } catch (error) {
          console.warn("[INSIGHTS] Trait analysis failed (mission unaffected):", error);
        }
        try {
          fieldGuideEntry = await generateFieldGuideEntry(userId, lesson.id, messages);
          if (fieldGuideEntry) {
            await markFieldGuideGenerated();
          }
        } catch (error) {
          console.warn("[INSIGHTS] Field Guide entry failed (mission unaffected):", error);
        }
      } else {
        console.log("[INSIGHTS] Anonymous operator — cloud identity analysis skipped");
      }

      // Complete mission — local-first record, always runs
      await completeMission(unlockedTraits);

      // Show results — every write to the record invites the operator to read it.
      // A dossier nobody opens is a dead letter; the nudge keeps it a living document.
      if (unlockedTraits.length > 0) {
        toast({
          title: "Traits Unlocked!",
          description: `${unlockedTraits.length} new cognitive trait(s) detected`,
          action: (
            <ToastAction
              altText="Open your Field Guide traits"
              onClick={() => { window.location.href = "/field-guide?tab=traits"; }}
            >
              See them
            </ToastAction>
          ),
        });
      }

      if (fieldGuideEntry) {
        toast({
          title: "Field Guide Updated",
          description: "Echelon wrote a new entry about how you think",
          action: (
            <ToastAction
              altText="Open your Field Guide timeline"
              onClick={() => { window.location.href = "/field-guide?tab=evolution"; }}
            >
              Read it
            </ToastAction>
          ),
        });
      }
    } catch (error) {
      console.error("Failed to process mission insights:", error);
    }

    // Complete lesson after a brief delay
    setTimeout(() => {
      // Check if manual backup is enabled and show reminder
      if (state.user.backup.method === 'manual') {
        setShowExportReminder(true);
      }
      onLessonComplete(userReflections);
    }, 1500);
  };

  const handleExportState = () => {
    downloadFullBackup();

    // Update last export timestamp
    state.user.backup.last_export_at = new Date().toISOString();
    saveState(state);

    toast({
      title: "Backup Exported",
      description: "Everything saved — progress, reflections, conversations. Restorable any time.",
    });

    setShowExportReminder(false);
  };

  const handleRestartMission = async () => {
    // Stop any active speech
    stopSpeech();
    
    // 1. Clear Echelon cache for this lesson (localStorage)
    clearLessonCache(lesson.id);
    
    // 2. Clear database messages for this lesson (optional cloud sync)
    try {
      await supabase
        .from('echelon_conversations')
        .delete()
        .eq('user_id', userId)
        .eq('lesson_id', lesson.id);
    } catch (error) {
      console.error('[RESTART] Failed to clear database messages:', error);
    }
    
    // 3. Reset local state
    setMessages([]);
    setCurrentStage(MissionStage.BRIEFING);
    setStagesCompleted(new Set());
    setHasOpened(false);
    setIsComplete(false);
    setIsResumedSession(false);
    setInput("");
    
    // 4. Create fresh thread
    const newThread = createThread(lesson.id, MissionStage.BRIEFING);
    saveThread(newThread);
    
    // 5. Scroll to top
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    
    // 6. Re-deliver opening after brief delay
    setShowRestartDialog(false);
    
    toast({
      title: "Mission Reset",
      description: "Restarting from Mission Briefing...",
    });
    
    setTimeout(() => {
      deliverOpening();
      setHasOpened(true);
    }, 500);
  };

  const shouldShowStageAdvanceButton = (): boolean => {
    // Show "Advance to Next Stage" button for certain stages
    return (
      currentStage === MissionStage.BRIEFING ||
      currentStage === MissionStage.HP ||
      currentStage === MissionStage.VIDEO ||
      currentStage === MissionStage.DEBRIEF
    );
  };

  // The advance button names its destination so the operator always knows
  // the mission is moving — "Continue" to nowhere reads as a dead end.
  const getAdvanceLabel = (): string => {
    if (currentStage === MissionStage.FINAL) return "Continue → Final Transmission (last step)";
    const flow = getStageFlow();
    const next = flow[flow.indexOf(currentStage) + 1];
    return next && next !== MissionStage.REFLECTION && next !== MissionStage.COMPLETE
      ? `Log Insight & Continue → ${getStageLabel(next)}`
      : "Log Insight & Continue →";
  };

  const shouldShowSendButton = (): boolean => {
    // Show send button for stages that require user input
    return (
      currentStage === MissionStage.DRILL1 ||
      currentStage === MissionStage.DRILL2 ||
      currentStage === MissionStage.FINAL
    );
  };

  const exitReflectionMode = () => {
    setIsInReflectionMode(false);
    // Continue to COMPLETE stage
    advanceStage();
  };

  return (
    <>
      {/* Deep Reflection Mode (FINAL stage) */}
      {isInReflectionMode && currentStage === MissionStage.REFLECTION && (
        <ReflectionMode
          lessonId={lesson.id}
          reflectionPrompt={lesson.final_question || "What is your key insight from this mission?"}
          streamEchelonResponse={streamEchelonResponse}
          getLatestEchelon={latestEchelonMessage}
          onComplete={exitReflectionMode}
        />
      )}
      
      {/* Main Lesson Runner UI - conversation stays visible during dossier entries */}
      {!isInReflectionMode && (
        // Height-capped so the transcript scrolls INSIDE the card and the
        // composer + advance buttons stay on screen no matter how long the
        // conversation runs.
        <Card className="min-h-[70vh] max-h-[calc(100dvh-5rem)] flex flex-col bg-card/50 backdrop-blur-sm border-neuro-border">
      {/* Header with Stage Progress */}
      <div className="px-4 py-3 border-b border-neuro-border/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neuro-cyan animate-pulse"></div>
            <span className="text-sm text-neuro-cyan font-medium">
              {isReplayMode ? "Mission Replay" : isComplete ? "Mission Complete" : "Training Session"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isReplayMode && <EchelonAudioToggle />}
            <span className="text-xs text-muted-foreground">
              L{lesson.lesson_number} · {lesson.section_name}
            </span>
          </div>
        </div>
        
        {/* Stage Indicator & Re-engage Protocol */}
        {!isReplayMode && (
          <>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {!systemLiteracyMode &&
                getStageFlow().indexOf(currentStage) > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={goBackStage}
                          disabled={isStreaming}
                          className="h-7 px-2 text-muted-foreground hover:text-neuro-cyan"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="text-xs">Back</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">Return to the previous step</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              <span className="text-xs text-muted-foreground">Stage:</span>
              {systemLiteracyMode ? (
                <Badge variant="outline" className="text-xs border-amber-500/50 bg-amber-500/10 text-amber-500">
                  📚 System Literacy
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs border-neuro-cyan/50 text-neuro-cyan">
                  {getStageLabel(currentStage)}
                </Badge>
              )}
              {stagesCompleted.size > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {stagesCompleted.size} completed
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReengageProtocol}
                      disabled={isStreaming || isComplete}
                      className={cn(
                        "inline-flex items-center gap-2 border-neuro-orange/40 text-neuro-orange hover:bg-neuro-orange/10",
                        showReengagePulse && "animate-pulse ring-2 ring-neuro-orange/60 shadow-lg shadow-neuro-orange/30"
                      )}
                    >
                      <RefreshCw className={cn("h-4 w-4", isStreaming && "animate-spin")} />
                      <span className="hidden xs:inline">Re-engage Protocol</span>
                      <span className="xs:hidden">Re-engage</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">Request clarification or continue the conversation with Echelon</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Restart Mission Button with Confirmation */}
              <AlertDialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isStreaming}
                    className="text-muted-foreground hover:text-foreground hover:bg-neuro-surface"
                    title="Restart Mission"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-neuro-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">Restart Mission?</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      Your progress in this mission will be reset, but no global progress will be lost. 
                      You will start fresh from the Mission Briefing.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-neuro-border">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleRestartMission}
                      className="bg-neuro-orange hover:bg-neuro-orange/90 text-white"
                    >
                      Restart Mission
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Stage dots — tap a completed dot to return there; forward stays locked */}
          {!systemLiteracyMode && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap" aria-label="Mission stages">
              {getStageFlow()
                .filter((s) => s !== MissionStage.REFLECTION)
                .map((s) => {
                  const flow = getStageFlow();
                  const done = flow.indexOf(s) < flow.indexOf(currentStage);
                  const isCur = s === currentStage;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => done && jumpToStage(s)}
                      disabled={!done || isStreaming}
                      title={done ? `Return to ${getStageLabel(s)}` : getStageLabel(s)}
                      aria-label={done ? `Return to ${getStageLabel(s)}` : getStageLabel(s)}
                      className={cn(
                        "h-2.5 rounded-full transition-all duration-300",
                        isCur
                          ? "w-6 bg-neuro-cyan"
                          : done
                          ? "w-2.5 bg-neuro-orange hover:scale-125 cursor-pointer"
                          : "w-2.5 bg-muted/40 cursor-default"
                      )}
                    />
                  );
                })}
            </div>
          )}
          </>
        )}
      </div>

      {/* Messages Area — min-h-0 lets flexbox actually shrink this region,
          which is what makes the internal scroll work */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {messages.filter((m) => !INTERNAL_TAG.test(m.content) && (m.content.trim() !== "" || isStreaming)).map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-lg ${
                msg.role === "assistant"
                  ? "bg-neuro-surface border border-neuro-cyan/20"
                  : "bg-primary/10 border border-primary/20"
              }`}
            >
              <p className="text-base text-foreground whitespace-pre-wrap break-words leading-relaxed">
                {renderEmphasis(msg.content)}
              </p>
            </div>
          </div>
        ))}
        
        {/* Static HP Content Display */}
        {currentStage === MissionStage.HP && lesson.head && (
          <div className="flex justify-start">
            <div className="max-w-[85%] sm:max-w-[75%] p-4 rounded-lg bg-neuro-surface border border-neuro-cyan/20 space-y-4">
              <div>
                <div className="text-xs font-bold text-neuro-orange mb-2 font-mono uppercase tracking-wider">CONCEPT</div>
                <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">{renderEmphasis(lesson.head)}</p>
              </div>
              {lesson.practical && (
                <>
                  <div className="h-px bg-neuro-border/30" />
                  <div>
                    <div className="text-xs font-bold text-neuro-orange mb-2 font-mono uppercase tracking-wider">PRACTICAL</div>
                    <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">{renderEmphasis(lesson.practical)}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Visual Intel: the video itself, right in the conversation */}
        {!isReplayMode && currentStage === MissionStage.VIDEO && lesson.video_url && (
          <div className="animate-fade-in space-y-3">
            {videoBridge?.lessonId === lesson.id && (
              <div className="border-l-2 border-neuro-cyan/60 pl-3 py-1">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neuro-cyan mb-1">
                  Echelon · Why this footage
                </p>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {videoBridge.intro}
                </p>
              </div>
            )}
            <VideoPlayer
              videoUrl={lesson.video_url}
              onComplete={() => advanceStage()}
              callsign={state.user.vanguard.callsign || "Operator"}
            />
          </div>
        )}

        {isStreaming && messages[messages.length - 1]?.content === "" && (
          <div className="flex justify-start">
            <div className="bg-neuro-surface border border-neuro-cyan/20 p-3 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-neuro-cyan animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-neuro-cyan animate-pulse [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-neuro-cyan animate-pulse [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area with Stage-Specific Controls — shrink-0: the composer
          always keeps its full height and never scrolls; only the transcript
          above compresses. */}
      <div className="p-4 border-t border-neuro-border/50 space-y-3 shrink-0">
        {pendingReflection ? (
          <div className="space-y-1">
            {pendingReflection.mode === "standard" && (
              <StandardReflection
                getLatestEchelon={latestEchelonMessage}
                lessonId={lesson.id}
                stage={pendingReflection.stage as "drill1" | "drill2"}
                prompt={pendingReflection.prompt!}
                streamEchelonResponse={streamEchelonResponse}
                onComplete={() => {
                  setPendingReflection(null);
                  advanceStage();
                }}
              />
            )}
            {pendingReflection.mode === "micro" && (
              <MicroInsight
                getLatestEchelon={latestEchelonMessage}
                lessonId={lesson.id}
                stage="video"
                prompt={pendingReflection.prompt!}
                streamEchelonResponse={streamEchelonResponse}
                onComplete={() => {
                  setPendingReflection(null);
                  advanceStage();
                }}
              />
            )}
            {pendingReflection.mode === "exercise" && (
              <ExerciseReflection
                getLatestEchelon={latestEchelonMessage}
                lessonId={lesson.id}
                stage="debrief"
                exerciseText={pendingReflection.exerciseText!}
                streamEchelonResponse={streamEchelonResponse}
                onComplete={() => {
                  setPendingReflection(null);
                  advanceStage();
                }}
              />
            )}
          </div>
        ) : isReplayMode ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">Replay Mode - Read Only</p>
            <p className="text-xs text-muted-foreground">
              This mission has been completed. Reflections cannot be edited.
            </p>
          </div>
        ) : !isComplete ? (
          <>
            {/* THE SLIDE: an antagonist is waiting on a decision */}
            {activeAnomaly && (
              <AnomalyEventCard event={activeAnomaly} onResolve={handleAnomalyResolve} />
            )}
            {/* Show input for response stages */}
            {!activeAnomaly && shouldShowSendButton() && (
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={
                    currentStage === MissionStage.DRILL1
                      ? "Respond to primary drill..."
                      : currentStage === MissionStage.DRILL2
                      ? "Respond to secondary drill..."
                      : "Share your final reflection..."
                  }
                  className="min-h-[120px] text-base bg-input border-neuro-border resize-y"
                  disabled={isStreaming}
                />
                <VoiceRecorder
                  onTranscription={(text) => {
                    setInput((prev) => prev + (prev ? " " : "") + text);
                  }}
                  disabled={isStreaming}
                />
              </div>
            )}

            {/* Action Buttons — one conversation action tied to the text box
                above it, one clearly-primary advance action that names its
                destination. Never two identical full-width buttons. */}
            <div className="flex flex-col gap-2">
              {shouldShowSendButton() && (
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                  variant="outline"
                  className="w-full border-neuro-border hover:bg-primary/10 min-h-[44px]"
                >
                  {isStreaming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Transmitting...
                    </>
                  ) : (
                    "Send to Echelon"
                  )}
                </Button>
              )}
              {readyToAdvance && shouldShowSendButton() && !isStreaming && (
                <>
                  <p className="text-xs text-center text-muted-foreground pt-1">
                    Response logged. Keep talking above — or advance when you're ready:
                  </p>
                  <Button
                    onClick={handleAdvanceStage}
                    className="w-full bg-neuro-cyan hover:bg-neuro-cyan/90 text-background min-h-[44px] shadow-[0_0_18px_rgba(6,182,212,0.45)]"
                  >
                    {getAdvanceLabel()}
                  </Button>
                </>
              )}

              {shouldShowStageAdvanceButton() && (
                <Button
                  onClick={handleAdvanceStage}
                  disabled={isStreaming}
                  variant="outline"
                  className="w-full border-neuro-cyan text-neuro-cyan hover:bg-neuro-cyan/10 min-h-[44px]"
                >
                  {currentStage === MissionStage.BRIEFING && "Begin Primary Drill →"}
                  {currentStage === MissionStage.VIDEO && "Continue to Integration →"}
                  {currentStage === MissionStage.HP && "Begin Secondary Drill →"}
                  {currentStage === MissionStage.DEBRIEF && "Final Reflection →"}
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {showExportReminder ? (
              <div className="space-y-3 p-4 bg-neuro-orange/10 border border-neuro-orange/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 text-neuro-orange mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Export Your Progress
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You've selected manual backup. Export your training data now to protect your progress.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleExportState}
                    variant="default"
                    className="flex-1 bg-neuro-orange hover:bg-neuro-orange/90"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Now
                  </Button>
                  <Button
                    onClick={() => setShowExportReminder(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Skip
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Advancing to next lesson...
                </p>
              </div>
            )}
            {missionRecord && (
              <div className="p-4 rounded-lg border border-neuro-cyan/30 bg-neuro-cyan/5 space-y-3 text-left">
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-neuro-cyan">
                  Mission Record — written to your Field Guide
                </p>
                {missionRecord.patterns.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {[...new Set(missionRecord.patterns)].map((p) => (
                      <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                    ))}
                    {missionRecord.traitSignals.map((t) => (
                      <Badge key={t} variant="outline" className="text-xs border-neuro-cyan/50 text-neuro-cyan">{t}</Badge>
                    ))}
                  </div>
                )}
                {missionRecord.echelonRead ? (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neuro-purple mb-1">
                      Echelon's read
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                      {missionRecord.echelonRead}
                    </p>
                  </div>
                ) : hasOperatorAIKey() ? (
                  <p className="text-xs text-muted-foreground italic">Echelon is writing its read of this mission…</p>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { window.location.href = "/field-guide?tab=missions"; }}
                  className="text-muted-foreground hover:text-neuro-cyan px-0"
                >
                  Open the full record →
                </Button>
              </div>
            )}
            <Button
              onClick={() => setShowTransmissionModal(true)}
              variant="outline"
              className="w-full border-neuro-cyan/50 text-neuro-cyan hover:bg-neuro-cyan/10"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Send Transmission
            </Button>
          </div>
        )}
      </div>

      {/* Transmission Modal */}
      <TransmissionModal
        open={showTransmissionModal}
        onOpenChange={setShowTransmissionModal}
        callsign={state.user.vanguard.callsign || "UNKNOWN"}
      />
    </Card>
      )}
    </>
  );
}
