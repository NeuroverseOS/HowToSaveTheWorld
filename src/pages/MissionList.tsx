import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, ChevronDown, Lock, Circle, CheckCircle2, HelpCircle, Settings as SettingsIcon, BookOpen } from "lucide-react";
import { loadState } from "@/lib/state-engine";
import type { Lesson } from "@/lib/lesson-queries";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getAllLessons, forceSupabaseRefresh } from "@/lib/lesson-loader";

interface SessionGroup {
  sessionNumber: number;
  sessionName: string;
  lessons: LessonWithStatus[];
}

interface LessonWithStatus extends Lesson {
  status: "completed" | "active" | "locked";
}

export default function MissionList() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionGroup[]>([]);
  const [openSessions, setOpenSessions] = useState<number[]>([1]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Dev bypass: Force fresh load from Supabase
    const bypassPWA = localStorage.getItem('neuroverse_bypass_pwa') === 'true';
    if (bypassPWA) {
      console.log('[MISSION LIST] Dev bypass detected, forcing Supabase refresh');
      forceSupabaseRefresh().then(() => loadMissions()).catch(err => console.error('[MISSION LIST] Failed to refresh lessons:', err));
    } else {
      loadMissions();
    }
  }, [navigate]);

  const loadMissions = async () => {
    try {
      // Load all lessons from local JSON
      const lessons = await getAllLessons();

      // Load user state
      const state = loadState();
      const currentLessonId = state?.progress.current_lesson_id || 1;
      const completedLessons = state?.progress.lessons_completed || [];

      // Group lessons into sessions and determine status.
      // Progress is tracked by lesson_number (1-96), but older builds
      // stored database row ids — accept both so no one's history reads
      // as locked.
      const lessonsWithStatus: LessonWithStatus[] = lessons.map((lesson) => {
        let status: "completed" | "active" | "locked";

        if (completedLessons.includes(lesson.lesson_number) || completedLessons.includes(lesson.id)) {
          status = "completed";
        } else if (lesson.lesson_number === currentLessonId || lesson.id === currentLessonId) {
          status = "active";
        } else {
          status = "locked";
        }

        return { ...lesson, status };
      });

      // Group by session (15 lessons per session for first 6 sessions, then post-graduation)
      const sessionGroups: SessionGroup[] = [];
      const sessionNames = [
        "The Perception Trinity",
        "Temporal Skilling",
        "Human Signal",
        "System Echoes",
        "Pattern Integration",
        "The NeuroVerse",
        "Post-Graduation Missions"
      ];

      // First 6 sessions: 15 lessons each (1-90)
      for (let i = 0; i < 6; i++) {
        const sessionLessons = lessonsWithStatus.filter(
          (l) => l.lesson_number > i * 15 && l.lesson_number <= (i + 1) * 15
        );

        if (sessionLessons.length > 0) {
          sessionGroups.push({
            sessionNumber: i + 1,
            sessionName: sessionNames[i],
            lessons: sessionLessons,
          });
        }
      }
      
      // Session 7: Post-graduation bonus missions (91-96)
      const postGradLessons = lessonsWithStatus.filter(
        (l) => l.lesson_number > 90
      );
      
      if (postGradLessons.length > 0) {
        sessionGroups.push({
          sessionNumber: 7,
          sessionName: sessionNames[6],
          lessons: postGradLessons,
        });
      }

      setSessions(sessionGroups);
      
      // Auto-open current session (based on lesson_number)
      const currentLesson = lessonsWithStatus.find(l => l.status === "active");
      if (currentLesson) {
        const currentSession = Math.ceil(currentLesson.lesson_number / 15);
        setOpenSessions([currentSession]);
      }
    } catch (error) {
      console.error("Error loading missions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSession = (sessionNumber: number) => {
    setOpenSessions((prev) =>
      prev.includes(sessionNumber)
        ? prev.filter((s) => s !== sessionNumber)
        : [...prev, sessionNumber]
    );
  };

  const handleLessonClick = (lesson: LessonWithStatus) => {
    if (lesson.status === "locked") return;
    
    // Navigate to lesson with mode parameter
    const mode = lesson.status === "completed" ? "replay" : "active";
    navigate(`/lesson/${lesson.id}?mode=${mode}`);
  };

  const getStatusIcon = (status: "completed" | "active" | "locked") => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-neuro-green" />;
      case "active":
        return <Circle className="h-5 w-5 text-neuro-cyan fill-neuro-cyan" />;
      case "locked":
        return <Lock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: "completed" | "active" | "locked") => {
    switch (status) {
      case "completed":
        return "text-neuro-green";
      case "active":
        return "text-neuro-cyan";
      case "locked":
        return "text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-mono text-sm uppercase tracking-[0.2em] text-primary animate-pulse">Loading Mission Archive...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/60">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/settings")}
              className="text-muted-foreground hover:text-foreground"
            >
              <SettingsIcon className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/field-guide")}
              className="text-muted-foreground hover:text-foreground"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Field Guide
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/guide")}
              className="text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Help
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">
            {(() => {
              const state = loadState();
              return state?.user.vanguard.callsign 
                ? `Vanguard ${state.user.vanguard.callsign} — Mission Archive`
                : "Mission Archive";
            })()}
          </h1>
          <p className="text-muted-foreground text-sm">
            96 missions across 7 sessions. Complete sequentially to unlock.
          </p>
        </div>

        {/* Sessions */}
        <div className="space-y-4">
          {sessions.map((sessionGroup) => (
            <Card key={sessionGroup.sessionNumber} className="overflow-hidden bg-card/60 backdrop-blur-sm border-border/70 transition-colors hover:border-primary/30">
              <Collapsible
                open={openSessions.includes(sessionGroup.sessionNumber)}
                onOpenChange={() => toggleSession(sessionGroup.sessionNumber)}
              >
                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
                  <div className="flex items-center gap-3">
                    <ChevronDown
                      className={`h-5 w-5 text-primary transition-transform duration-200 ${
                        openSessions.includes(sessionGroup.sessionNumber) ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                    <div className="text-left">
                      <h2 className="font-semibold tracking-tight text-foreground">
                        Session {sessionGroup.sessionNumber}
                      </h2>
                      <p className="text-sm text-primary">{sessionGroup.sessionName}</p>
                    </div>
                  </div>
                  <div className="font-mono tabular-nums text-xs text-muted-foreground">
                    {sessionGroup.lessons.filter((l) => l.status === "completed").length} / {sessionGroup.lessons.length}
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4">
                    <div className="space-y-1 border-l border-border/70 ml-2 pl-4">
                      {sessionGroup.lessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonClick(lesson)}
                          disabled={lesson.status === "locked"}
                          className={`w-full text-left p-3 rounded-md flex items-center justify-between transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            lesson.status === "locked"
                              ? "cursor-not-allowed opacity-40"
                              : "hover:bg-accent/70 cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {getStatusIcon(lesson.status)}
                            <div>
                              <div className={`font-medium text-sm ${getStatusColor(lesson.status)}`}>
                                L{lesson.lesson_number} · {lesson.lesson_title}
                              </div>
                              <div className="text-xs text-muted-foreground">{lesson.section_name}</div>
                            </div>
                          </div>
                          {lesson.status === "completed" && (
                            <span className="text-xs text-neuro-green">Replay →</span>
                          )}
                          {lesson.status === "active" && (
                            <span className="text-xs text-neuro-cyan">Continue →</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
