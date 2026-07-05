import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight } from "lucide-react";
import { calculateArchetypes } from "@/lib/archetype-scoring";

interface ArchetypeAssessmentProps {
  callsign?: string;
  onComplete: (archetypes: { primary: string; shadow: string; rising: string }) => void;
}

interface ScenarioChoice {
  text: string;
}

interface ShuffledChoice {
  text: string;
  originalIndex: number; // Track original position for scoring
}

interface Scenario {
  title: string;
  description: string;
  choices: [ScenarioChoice, ScenarioChoice, ScenarioChoice, ScenarioChoice]; // Exactly 4 choices
}

// Canonical 12 Scenarios — v2 (rebalanced coverage; see docs audit)
// Choice order here is canonical A-D for scoring (SCENARIO_MAPPINGS);
// the UI shuffles display order.
const scenarios: Scenario[] = [
  {
    title: "The Unexpected Spotlight",
    description: "A project you care about just got unexpected press attention — traffic is spiking, questions are pouring in, and the team is giddy but scattered.",
    choices: [
      { text: "Remind everyone what this moment is for: paint where this attention could take the mission if it's channeled." },
      { text: "Capture what's happening and why it hit now — the story of this spike will teach the team more than the spike itself." },
      { text: "Check the infrastructure first: will the site, the docs, the onboarding flow hold under this load?" },
      { text: "Dig into the traffic data: who exactly is arriving, from where, and what pattern does that reveal?" },
    ],
  },
  {
    title: "The Room That Shifted",
    description: "Midway through a community call, you sense the energy has gone wrong — people are polite, but something underneath has shifted.",
    choices: [
      { text: "Change the format on the spot: drop the agenda, open the floor, follow where the room actually wants to go." },
      { text: "Say nothing yet; watch who has gone quiet, who is performing, and what interest might be moving under the surface." },
      { text: "Name what you've observed across the last few calls: something changed three weeks ago — here's the thread you're seeing." },
      { text: "Address the feeling directly and gently: pause everything and ask how everyone is actually doing with this." },
    ],
  },
  {
    title: "The Fork in the Build",
    description: "Your team must choose between two technical paths, and the debate has gone circular for a week.",
    choices: [
      { text: "Prototype both paths' riskiest piece; let working code end the debate." },
      { text: "Step back and study how each path behaves under the conditions everyone's ignoring — edge cases decide this." },
      { text: "Reframe the question: which path still makes sense in the world you believe is coming five years out?" },
      { text: "Pick the one that ships this month; motion will teach you faster than analysis." },
    ],
  },
  {
    title: "The Silent Node",
    description: "A key volunteer suddenly goes silent during your project's most critical week.",
    choices: [
      { text: "Redistribute their work fluidly and keep moving; the structure can flex around a missing node." },
      { text: "Look at what preceded the silence — their last messages, commits, meetings — for the signal everyone missed." },
      { text: "Patch the process gap first so nothing else depends on a single person, then reach out." },
      { text: "Consider their whole arc with the project; this silence is a chapter in a longer story that tells you what it means." },
    ],
  },
  {
    title: "The Copied Work",
    description: "You discover a rival project quietly copied your open-source work without credit.",
    choices: [
      { text: "Diff their code against yours and build the technical evidence trail before deciding anything." },
      { text: "Ask quietly: who benefits from this, who funded it, and what does the move reveal about their strategy?" },
      { text: "Out-ship them; the best answer to a copy is a version they can't keep up with." },
      { text: "Zoom out: if the mission is adoption, is this theft — or proof the idea is winning?" },
    ],
  },
  {
    title: "The Funder's Offer",
    description: "A funder offers your community significant money — with strings you suspect could bend the mission.",
    choices: [
      { text: "Model the deal precisely: map every string to the decision it constrains, and price the mission-drift." },
      { text: "Design safeguards: what structure would let you take the resources while making capture mechanically impossible?" },
      { text: "Take the pulse of the community first; money that fractures trust costs more than it buys." },
      { text: "Take it and move; underfunded purity is how movements die, and momentum builds leverage to renegotiate." },
    ],
  },
  {
    title: "The Public Rift",
    description: "Two respected members of your community are in escalating public conflict, and people are starting to pick sides.",
    choices: [
      { text: "Track the dispute's actual pattern: where it started, what triggers each flare — the structure explains it." },
      { text: "Get between them informally, in motion — a walk, a side channel — where positions can soften off-stage." },
      { text: "Tend to the community's emotional field first; the bystanders' fear is the real contagion." },
      { text: "Find what the fight is actually about — it is rarely the stated topic — and address that quietly." },
    ],
  },
  {
    title: "The Failed Launch",
    description: "Your project just failed publicly — a launch flopped, and critics are enjoying it.",
    choices: [
      { text: "Write the honest post-mortem story; owned failure becomes foundation, hidden failure becomes rot." },
      { text: "Re-anchor everyone in the horizon: this launch was one step in a decade-long arc, and the arc is intact." },
      { text: "Absorb it and adapt fast — salvage what worked, reshape around what didn't, before the moment hardens." },
      { text: "Isolate the precise failure variable; a flop is not a diagnosis." },
    ],
  },
  {
    title: "The Stalled Initiative",
    description: "You're handed leadership of a stalled initiative with a demoralized team and a skeptical sponsor.",
    choices: [
      { text: "Audit the machinery first: find the broken dependency everyone works around, and fix it visibly." },
      { text: "Meet each person alone and listen; stalled projects are usually made of quietly discouraged people." },
      { text: "Manufacture one fast, real win in week one; nothing revives a team like unexpected motion." },
      { text: "Reconstruct how it stalled — the decisions, the drift — so the restart doesn't replay the same plot." },
    ],
  },
  {
    title: "The Misinformation Wave",
    description: "A wave of misinformation about your community is spreading, and members want an aggressive response.",
    choices: [
      { text: "Trace who is amplifying it and why before responding; the visible wave usually has an invisible engine." },
      { text: "Publish the real story, documented and calm — the durable record outlasts the news cycle." },
      { text: "Rise above the exchange: restate the vision so compellingly that the noise becomes irrelevant." },
      { text: "Monitor its actual spread pattern first; most waves die alone, and fighting them feeds them." },
    ],
  },
  {
    title: "The One-Hour Window",
    description: "You have one hour with a powerful person who could change your project's trajectory.",
    choices: [
      { text: "Come with one concrete ask they can say yes to today; leave with committed action." },
      { text: "Give them the vision — make them see the future so vividly they want to be part of its story." },
      { text: "Bring the analysis no one else has shown them; the insight they can't unsee is the hook." },
      { text: "Show the working system: the demo, the numbers, the proof this thing runs." },
    ],
  },
  {
    title: "The Culture Dilution",
    description: "Your community is growing so fast that the original culture is visibly diluting.",
    choices: [
      { text: "Invest in relational infrastructure: welcomers, mentors, spaces where new people are woven in, not just added." },
      { text: "Let culture evolve; guide the current instead of damming it — what matters will persist in new forms." },
      { text: "Watch precisely which norms are eroding and where; culture doesn't dilute evenly, and the pattern says what to protect." },
      { text: "Identify the informal influencers among the newcomers and quietly align them; culture moves through people, not policy." },
    ],
  },
];

export function ArchetypeAssessment({ callsign, onComplete }: ArchetypeAssessmentProps) {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [choices, setChoices] = useState<number[]>([]);
  const [shuffledChoices, setShuffledChoices] = useState<ShuffledChoice[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Shuffle choices when scenario changes
  useEffect(() => {
    const scenario = scenarios[currentScenario];
    const choicesWithIndex: ShuffledChoice[] = scenario.choices.map((choice, idx) => ({
      text: choice.text,
      originalIndex: idx
    }));
    
    // Fisher-Yates shuffle
    const shuffled = [...choicesWithIndex];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    setShuffledChoices(shuffled);
    setIsTransitioning(false);
  }, [currentScenario]);

  const handleChoice = (originalIndex: number) => {
    setIsTransitioning(true);
    const newChoices = [...choices, originalIndex];
    setChoices(newChoices);

    // Longer transition delay to ensure buttons fully fade out
    setTimeout(() => {
      if (currentScenario < scenarios.length - 1) {
        setCurrentScenario(currentScenario + 1);
      } else {
        // Calculate final archetypes using canonical scoring engine
        const result = calculateArchetypes(newChoices);
        onComplete(result);
      }
    }, 400);
  };

  const progress = ((currentScenario + 1) / scenarios.length) * 100;
  const scenario = scenarios[currentScenario];

  return (
    <div className="min-h-screen bg-background overflow-y-auto overflow-x-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 pb-12 sm:pb-16">
        <div className="space-y-4 sm:space-y-6 w-full">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-neuro-cyan break-words">
              {callsign ? `Vanguard ${callsign} — Archetype Assessment` : "Archetype Assessment"}
            </h1>
            {callsign && (
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                {callsign}, you will now face 12 scenarios. There are no right answers. Your responses will map your cognitive signature.
              </p>
            )}
            <p className="text-xs sm:text-sm text-muted-foreground">
              Scenario {currentScenario + 1} of {scenarios.length}
            </p>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Scenario */}
          <div className={`space-y-4 sm:space-y-6 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            <div className="space-y-2 sm:space-y-3">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-neuro-cyan">
                {scenario.title}
              </h2>
              <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
                {scenario.description}
              </p>
            </div>

            {/* Choices */}
            <div className="space-y-2 sm:space-y-3 w-full">
              {!isTransitioning && shuffledChoices.map((choice, idx) => (
                <Button
                  key={idx}
                  onClick={() => handleChoice(choice.originalIndex)}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 sm:py-4 px-3 sm:px-4 hover:bg-neuro-cyan/10 hover:border-neuro-cyan transition-all duration-200 text-xs sm:text-sm flex items-start gap-2 whitespace-normal"
                >
                  <span className="flex-1 break-words min-w-0">{choice.text}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-neuro-cyan" />
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
