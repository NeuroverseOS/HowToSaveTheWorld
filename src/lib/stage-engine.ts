// Stage Engine - Controls the 7-Box Protocol Flow
// Subsystem #2 of Mission Engine Architecture

import type { Lesson } from "./lesson-queries";
import { MissionStage } from "./state-engine";

// ============================================================================
// STAGE SEQUENCE - The canonical 7-box protocol
// ============================================================================

export const CANONICAL_STAGE_SEQUENCE: MissionStage[] = [
  MissionStage.BRIEFING,    // Box 1: Mission setup
  MissionStage.DRILL1,      // Box 2: Personal mapping
  MissionStage.VIDEO,       // Box 3: Visual intel
  MissionStage.HP,          // Box 4: Head + Practical integration
  MissionStage.DRILL2,      // Box 5: Deepening
  MissionStage.DEBRIEF,     // Box 6: Synthesis
  MissionStage.FINAL,       // Box 7: Final anchor
  MissionStage.REFLECTION,  // NEW: Deep reflection mode
  MissionStage.COMPLETE,    // Mission complete
];

// Display names for UI
export const STAGE_DISPLAY_NAMES: Record<MissionStage, string> = {
  // Onboarding stages
  [MissionStage.ONBOARDING_SCREEN_1]: 'System Initialization',
  [MissionStage.LANGUAGE_SELECTION]: 'Language Selection',
  [MissionStage.ASSESSMENT]: 'Archetype Assessment',
  [MissionStage.ORIENTATION_FOXHOLE]: 'Foxhole Orientation',
  
  // Mission stages
  [MissionStage.BRIEFING]: 'Mission Briefing',
  [MissionStage.DRILL1]: 'Personal Mapping',
  [MissionStage.VIDEO]: 'Field Footage',
  [MissionStage.HP]: 'Integration Block',
  [MissionStage.DRILL2]: 'Deepening',
  [MissionStage.DEBRIEF]: 'Debrief',
  [MissionStage.FINAL]: 'Final Anchor',
  [MissionStage.REFLECTION]: 'Deep Reflection',
  [MissionStage.COMPLETE]: 'Mission Complete',
};

// Short codes for compact display
export const STAGE_SHORT_CODES: Record<MissionStage, string> = {
  // Onboarding stages
  [MissionStage.ONBOARDING_SCREEN_1]: 'ON1',
  [MissionStage.LANGUAGE_SELECTION]: 'LANG',
  [MissionStage.ASSESSMENT]: 'ASMT',
  [MissionStage.ORIENTATION_FOXHOLE]: 'ORI',
  
  // Mission stages
  [MissionStage.BRIEFING]: 'BRF',
  [MissionStage.DRILL1]: 'D1',
  [MissionStage.VIDEO]: 'VID',
  [MissionStage.HP]: 'HP',
  [MissionStage.DRILL2]: 'D2',
  [MissionStage.DEBRIEF]: 'DBF',
  [MissionStage.FINAL]: 'FIN',
  [MissionStage.REFLECTION]: 'REF',
  [MissionStage.COMPLETE]: 'CMP',
};

// ============================================================================
// STAGE CONTENT FILTERING - Only send relevant lesson fields per stage
// ============================================================================

export interface StageContent {
  [key: string]: any;
}

/**
 * Filter lesson content to ONLY what's needed for the current stage.
 * This prevents leaking future content and reduces token usage.
 */
export function getStageContent(lesson: Lesson, stage: MissionStage): StageContent {
  const contentMap: Record<MissionStage, StageContent> = {
    // Onboarding stages (no lesson content)
    [MissionStage.ONBOARDING_SCREEN_1]: {},
    [MissionStage.LANGUAGE_SELECTION]: {},
    [MissionStage.ASSESSMENT]: {},
    [MissionStage.ORIENTATION_FOXHOLE]: {},
    
    // Mission stages
    [MissionStage.BRIEFING]: {
      briefing: lesson.briefing,
      echelon_opening: lesson.echelon_opening,
      lesson_title: lesson.lesson_title,
      section_name: lesson.section_name,
    },
    
    [MissionStage.DRILL1]: {
      drill1_prompt: lesson.drill1_prompt,
    },
    
    [MissionStage.VIDEO]: {
      video_url: lesson.video_url,
      // No content sent to AI during video - operator watches independently
    },
    
    [MissionStage.HP]: {
      head: lesson.head,
      practical: lesson.practical,
    },
    
    [MissionStage.DRILL2]: {
      drill2_prompt: lesson.drill2_prompt,
    },
    
    [MissionStage.DEBRIEF]: {
      debrief: lesson.debrief,
    },
    
    [MissionStage.FINAL]: {
      final_question: lesson.final_question,
      field_guide_prompt: lesson.field_guide_prompt, // Used for generation
    },
    
    [MissionStage.REFLECTION]: {
      final_question: lesson.final_question, // Reuse as reflection prompt
    },
    
    [MissionStage.COMPLETE]: {
      echelon_closing: lesson.echelon_closing,
    },
  };

  return contentMap[stage] || {};
}

// ============================================================================
// STAGE TRANSITION LOGIC
// ============================================================================

/**
 * Determine the next stage in the sequence
 */
export function getNextStage(currentStage: MissionStage): MissionStage | null {
  const currentIndex = CANONICAL_STAGE_SEQUENCE.indexOf(currentStage);
  
  if (currentIndex === -1 || currentIndex === CANONICAL_STAGE_SEQUENCE.length - 1) {
    return null; // Invalid stage or already at end
  }
  
  return CANONICAL_STAGE_SEQUENCE[currentIndex + 1];
}

/**
 * Check if a stage is the final stage
 */
export function isFinalStage(stage: MissionStage): boolean {
  return stage === MissionStage.COMPLETE;
}

/**
 * Validate stage transition is allowed
 */
export function canTransitionToStage(
  currentStage: MissionStage,
  targetStage: MissionStage
): boolean {
  const currentIndex = CANONICAL_STAGE_SEQUENCE.indexOf(currentStage);
  const targetIndex = CANONICAL_STAGE_SEQUENCE.indexOf(targetStage);
  
  // Can only move forward by one stage, or stay in same stage
  return targetIndex === currentIndex || targetIndex === currentIndex + 1;
}

// ============================================================================
// STAGE COMPLETION CRITERIA
// ============================================================================

export interface StageCompletionCriteria {
  requiresUserInput: boolean;
  requiresVideoCompletion: boolean;
  requiresEchelonResponse: boolean;
  minimumInteractions: number;
}

/**
 * Define what's needed to complete each stage
 */
export function getStageCompletionCriteria(stage: MissionStage): StageCompletionCriteria {
  const criteria: Record<MissionStage, StageCompletionCriteria> = {
    // Onboarding stages
    [MissionStage.ONBOARDING_SCREEN_1]: {
      requiresUserInput: true,
      requiresVideoCompletion: false,
      requiresEchelonResponse: false,
      minimumInteractions: 0,
    },
    
    [MissionStage.LANGUAGE_SELECTION]: {
      requiresUserInput: true,
      requiresVideoCompletion: false,
      requiresEchelonResponse: false,
      minimumInteractions: 0,
    },
    
    [MissionStage.ASSESSMENT]: {
      requiresUserInput: true,
      requiresVideoCompletion: false,
      requiresEchelonResponse: true,
      minimumInteractions: 1,
    },
    
    [MissionStage.ORIENTATION_FOXHOLE]: {
      requiresUserInput: true,
      requiresVideoCompletion: false,
      requiresEchelonResponse: true,
      minimumInteractions: 1,
    },
    
    // Mission stages
    [MissionStage.BRIEFING]: {
      requiresUserInput: true, // Operator must acknowledge readiness
      requiresVideoCompletion: false,
      requiresEchelonResponse: true,
      minimumInteractions: 1,
    },
    
    [MissionStage.DRILL1]: {
      requiresUserInput: true, // Must answer drill prompt
      requiresVideoCompletion: false,
      requiresEchelonResponse: true,
      minimumInteractions: 1,
    },
    
    [MissionStage.VIDEO]: {
      requiresUserInput: false, // Just needs to watch
      requiresVideoCompletion: true,
      requiresEchelonResponse: false,
      minimumInteractions: 0,
    },
    
    [MissionStage.HP]: {
      requiresUserInput: true, // Reflect on theory + practice
      requiresVideoCompletion: false,
      requiresEchelonResponse: true,
      minimumInteractions: 1,
    },
    
    [MissionStage.DRILL2]: {
      requiresUserInput: true, // Must answer second drill
      requiresVideoCompletion: false,
      requiresEchelonResponse: true,
      minimumInteractions: 1,
    },
    
    [MissionStage.DEBRIEF]: {
      requiresUserInput: true, // Share key insight
      requiresVideoCompletion: false,
      requiresEchelonResponse: true,
      minimumInteractions: 1,
    },
    
    [MissionStage.FINAL]: {
      requiresUserInput: true, // Final reflection for Field Guide
      requiresVideoCompletion: false,
      requiresEchelonResponse: true,
      minimumInteractions: 1,
    },
    
    [MissionStage.REFLECTION]: {
      requiresUserInput: true, // Deep reflection with follow-up
      requiresVideoCompletion: false,
      requiresEchelonResponse: true,
      minimumInteractions: 1,
    },
    
    [MissionStage.COMPLETE]: {
      requiresUserInput: false, // Just receives closing transmission
      requiresVideoCompletion: false,
      requiresEchelonResponse: true,
      minimumInteractions: 0,
    },
  };

  return criteria[stage] || {
    requiresUserInput: true,
    requiresVideoCompletion: false,
    requiresEchelonResponse: true,
    minimumInteractions: 1,
  };
}

/**
 * Check if a stage is complete based on criteria
 */
export function isStageComplete(
  stage: MissionStage,
  hasUserInput: boolean,
  videoCompleted: boolean,
  hasEchelonResponse: boolean,
  interactionCount: number
): boolean {
  const criteria = getStageCompletionCriteria(stage);
  
  if (criteria.requiresUserInput && !hasUserInput) return false;
  if (criteria.requiresVideoCompletion && !videoCompleted) return false;
  if (criteria.requiresEchelonResponse && !hasEchelonResponse) return false;
  if (interactionCount < criteria.minimumInteractions) return false;
  
  return true;
}

// ============================================================================
// STAGE PROGRESS TRACKING
// ============================================================================

/**
 * Calculate overall progress through mission stages
 */
export function calculateStageProgress(currentStage: MissionStage): number {
  const currentIndex = CANONICAL_STAGE_SEQUENCE.indexOf(currentStage);
  if (currentIndex === -1) return 0;
  
  return Math.round((currentIndex / (CANONICAL_STAGE_SEQUENCE.length - 1)) * 100);
}

/**
 * Get remaining stages from current position
 */
export function getRemainingStages(currentStage: MissionStage): MissionStage[] {
  const currentIndex = CANONICAL_STAGE_SEQUENCE.indexOf(currentStage);
  if (currentIndex === -1) return [];
  
  return CANONICAL_STAGE_SEQUENCE.slice(currentIndex + 1);
}

// ============================================================================
// STAGE UI HELPERS
// ============================================================================

/**
 * Determine if stage should show input field
 */
export function shouldShowInput(stage: MissionStage): boolean {
  return stage !== MissionStage.VIDEO && stage !== MissionStage.COMPLETE;
}

/**
 * Determine if stage should show video player
 */
export function shouldShowVideo(stage: MissionStage): boolean {
  return stage === MissionStage.VIDEO;
}

/**
 * Determine if stage should show advance button
 */
export function shouldShowAdvanceButton(
  stage: MissionStage,
  isComplete: boolean
): boolean {
  // Briefing can be advanced after Echelon delivers it
  if (stage === MissionStage.BRIEFING && isComplete) return true;
  
  // Video stage shows continue after video completes
  if (stage === MissionStage.VIDEO && isComplete) return true;
  
  // Complete stage shows return to dashboard
  if (stage === MissionStage.COMPLETE) return true;
  
  return false;
}

/**
 * Get button text for stage
 */
export function getStageButtonText(stage: MissionStage): string {
  const buttonText: Record<MissionStage, string> = {
    // Onboarding stages
    [MissionStage.ONBOARDING_SCREEN_1]: 'Continue',
    [MissionStage.LANGUAGE_SELECTION]: 'Confirm Language',
    [MissionStage.ASSESSMENT]: 'Complete Assessment',
    [MissionStage.ORIENTATION_FOXHOLE]: 'Begin First Mission',
    
    // Mission stages
    [MissionStage.BRIEFING]: 'Begin Mission',
    [MissionStage.DRILL1]: 'Submit Response',
    [MissionStage.VIDEO]: 'Continue to Integration',
    [MissionStage.HP]: 'Submit Reflection',
    [MissionStage.DRILL2]: 'Submit Response',
    [MissionStage.DEBRIEF]: 'Submit Insight',
    [MissionStage.FINAL]: 'Complete Mission',
    [MissionStage.REFLECTION]: 'Continue Mission',
    [MissionStage.COMPLETE]: 'Return to Dashboard',
  };
  
  return buttonText[stage] || 'Continue';
}

// ============================================================================
// STAGE ENGINE CORE
// ============================================================================

export interface StageEngineState {
  currentStage: MissionStage;
  stageHistory: {
    stage: MissionStage;
    completedAt: string;
    userInput?: string;
  }[];
  videoCompleted: boolean;
  interactionCounts: Record<MissionStage, number>;
}

/**
 * Initialize stage engine for a new mission
 */
export function initializeStageEngine(): StageEngineState {
  return {
    currentStage: MissionStage.BRIEFING,
    stageHistory: [],
    videoCompleted: false,
    interactionCounts: {
      // Onboarding stages
      [MissionStage.ONBOARDING_SCREEN_1]: 0,
      [MissionStage.LANGUAGE_SELECTION]: 0,
      [MissionStage.ASSESSMENT]: 0,
      [MissionStage.ORIENTATION_FOXHOLE]: 0,
      
      // Mission stages
      [MissionStage.BRIEFING]: 0,
      [MissionStage.DRILL1]: 0,
      [MissionStage.VIDEO]: 0,
      [MissionStage.HP]: 0,
      [MissionStage.DRILL2]: 0,
      [MissionStage.DEBRIEF]: 0,
      [MissionStage.FINAL]: 0,
      [MissionStage.REFLECTION]: 0,
      [MissionStage.COMPLETE]: 0,
    },
  };
}

/**
 * Advance to next stage (main stage transition function)
 */
export function advanceStage(
  currentState: StageEngineState,
  userInput?: string
): StageEngineState {
  const nextStage = getNextStage(currentState.currentStage);
  
  if (!nextStage) {
    console.warn('[STAGE ENGINE] Cannot advance - already at final stage');
    return currentState;
  }
  
  // Record completion of current stage
  const updatedHistory = [
    ...currentState.stageHistory,
    {
      stage: currentState.currentStage,
      completedAt: new Date().toISOString(),
      userInput,
    },
  ];
  
  console.log(`[STAGE ENGINE] Advancing: ${currentState.currentStage} → ${nextStage}`);
  
  return {
    ...currentState,
    currentStage: nextStage,
    stageHistory: updatedHistory,
  };
}

/**
 * Record user interaction in current stage
 */
export function recordInteraction(
  currentState: StageEngineState,
  stage: MissionStage
): StageEngineState {
  return {
    ...currentState,
    interactionCounts: {
      ...currentState.interactionCounts,
      [stage]: currentState.interactionCounts[stage] + 1,
    },
  };
}

/**
 * Mark video as completed
 */
export function markVideoComplete(currentState: StageEngineState): StageEngineState {
  return {
    ...currentState,
    videoCompleted: true,
  };
}

// ============================================================================
// VALIDATION & DEBUGGING
// ============================================================================

/**
 * Validate stage engine state
 */
export function validateStageState(state: StageEngineState): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check current stage is valid
  if (!CANONICAL_STAGE_SEQUENCE.includes(state.currentStage)) {
    errors.push(`Invalid current stage: ${state.currentStage}`);
  }
  
  // Check stage history is sequential
  for (let i = 1; i < state.stageHistory.length; i++) {
    const prev = state.stageHistory[i - 1].stage;
    const curr = state.stageHistory[i].stage;
    
    if (!canTransitionToStage(prev, curr)) {
      errors.push(`Invalid stage transition: ${prev} → ${curr}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get debug info for current stage
 */
export function getStageDebugInfo(state: StageEngineState): string {
  const progress = calculateStageProgress(state.currentStage);
  const remaining = getRemainingStages(state.currentStage);
  const validation = validateStageState(state);
  
  return `
STAGE ENGINE DEBUG
==================
Current: ${state.currentStage} (${STAGE_DISPLAY_NAMES[state.currentStage]})
Progress: ${progress}%
Remaining: ${remaining.map(s => STAGE_SHORT_CODES[s]).join(' → ')}
History: ${state.stageHistory.length} stages completed
Video: ${state.videoCompleted ? 'Complete' : 'Pending'}
Validation: ${validation.valid ? 'PASS' : 'FAIL'}
${validation.errors.length > 0 ? 'Errors:\n' + validation.errors.join('\n') : ''}
  `.trim();
}
