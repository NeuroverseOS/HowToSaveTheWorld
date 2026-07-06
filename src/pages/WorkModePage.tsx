import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Lightbulb, Hammer, Users } from "lucide-react";
import { loadState } from "@/lib/state-engine";
import { getWorkModePower } from "@/lib/work-engine";

export default function WorkModePage() {
  const navigate = useNavigate();
  const [power, setPower] = useState({ design: 0, build: 0, lead: 0 });

  useEffect(() => {
    const state = loadState();
    if (!state) {
      navigate("/dashboard");
      return;
    }

    // Every mode is open. Training doesn't gate the lens — it powers it.
    setPower(getWorkModePower(state.progress.lessons_completed));
  }, [navigate]);

  const handleModeSelect = (mode: "design" | "build" | "lead") => {
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
      phaseLabel: "Design missions (1–30)"
    },
    {
      id: "build" as const,
      title: "Build Mode",
      description: "Execution, tasks, project planning",
      icon: Hammer,
      color: "text-neuro-cyan",
      bgColor: "bg-neuro-cyan/10",
      borderColor: "border-neuro-cyan/30",
      phaseLabel: "Build missions (31–60)"
    },
    {
      id: "lead" as const,
      title: "Lead Mode",
      description: "People, influence, alignment",
      icon: Users,
      color: "text-neuro-orange",
      bgColor: "bg-neuro-orange/10",
      borderColor: "border-neuro-orange/30",
      phaseLabel: "Lead missions (61–90)"
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
            will feel. Every lens is open from day one — and every mission you complete makes
            it sharper, because Echelon coaches with the traits and patterns your training
            writes into your record.
          </p>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const missionsIn = power[mode.id];

            return (
              <Card
                key={mode.id}
                className={`relative p-6 cursor-pointer transition-all ${mode.borderColor} hover:bg-card/60`}
                onClick={() => handleModeSelect(mode.id)}
              >
                <div className={`${mode.bgColor} ${mode.borderColor} border rounded-lg p-4 mb-4`}>
                  <Icon className={`h-8 w-8 ${mode.color}`} />
                </div>

                <h3 className={`text-xl font-bold mb-2 ${mode.color}`}>
                  {mode.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {mode.description}
                </p>

                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Lens power</span>
                    <span className="font-mono">{missionsIn}/30</span>
                  </div>
                  <Progress value={(missionsIn / 30) * 100} className="h-1.5" />
                  <p className="text-[11px] text-muted-foreground/80">
                    {missionsIn === 0
                      ? `Works now — sharpens with every ${mode.phaseLabel.split(" ")[0]} mission you finish.`
                      : `Powered by ${missionsIn} of 30 ${mode.phaseLabel}.`}
                  </p>
                </div>

                <Button className={`w-full ${mode.color}`} variant="outline">
                  Enter {mode.title}
                </Button>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
