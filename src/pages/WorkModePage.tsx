import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Lock, Lightbulb, Hammer, Users } from "lucide-react";
import { loadState } from "@/lib/state-engine";
import { checkWorkModeUnlocks } from "@/lib/work-engine";

export default function WorkModePage() {
  const navigate = useNavigate();
  const [unlocks, setUnlocks] = useState({ design: false, build: false, lead: false });
  const [earlyUnlockEnabled, setEarlyUnlockEnabled] = useState(false);

  useEffect(() => {
    const state = loadState();
    if (!state) {
      navigate("/dashboard");
      return;
    }

    // Check work mode unlocks
    const unlockedModes = checkWorkModeUnlocks(state.progress.lessons_completed);
    setUnlocks(unlockedModes);
    
    // Check early unlock setting
    setEarlyUnlockEnabled(state.work?.early_unlock_enabled || false);
  }, [navigate]);

  const handleModeSelect = (mode: "design" | "build" | "lead") => {
    const isUnlocked = unlocks[mode] || earlyUnlockEnabled;
    
    if (!isUnlocked) {
      return; // Do nothing if locked
    }
    
    // Save selected mode and navigate to context page
    const state = loadState();
    if (state) {
      state.work = state.work || {
        modes_unlocked: { design: false, build: false, lead: false },
        early_unlock_enabled: false,
        current_mode: null,
        current_context: null,
        work_history: []
      };
      state.work.current_mode = mode;
      navigate("/work/context");
    }
  };

  const modes = [
    {
      id: "design" as const,
      title: "Design Mode",
      description: "Strategy, vision, systems thinking",
      icon: Lightbulb,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      unlockRequirement: "Complete Design Session (Lessons 1-30)"
    },
    {
      id: "build" as const,
      title: "Build Mode",
      description: "Execution, tasks, project planning",
      icon: Hammer,
      color: "text-neuro-cyan",
      bgColor: "bg-neuro-cyan/10",
      borderColor: "border-neuro-cyan/30",
      unlockRequirement: "Complete Build Session (Lessons 31-60)"
    },
    {
      id: "lead" as const,
      title: "Lead Mode",
      description: "People, influence, alignment",
      icon: Users,
      color: "text-neuro-orange",
      bgColor: "bg-neuro-orange/10",
      borderColor: "border-neuro-orange/30",
      unlockRequirement: "Complete Lead Session (Lessons 61-90)"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-neuro-border bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="text-neuro-cyan hover:text-neuro-cyan/80"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neuro-cyan mb-2">Work Mode</h1>
          <p className="text-muted-foreground">
            Apply your trained intelligence to real-world work. Choose your operational mode.
          </p>
        </div>

        <Card className="p-6 mb-8 bg-neuro-cyan/5 border-neuro-cyan/30">
          <p className="font-semibold text-foreground mb-2">In plain terms</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Work Mode is Echelon off the training field and on your project. You describe
            something real you're working on, and your own AI coaches you through it — carrying
            everything it has earned about you: your callsign, your archetype, and the traits
            you've unlocked in missions. It does not read your raw conversations; it reads the
            identity your training built. Each mode is one lens from the course's thinking
            model — <span className="text-purple-400">Design</span> asks what form this could
            take, <span className="text-neuro-cyan">Build</span> asks what's the smallest
            actionable step, <span className="text-neuro-orange">Lead</span> asks what people
            will feel. You earn each lens by finishing its training arc.
          </p>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          {modes.map((mode) => {
            const isUnlocked = unlocks[mode.id] || earlyUnlockEnabled;
            const Icon = mode.icon;

            return (
              <Card
                key={mode.id}
                className={`relative p-6 cursor-pointer transition-all ${
                  isUnlocked 
                    ? `${mode.borderColor} hover:bg-card/60` 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => handleModeSelect(mode.id)}
              >
                {!isUnlocked && (
                  <div className="absolute top-3 right-3">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                <div className={`${mode.bgColor} ${mode.borderColor} border rounded-lg p-4 mb-4`}>
                  <Icon className={`h-8 w-8 ${mode.color}`} />
                </div>

                <h3 className={`text-xl font-bold mb-2 ${isUnlocked ? mode.color : 'text-muted-foreground'}`}>
                  {mode.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {mode.description}
                </p>

                {!isUnlocked && (
                  <Badge variant="outline" className="text-xs">
                    {mode.unlockRequirement}
                  </Badge>
                )}

                {isUnlocked && (
                  <Button className={`w-full ${mode.color}`} variant="outline">
                    Enter {mode.title}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>

        {earlyUnlockEnabled && (
          <div className="mt-6 p-4 bg-neuro-orange/10 border border-neuro-orange/30 rounded-lg">
            <p className="text-sm text-neuro-orange">
              Early Unlock is enabled. All modes are accessible regardless of mission completion.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
