// Box-Stage Map - Single Source of Truth for Box Activation
// Based on Box_Stage_Map.xlsx canonical specification

export interface BoxStageMapEntry {
  stage: string;
  activeBoxes: number[];
  notes: string;
}

// Canonical Box-Stage Activation Map
export const BOX_STAGE_MAP: BoxStageMapEntry[] = [
  {
    stage: "onboarding_screen_1",
    activeBoxes: [1],
    notes: "System identity only"
  },
  {
    stage: "language_selection",
    activeBoxes: [1, 3],
    notes: "Language directive engages"
  },
  {
    stage: "assessment",
    activeBoxes: [1, 3, 4],
    notes: "Diagnostic mode"
  },
  {
    stage: "orientation_foxhole",
    activeBoxes: [1, 2, 3],
    notes: "Identity tags visible"
  },
  {
    stage: "briefing",
    activeBoxes: [1, 2, 3, 4, 6],
    notes: "Short-term memory allowed"
  },
  {
    stage: "drill1",
    activeBoxes: [1, 2, 3, 4],
    notes: "No memory visibility"
  },
  {
    stage: "video",
    activeBoxes: [1, 3, 4],
    notes: "No identity tags"
  },
  {
    stage: "hp",
    activeBoxes: [1, 2, 3, 4, 6],
    notes: "Short-term memory allowed"
  },
  {
    stage: "drill2",
    activeBoxes: [1, 2, 3, 4],
    notes: "Memory suppressed"
  },
  {
    stage: "debrief",
    activeBoxes: [1, 2, 3, 4, 6, 7],
    notes: "Long-term memory becomes visible"
  },
  {
    stage: "final",
    activeBoxes: [1, 2, 3, 4, 6, 7],
    notes: "Field Guide synthesis"
  },
  {
    stage: "complete",
    activeBoxes: [1, 2, 3, 4, 7],
    notes: "Field Guide output allowed"
  }
];

// Create a fast lookup map
const STAGE_TO_BOXES: Record<string, number[]> = BOX_STAGE_MAP.reduce(
  (acc, entry) => {
    acc[entry.stage] = entry.activeBoxes;
    return acc;
  },
  {} as Record<string, number[]>
);

/**
 * Get active boxes for a given stage
 * This is the ONLY function that determines which boxes are active
 */
export function getActiveBoxesForStage(stage: string): number[] {
  const normalizedStage = stage.toLowerCase().replace('mission_', '');
  const boxes = STAGE_TO_BOXES[normalizedStage] || STAGE_TO_BOXES[stage];
  
  if (!boxes) {
    console.warn(`[BOX-STAGE MAP] No mapping found for stage: ${stage}, defaulting to Box 1 only`);
    return [1]; // Safe default: only core rules
  }
  
  return boxes;
}

/**
 * Check if a specific box is active for a stage
 */
export function isBoxActiveForStage(boxNumber: number, stage: string): boolean {
  const activeBoxes = getActiveBoxesForStage(stage);
  return activeBoxes.includes(boxNumber);
}

/**
 * Get visibility flags based on box activation
 */
export function getVisibilityFromBoxes(stage: string) {
  const activeBoxes = getActiveBoxesForStage(stage);
  
  return {
    showIdentityTags: activeBoxes.includes(2),      // Box 2: Identity Tags
    showShortTermMemory: activeBoxes.includes(6),   // Box 6: Short-term Memory
    showLongTermMemory: activeBoxes.includes(7),    // Box 7: Long-term Notes
    allowFieldGuideNarratives: activeBoxes.includes(7), // Box 7 enables Field Guide
    activeBoxes: activeBoxes,
  };
}

/**
 * Get debug info for current box activation
 */
export function getBoxActivationDebugInfo(stage: string): string {
  const activeBoxes = getActiveBoxesForStage(stage);
  const entry = BOX_STAGE_MAP.find(e => e.stage === stage || e.stage === stage.replace('mission_', ''));
  
  const boxNames = {
    1: 'Core Rules',
    2: 'Identity Tags',
    3: 'Stage Instruction',
    4: 'Stage Content',
    5: 'Lesson Modifiers',
    6: 'Short-term Memory',
    7: 'Long-term Notes'
  };
  
  return `
BOX ACTIVATION DEBUG
====================
Stage: ${stage}
Active Boxes: ${activeBoxes.join(', ')}
${activeBoxes.map(n => `  Box ${n}: ${boxNames[n as keyof typeof boxNames]}`).join('\n')}
Notes: ${entry?.notes || 'N/A'}
  `.trim();
}

/**
 * Validate that prompt only contains allowed boxes
 */
export function validateBoxActivation(
  stage: string,
  promptContent: string
): {
  valid: boolean;
  violations: string[];
  activeBoxes: number[];
} {
  const activeBoxes = getActiveBoxesForStage(stage);
  const violations: string[] = [];
  
  // Check for Box 2 violations (Identity Tags)
  if (!activeBoxes.includes(2)) {
    if (promptContent.includes('Identity Tags:') || promptContent.includes('Trait Tags:')) {
      violations.push('Box 2 (Identity Tags) present but not active for this stage');
    }
  }
  
  // Check for Box 6 violations (Short-term Memory)
  if (!activeBoxes.includes(6)) {
    if (promptContent.includes('RECENT INSIGHT:') || promptContent.includes('SHORT-TERM MEMORY:')) {
      violations.push('Box 6 (Short-term Memory) present but not active for this stage');
    }
  }
  
  // Check for Box 7 violations (Long-term Notes)
  if (!activeBoxes.includes(7)) {
    if (promptContent.includes('LONG-TERM PATTERN:') || promptContent.includes('LONG-TERM MEMORY:')) {
      violations.push('Box 7 (Long-term Notes) present but not active for this stage');
    }
  }
  
  return {
    valid: violations.length === 0,
    violations,
    activeBoxes,
  };
}
