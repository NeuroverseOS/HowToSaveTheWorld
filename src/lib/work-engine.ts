// NeuroVerse Work Mode Engine
// Parallel to mission-engine.ts, handles Design/Build/Lead modes

export type WorkMode = "design" | "build" | "lead";
export type WorkStage = "context_lock" | "clarify" | "frame" | "pathfind" | "deepen" | "synthesize" | "loop";

export interface WorkContext {
  projectName: string;
  description: string;
  tags: string[];
  createdAt: string;
}

export interface WorkSession {
  mode: WorkMode;
  context: WorkContext;
  currentStage: WorkStage;
  startedAt: string;
  messages: Array<{ role: string; content: string }>;
}

// Stage progression logic
const WORK_STAGE_SEQUENCE: WorkStage[] = [
  "context_lock",
  "clarify",
  "frame",
  "pathfind",
  "deepen",
  "synthesize",
  "loop"
];

export function startWorkSession(mode: WorkMode, context: WorkContext): WorkSession {
  return {
    mode,
    context,
    currentStage: "context_lock",
    startedAt: new Date().toISOString(),
    messages: []
  };
}

export function advanceWorkStage(currentStage: WorkStage): WorkStage | null {
  const currentIndex = WORK_STAGE_SEQUENCE.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === WORK_STAGE_SEQUENCE.length - 1) {
    return null; // End of sequence or loop back
  }
  return WORK_STAGE_SEQUENCE[currentIndex + 1];
}

export function getWorkStageLabel(stage: WorkStage): string {
  const labels: Record<WorkStage, string> = {
    context_lock: "Context Lock",
    clarify: "Clarification",
    frame: "Reframing",
    pathfind: "Pathfinding",
    deepen: "Deepening",
    synthesize: "Synthesis",
    loop: "Continue"
  };
  return labels[stage];
}

/**
 * Work Mode power: how many missions of each phase feed the lens.
 * The lenses are open to everyone — training doesn't gate them, it sharpens
 * them: every completed mission adds traits and pattern for Echelon to
 * coach with.
 */
export function getWorkModePower(lessonsCompleted: number[]): {
  design: number;
  build: number;
  lead: number;
} {
  return {
    design: lessonsCompleted.filter((n) => n >= 1 && n <= 30).length,
    build: lessonsCompleted.filter((n) => n >= 31 && n <= 60).length,
    lead: lessonsCompleted.filter((n) => n >= 61 && n <= 90).length,
  };
}

export function checkWorkModeUnlocks(lessonsCompleted: number[]): {
  design: boolean;
  build: boolean;
  lead: boolean;
} {
  // Design unlocks at lesson 30 (lessons 1-30 complete)
  const designLessons = lessonsCompleted.filter(n => n >= 1 && n <= 30);
  // Build unlocks at lesson 60 (lessons 31-60 complete)
  const buildLessons = lessonsCompleted.filter(n => n >= 31 && n <= 60);
  // Lead unlocks at lesson 90 (lessons 61-90 complete)
  const leadLessons = lessonsCompleted.filter(n => n >= 61 && n <= 90);
  
  return {
    design: designLessons.length === 30,
    build: buildLessons.length === 30,
    lead: leadLessons.length === 30,
  };
}
