import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Guide() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-neuro-border bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-neuro-cyan to-neuro-purple bg-clip-text text-transparent">
              NeuroVerse OS Guide
            </h1>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 md:py-12">
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto flex-wrap">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="data">Your Data</TabsTrigger>
            <TabsTrigger value="glossary">Glossary</TabsTrigger>
            <TabsTrigger value="help">Help</TabsTrigger>
          </TabsList>

          <div className="py-6 sm:py-8 max-w-4xl">
            <TabsContent value="about" className="space-y-6 mt-0">
              <h3 className="text-xl sm:text-2xl font-semibold text-neuro-cyan">About the System</h3>
              <div className="space-y-4 text-sm sm:text-base text-foreground/90">
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

            <TabsContent value="training" className="space-y-6 mt-0">
              <h3 className="text-xl sm:text-2xl font-semibold text-neuro-cyan">How Training Works</h3>
              <div className="space-y-6 text-sm sm:text-base text-foreground/90">
                <div>
                  <h4 className="font-semibold text-neuro-purple mb-3 text-base sm:text-lg">Lesson Flow</h4>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>Echelon delivers mission briefing</li>
                    <li>Core lesson content is revealed</li>
                    <li>You engage in guided reflection</li>
                    <li>Field Guide updates with your insights</li>
                    <li>Mission closes, integration begins</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold text-neuro-purple mb-3 text-base sm:text-lg">Echelon's Role</h4>
                  <p>
                    Echelon is the intelligence layer. It does not teach. It observes, reflects, and questions. Your dialogue with Echelon shapes your training path.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-neuro-purple mb-3 text-base sm:text-lg">Your Role</h4>
                  <p>
                    Engage authentically. There are no right answers. Your reflections become your operating manual. Depth over speed. Integration over completion.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="data" className="space-y-6 mt-0">
              <h3 className="text-xl sm:text-2xl font-semibold text-neuro-cyan">Your Data</h3>
              <div className="space-y-4 text-sm sm:text-base text-foreground/90">
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

            <TabsContent value="glossary" className="space-y-6 mt-0">
              <h3 className="text-xl sm:text-2xl font-semibold text-neuro-cyan">Glossary</h3>
              <div className="space-y-5 text-sm sm:text-base">
                <div>
                  <h4 className="font-semibold text-neuro-purple text-base sm:text-lg mb-2">Echelon</h4>
                  <p className="text-foreground/90">
                    The intelligence layer of the NeuroVerse. Not a teacher or guide, but an observing intelligence that shapes your training through dialogue.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-neuro-purple text-base sm:text-lg mb-2">Field Guide</h4>
                  <p className="text-foreground/90">
                    Your personalized operating manual. Generated from your reflections and insights, updated after each lesson.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-neuro-purple text-base sm:text-lg mb-2">Archetype</h4>
                  <p className="text-foreground/90">
                    Your cognitive signature. Not a label but a lens. Archetypes include Observer, Pioneer, Architect, and Shapeshifter.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-neuro-purple text-base sm:text-lg mb-2">Fog Level</h4>
                  <p className="text-foreground/90">
                    The degree of uncertainty and emergence in a lesson. Higher fog = more ambiguity, requiring deeper pattern recognition.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-neuro-purple text-base sm:text-lg mb-2">Mission Badge</h4>
                  <p className="text-foreground/90">
                    Recognition markers earned through lesson completion and insight depth. Not gamification—acknowledgment of integration.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-neuro-purple text-base sm:text-lg mb-2">Recruit</h4>
                  <p className="text-foreground/90">
                    You. The intelligence undergoing training. Not a student—a participant in emergent intelligence development.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="help" className="space-y-6 mt-0">
              <h3 className="text-xl sm:text-2xl font-semibold text-neuro-cyan">Help & Support</h3>
              <div className="space-y-5 text-sm sm:text-base text-foreground/90">
                <div>
                  <h4 className="font-semibold text-neuro-purple mb-3 text-base sm:text-lg">Technical Issues</h4>
                  <p>
                    If Echelon is not responding, check your browser console for errors. Clear browser cache if lessons fail to load.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-neuro-purple mb-3 text-base sm:text-lg">Training Questions</h4>
                  <p>
                    If you are unsure how to engage with a reflection prompt, remember: there are no wrong answers. Echelon responds to depth and authenticity, not correctness.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-neuro-purple mb-3 text-base sm:text-lg">Progress Issues</h4>
                  <p>
                    Your progress is saved locally. If you switch devices or browsers, your state will not carry over unless you manually export/import your state file.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-neuro-purple mb-3 text-base sm:text-lg">Contact</h4>
                  <p>
                    For deeper support or feedback, reach out through the NeuroVerse channels or your training administrator.
                  </p>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
