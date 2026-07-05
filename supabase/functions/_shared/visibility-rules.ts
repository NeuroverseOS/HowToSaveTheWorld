// ECHELON Visibility Control System - Edge Function Module
// Box-Stage Map Integration - CANONICAL SPECIFICATION
// (Edge functions cannot import from src/, so this is a standalone copy)

export enum MissionStage {
  ONBOARDING_SCREEN_1 = "onboarding_screen_1",
  LANGUAGE_SELECTION = "language_selection",
  ASSESSMENT = "assessment",
  ORIENTATION_FOXHOLE = "orientation_foxhole",
  BRIEFING = "briefing",
  DRILL1 = "drill1",
  VIDEO = "video",
  HP = "hp",
  DRILL2 = "drill2",
  DEBRIEF = "debrief",
  FINAL = "final",
  COMPLETE = "complete"
}

// ============================================================================
// BOX-STAGE MAP: Single Source of Truth for Box Activation
// Based on Box_Stage_Map.xlsx canonical specification
// ============================================================================

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

export interface StageVisibilityRules {
  showIdentityTags: boolean;
  showShortTermMemory: boolean;
  showLongTermMemory: boolean;
  allowedContentFields: string[];
  forbiddenContentFields: string[];
  allowFieldGuideNarratives: boolean;
}

/**
 * VISIBILITY_MATRIX: Controls what Echelon can perceive per stage
 */
export const VISIBILITY_MATRIX: Record<string, StageVisibilityRules> = {
  briefing: {
    showIdentityTags: true,
    showShortTermMemory: true,
    showLongTermMemory: false,
    allowedContentFields: ["briefing", "echelon_opening", "lesson_title", "section_name"],
    forbiddenContentFields: ["drill1_prompt", "drill2_prompt", "head", "practical", "debrief", "final_question"],
    allowFieldGuideNarratives: false,
  },
  
  drill1: {
    showIdentityTags: true,
    showShortTermMemory: false,
    showLongTermMemory: false,
    allowedContentFields: ["drill1_prompt"],
    forbiddenContentFields: ["briefing", "drill2_prompt", "video_url", "head", "practical", "debrief", "final_question"],
    allowFieldGuideNarratives: false,
  },
  
  video: {
    showIdentityTags: false,  // CRITICAL: NO identity during video
    showShortTermMemory: false,
    showLongTermMemory: false,
    allowedContentFields: ["video_url"],
    forbiddenContentFields: ["*"],
    allowFieldGuideNarratives: false,
  },
  
  hp: {
    showIdentityTags: true,
    showShortTermMemory: true,
    showLongTermMemory: false,
    allowedContentFields: ["head", "practical"],
    forbiddenContentFields: ["drill1_prompt", "drill2_prompt", "final_question", "debrief"],
    allowFieldGuideNarratives: false,
  },
  
  drill2: {
    showIdentityTags: true,
    showShortTermMemory: false,
    showLongTermMemory: false,
    allowedContentFields: ["drill2_prompt"],
    forbiddenContentFields: ["drill1_prompt", "head", "practical", "final_question", "debrief"],
    allowFieldGuideNarratives: false,
  },
  
  debrief: {
    showIdentityTags: true,
    showShortTermMemory: true,
    showLongTermMemory: true,  // First time long-term memory appears
    allowedContentFields: ["debrief"],
    forbiddenContentFields: ["drill1_prompt", "drill2_prompt", "final_question"],
    allowFieldGuideNarratives: false,
  },
  
  final: {
    showIdentityTags: true,
    showShortTermMemory: true,
    showLongTermMemory: true,
    allowedContentFields: ["final_question", "field_guide_prompt"],
    forbiddenContentFields: ["drill1_prompt", "drill2_prompt", "head", "practical"],
    allowFieldGuideNarratives: false,
  },
  
  complete: {
    showIdentityTags: true,
    showShortTermMemory: true,
    showLongTermMemory: true,
    allowedContentFields: ["echelon_closing"],
    forbiddenContentFields: [],
    allowFieldGuideNarratives: true,
  },
  
  // Special case: Orientation (no restrictions)
  orientation: {
    showIdentityTags: true,
    showShortTermMemory: false,
    showLongTermMemory: false,
    allowedContentFields: ["*"],
    forbiddenContentFields: [],
    allowFieldGuideNarratives: false,
  },
};

/**
 * Get visibility rules for a specific stage
 * NOW POWERED BY BOX-STAGE MAP
 */
export function getVisibilityRules(stage: string): StageVisibilityRules {
  const visibility = getVisibilityFromBoxes(stage);
  const legacyRules = VISIBILITY_MATRIX[stage] || VISIBILITY_MATRIX.briefing;
  
  // Merge Box-Stage Map visibility with legacy content filtering
  return {
    showIdentityTags: visibility.showIdentityTags,
    showShortTermMemory: visibility.showShortTermMemory,
    showLongTermMemory: visibility.showLongTermMemory,
    allowFieldGuideNarratives: visibility.allowFieldGuideNarratives,
    allowedContentFields: legacyRules.allowedContentFields,
    forbiddenContentFields: legacyRules.forbiddenContentFields,
  };
}

/**
 * Filter content based on visibility rules
 */
export function filterContentByVisibility(
  content: Record<string, any>,
  stage: string
): Record<string, any> {
  const rules = getVisibilityRules(stage);
  const filtered: Record<string, any> = {};
  
  const hasWildcardForbidden = rules.forbiddenContentFields.includes('*');
  const hasWildcardAllowed = rules.allowedContentFields.includes('*');
  
  // If wildcard allowed, return everything
  if (hasWildcardAllowed) {
    return content;
  }

  for (const [key, value] of Object.entries(content)) {
    if (value === null || value === undefined) continue;

    // Check if explicitly allowed
    if (rules.allowedContentFields.includes(key)) {
      filtered[key] = value;
      continue;
    }

    // If wildcard forbidden, reject everything not explicitly allowed
    if (hasWildcardForbidden) {
      continue;
    }

    // Check if explicitly forbidden
    if (rules.forbiddenContentFields.includes(key)) {
      continue;
    }

    // If not forbidden and no wildcard, allow through
    filtered[key] = value;
  }

  return filtered;
}

/**
 * Validate visibility compliance (for logging)
 */
export function logVisibilityCheck(
  stage: string,
  identityTagsUsed: boolean,
  shortTermMemoryUsed: boolean,
  longTermMemoryUsed: boolean,
  contentFields: string[]
): void {
  const rules = getVisibilityRules(stage);
  const violations: string[] = [];

  if (identityTagsUsed && !rules.showIdentityTags) {
    violations.push("🚨 Identity tags shown when forbidden");
  }
  
  if (shortTermMemoryUsed && !rules.showShortTermMemory) {
    violations.push("🚨 Short-term memory shown when forbidden");
  }
  
  if (longTermMemoryUsed && !rules.showLongTermMemory) {
    violations.push("🚨 Long-term memory shown when forbidden");
  }

  contentFields.forEach(field => {
    if (rules.forbiddenContentFields.includes(field) || rules.forbiddenContentFields.includes('*')) {
      if (!rules.allowedContentFields.includes(field)) {
        violations.push(`🚨 Forbidden field used: ${field}`);
      }
    }
  });

  if (violations.length > 0) {
    console.error(`[VISIBILITY VIOLATION] Stage: ${stage}`);
    violations.forEach(v => console.error(`  ${v}`));
  } else {
    console.log(`✅ [VISIBILITY CHECK] Stage: ${stage} - All rules followed`);
  }
}
