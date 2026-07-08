import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { loadACEBox08, type ACEFile } from "@/lib/ace-loader";

interface HelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpModal({ open, onOpenChange }: HelpModalProps) {
  const navigate = useNavigate();
  const [aceData, setAceData] = useState<Map<string, ACEFile> | null>(null);

  useEffect(() => {
    if (open) {
      loadACEBox08()
        .then(data => setAceData(data))
        .catch(err => console.error('Failed to load ACE Box 08:', err));
    }
  }, [open]);

  const handleViewFullArchive = () => {
    onOpenChange(false);
    navigate("/system-info");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-2xl bg-gradient-to-r from-neuro-cyan to-neuro-purple bg-clip-text text-transparent">
            NeuroVerse OS Guide
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="about" className="w-full">
          <TabsList className="w-full justify-start px-6 bg-transparent border-b rounded-none h-auto">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="data">Your Data</TabsTrigger>
            <TabsTrigger value="glossary">Glossary</TabsTrigger>
            <TabsTrigger value="help">Help</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] px-6 py-4">
            <TabsContent value="about" className="space-y-4 mt-0">
              <h3 className="text-lg font-semibold text-neuro-cyan">About the System</h3>
              <div className="space-y-3 text-sm text-foreground/90">
                <p>
                  NeuroVerse OS is not a course. It is an operating system for emergent intelligence.
                </p>
                <p>
                  You are not here to consume content. You are here to integrate patterns, frameworks, and awareness through direct experience.
                </p>
                <p>
                  The system adapts to your archetype signature, tracks your reflections, and builds a personalized Field Guide as you progress.
                </p>
                <p>
                  Everything runs locally. Your data, your insights, your intelligence.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="training" className="space-y-4 mt-0">
              <h3 className="text-lg font-semibold text-neuro-cyan">How Training Works</h3>
              <div className="space-y-4 text-sm text-foreground/90">
                <div>
                  <h4 className="font-semibold text-neuro-purple mb-2">Lesson Flow</h4>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>Echelon delivers mission briefing</li>
                    <li>Core lesson content is revealed</li>
                    <li>You engage in guided reflection</li>
                    <li>Field Guide updates with your insights</li>
                    <li>Mission closes, integration begins</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold text-neuro-purple mb-2">Echelon's Role</h4>
                  <p>
                    Echelon is the intelligence layer. It does not teach. It observes, reflects, and questions. Your dialogue with Echelon shapes your training path.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-neuro-purple mb-2">Your Role</h4>
                  <p>
                    Engage authentically. There are no right answers. Your reflections become your operating manual. Depth over speed. Integration over completion.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="data" className="space-y-4 mt-0">
              <h3 className="text-lg font-semibold text-neuro-cyan">Your Data</h3>
              <div className="space-y-3 text-sm text-foreground/90">
                <p>
                  <strong>Local-First Architecture:</strong> All your training data, reflections, and state are stored locally in your browser. No cloud dependency for core functionality.
                </p>
                <p>
                  <strong>Conversation Storage:</strong> Your dialogue with Echelon is saved per lesson to maintain context and enable meaningful Field Guide generation.
                </p>
                <p>
                  <strong>State Tracking:</strong> Progress, archetype evolution, badges, and Field Guide entries are tracked in your local state file.
                </p>
                <p>
                  <strong>Privacy:</strong> Your reflections and insights remain private. Echelon interactions use AI processing but your core data stays local.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="glossary" className="space-y-4 mt-0">
              <h3 className="text-lg font-semibold text-neuro-cyan">Glossary</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold text-neuro-purple">Echelon</h4>
                  <p className="text-foreground/90">
                    The intelligence layer of the NeuroVerse. Not a teacher or guide, but an observing intelligence that shapes your training through dialogue.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-neuro-purple">Field Guide</h4>
                  <p className="text-foreground/90">
                    Your personalized operating manual. Generated from your reflections and insights, updated after each lesson.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-neuro-purple">Archetype</h4>
                  <p className="text-foreground/90">
                    Your cognitive signature. Not a label but a lens. Archetypes include Observer, Pioneer, Architect, and Shapeshifter.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-neuro-purple">Fog Level</h4>
                  <p className="text-foreground/90">
                    The degree of uncertainty and emergence in a lesson. Higher fog = more ambiguity, requiring deeper pattern recognition.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-neuro-purple">Mission Badge</h4>
                  <p className="text-foreground/90">
                    Recognition markers earned through lesson completion and insight depth. Not gamification—acknowledgment of integration.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-neuro-purple">Recruit</h4>
                  <p className="text-foreground/90">
                    You. The intelligence undergoing training. Not a student—a participant in emergent intelligence development.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="help" className="space-y-4 mt-0">
              <h3 className="text-lg font-semibold text-neuro-cyan">Help & Support</h3>
              <div className="space-y-3 text-sm text-foreground/90">
                <div>
                  <h4 className="font-semibold text-neuro-purple mb-2">Technical Issues</h4>
                  <p>
                    If Echelon is not responding, check your browser console for errors. Clear browser cache if lessons fail to load.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-neuro-purple mb-2">Training Questions</h4>
                  <p>
                    If you are unsure how to engage with a reflection prompt, remember: there are no wrong answers. Echelon responds to depth and authenticity, not correctness.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-neuro-purple mb-2">Progress Issues</h4>
                  <p>
                    Your progress is saved locally. If you switch devices or browsers, your state will not carry over unless you manually export/import your state file.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-neuro-purple mb-2">Contact</h4>
                  <p>
                    For deeper support or feedback, reach out through the NeuroVerse channels or your training administrator.
                  </p>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>

          {/* Footer with link to full archive */}
          <div className="px-6 py-4 border-t border-border/40">
            <Button 
              onClick={handleViewFullArchive}
              variant="outline" 
              className="w-full justify-between group"
            >
              <span>View Full System Archive</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
