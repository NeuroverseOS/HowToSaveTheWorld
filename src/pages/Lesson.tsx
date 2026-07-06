import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LessonRunner } from "@/components/neuroverse/LessonRunner";
import { loadState, saveState } from "@/lib/state-engine";
import { toast } from "@/hooks/use-toast";
import { getLessonById } from "@/lib/lesson-loader";
import type { Lesson as LessonType } from "@/lib/lesson-queries";
import { useUnlockAnimationContext } from "@/components/neuroverse/UnlockAnimationProvider";
import { checkWorkModeUnlocks } from "@/lib/work-engine";

export default function Lesson() {
  const navigate = useNavigate();
  const { lessonId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "active";
  const { triggerUnlock } = useUnlockAnimationContext();
  
  const [lesson, setLesson] = useState<LessonType | null>(null);
  const [userState, setUserState] = useState(loadState());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // No auth required - local-first mode
    loadLesson();
  }, [lessonId]);

  const loadLesson = async () => {
    if (!lessonId) {
      navigate("/dashboard");
      return;
    }

    try {
      const lessonData = await getLessonById(parseInt(lessonId));
      if (!lessonData) throw new Error("Lesson not found");
      setLesson(lessonData);
    } catch (error) {
      console.error("Error loading lesson:", error);
      toast({
        title: "Error",
        description: "Failed to load lesson",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLessonComplete = async (reflection: string) => {
    if (!lesson || !userState || mode === "replay") return;

    // Update state
    const updatedState = { ...userState };
    
    // Mark as completed. Progress is tracked by lesson_number (1-96) —
    // the Dashboard and Mission Archive both read it that way.
    if (!updatedState.progress.lessons_completed.includes(lesson.lesson_number)) {
      updatedState.progress.lessons_completed.push(lesson.lesson_number);
    }

    // Advance to the next lesson by number
    const { getAllLessons } = await import("@/lib/lesson-loader");
    const allLessons = await getAllLessons();
    const nextLesson = allLessons.find(l => l.lesson_number === lesson.lesson_number + 1);

    if (nextLesson) {
      updatedState.progress.current_lesson_id = nextLesson.lesson_number;
    }
    
    // The runner hands back the operator's combined reflections
    const fullReflection = reflection.trim();

    updatedState.reflections.push({
      lesson_id: lesson.id,
      content: fullReflection,
      timestamp: new Date().toISOString(),
      mission_choice: null,
    });

    saveState(updatedState);
    setUserState(updatedState);

    // Check for Work Mode unlocks at milestone lessons
    const completedLessons = updatedState.progress.lessons_completed;
    const unlocks = checkWorkModeUnlocks(completedLessons);
    const callsign = updatedState.user.vanguard?.callsign || 'UNKNOWN';
    
    // Update work mode unlocks in state
    if (!updatedState.work) {
      updatedState.work = {
        modes_unlocked: { design: false, build: false, lead: false },
        early_unlock_enabled: false,
        current_mode: null,
        current_context: null,
        work_history: [],
      };
    }
    
    // Trigger unlock animations for newly unlocked modes
    if (lesson.lesson_number === 30 && unlocks.design && !updatedState.work.modes_unlocked.design) {
      updatedState.work.modes_unlocked.design = true;
      saveState(updatedState);
      setTimeout(() => {
        triggerUnlock({
          type: 'work_mode_design',
          data: {
            name: callsign,
            description: 'You have proven pattern fluency, frame control, and structural reasoning. Your thinking now meets the threshold for architectural cognition. Design Mode is yours.',
          }
        });
      }, 1000);
    }
    
    if (lesson.lesson_number === 60 && unlocks.build && !updatedState.work.modes_unlocked.build) {
      updatedState.work.modes_unlocked.build = true;
      saveState(updatedState);
      setTimeout(() => {
        triggerUnlock({
          type: 'work_mode_build',
          data: {
            name: callsign,
            description: 'Your execution signatures show consistency, discipline, and clarity. You are ready to construct the future, piece by piece. Build Mode is yours.',
          }
        });
      }, 1000);
    }
    
    if (lesson.lesson_number === 90 && unlocks.lead && !updatedState.work.modes_unlocked.lead) {
      updatedState.work.modes_unlocked.lead = true;
      saveState(updatedState);
      setTimeout(() => {
        triggerUnlock({
          type: 'work_mode_lead',
          data: {
            name: callsign,
            description: 'You now demonstrate an emergent leadership arc: foresight, empathy, conflict navigation, and narrative control. Lead Mode is yours.',
          }
        });
      }, 1000);
    }

    // Optional: Save to cloud if authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      supabase
        .from("user_reflections")
        .insert({
          user_id: session.user.id,
          lesson_id: lesson.id,
          reflection_content: fullReflection,
        })
        .then(({ error }) => {
          if (error) console.error("Failed to save reflection:", error);
        });
    }

    toast({
      title: "Mission Complete",
      description: "Advancing to next lesson...",
    });

    setTimeout(() => {
      navigate("/dashboard");
    }, 2000);
  };

  if (isLoading || !lesson || !userState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-neuro-cyan animate-pulse">Loading mission...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-3">
        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={() => navigate("/missions")}
            className="text-muted-foreground hover:text-neuro-cyan transition-colors"
          >
            ← Mission Archive
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-muted-foreground hover:text-neuro-cyan transition-colors"
          >
            Dashboard
          </button>
        </div>
        <LessonRunner
          lesson={lesson}
          userId={userState.user.id}
          state={userState}
          onLessonComplete={handleLessonComplete}
          mode={mode as "active" | "replay"}
        />
      </div>
    </div>
  );
}
