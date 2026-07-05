import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { loadState, saveState } from "@/lib/state-engine";
import { toast } from "@/hooks/use-toast";

export default function WorkContextPage() {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [currentMode, setCurrentMode] = useState<"design" | "build" | "lead" | null>(null);

  useEffect(() => {
    const state = loadState();
    if (!state || !state.work?.current_mode) {
      navigate("/work");
      return;
    }
    setCurrentMode(state.work.current_mode);
  }, [navigate]);

  const handleBeginSession = () => {
    if (!projectName.trim() || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both project name and description.",
        variant: "destructive"
      });
      return;
    }

    const state = loadState();
    if (!state || !state.work) return;

    // Save work context
    state.work.current_context = {
      project_name: projectName,
      description: description,
      tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
      created_at: new Date().toISOString()
    };

    saveState(state);
    navigate("/work/session");
  };

  const modeLabels = {
    design: "Design Mode",
    build: "Build Mode",
    lead: "Lead Mode"
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-neuro-border bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/work")}
              className="text-neuro-cyan hover:text-neuro-cyan/80"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Mode Selection
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neuro-cyan mb-2">
            {currentMode ? modeLabels[currentMode] : 'Work Context'}
          </h1>
          <p className="text-muted-foreground">
            Describe what you want to work on. This becomes the foundation of your session.
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Product Launch Strategy"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you're working on, the challenges you're facing, or what you want to explore..."
                className="mt-2 min-h-[150px]"
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., strategy, q1-2025, high-priority"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separate tags with commas
              </p>
            </div>

            <Button
              onClick={handleBeginSession}
              className="w-full bg-neuro-cyan hover:bg-neuro-cyan/90 text-background"
            >
              Begin Session
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
