// Echelon Visibility Control System v3.0
// NOW POWERED BY BOX-STAGE MAP - SINGLE SOURCE OF TRUTH
// Controls what Echelon can "see" at each mission stage
// Prevents memory leakage and enforces stage-specific information boundaries

import { MissionStage } from './state-engine';
import { getVisibilityFromBoxes, getActiveBoxesForStage } from './box-stage-map';

export interface StageVisibilityRules {
  showIdentityTags: boolean;           // Box 2: Display identity tags (callsign + trait tags)
  showShortTermMemory: boolean;        // Box 6: Include recent insights
  showLongTermMemory: boolean;         // Box 7: Include persistent patterns
  allowedContentFields: string[];      // Lesson fields allowed at this stage
  forbiddenContentFields: string[];    // Lesson fields explicitly forbidden
  allowFieldGuideNarratives: boolean;  // Whether Field Guide entries can appear
}

/**
 * VISIBILITY_MATRIX: The canonical source of truth for what Echelon can perceive per stage
 * 
 * CRITICAL RULES:
 * - Briefing: Tags shown, minimal memory, NO drill content
 * - Drill1: Tags shown, NO memory, ONLY drill1_prompt
 * - Video: NO TAGS, NO MEMORY, MINIMAL CONTEXT (operator watches independently)
 * - HP: Tags shown, short-term memory, NO drill content
 * - Drill2: Tags shown, NO memory, ONLY drill2_prompt
 * - Debrief: Tags shown, BOTH memories, synthesis mode
 * - Final: Tags shown, BOTH memories, field guide generation
 * - Complete: Full visibility, Field Guide narratives allowed
 */
export const VISIBILITY_MATRIX: Record<MissionStage, StageVisibilityRules> = {
  // Onboarding stages
  [MissionStage.ONBOARDING_SCREEN_1]: {
    showIdentityTags: false,             // System identity only
    showShortTermMemory: false,
    showLongTermMemory: false,
    allowedContentFields: [],
    forbiddenContentFields: ['*'],
    allowFieldGuideNarratives: false,
  },
  
  [MissionStage.LANGUAGE_SELECTION]: {
    showIdentityTags: false,             // Language directive engages
    showShortTermMemory: false,
    showLongTermMemory: false,
    allowedContentFields: [],
    forbiddenContentFields: ['*'],
    allowFieldGuideNarratives: false,
  },
  
  [MissionStage.ASSESSMENT]: {
    showIdentityTags: false,             // Diagnostic mode - no identity yet
    showShortTermMemory: false,
    showLongTermMemory: false,
    allowedContentFields: [],
    forbiddenContentFields: ['*'],
    allowFieldGuideNarratives: false,
  },
  
  [MissionStage.ORIENTATION_FOXHOLE]: {
    showIdentityTags: true,              // Identity tags visible for first time
    showShortTermMemory: false,
    showLongTermMemory: false,
    allowedContentFields: [],
    forbiddenContentFields: ['*'],
    allowFieldGuideNarratives: false,
  },
  
  // Mission stages
  [MissionStage.BRIEFING]: {
    showIdentityTags: true,              // Tags only, no definitions
    showShortTermMemory: true,           // Optional recent fragment
    showLongTermMemory: false,
    allowedContentFields: [
      'briefing',
      'echelon_opening',
      'lesson_title',
      'section_name',
    ],
    forbiddenContentFields: [
      'drill1_prompt',
      'drill2_prompt',
      'head',
      'practical',
      'debrief',
      'final_question',
    ],
    allowFieldGuideNarratives: false,
  },

  [MissionStage.DRILL1]: {
    showIdentityTags: true,              // Operator identity visible
    showShortTermMemory: false,          // NO memory during drill
    showLongTermMemory: false,
    allowedContentFields: [
      'drill1_prompt',
    ],
    forbiddenContentFields: [
      'briefing',
      'drill2_prompt',
      'video_url',
      'head',
      'practical',
      'debrief',
      'final_question',
    ],
    allowFieldGuideNarratives: false,
  },

  [MissionStage.VIDEO]: {
    showIdentityTags: false,             // CRITICAL: NO identity during video
    showShortTermMemory: false,          // MINIMAL CONTEXT
    showLongTermMemory: false,
    allowedContentFields: [
      'video_url',
    ],
    forbiddenContentFields: [
      '*',                                // Wildcard: everything else forbidden
    ],
    allowFieldGuideNarratives: false,
  },

  [MissionStage.HP]: {
    showIdentityTags: true,              // Identity restored post-video
    showShortTermMemory: true,           // Recent insight available
    showLongTermMemory: false,
    allowedContentFields: [
      'head',
      'practical',
    ],
    forbiddenContentFields: [
      'drill1_prompt',
      'drill2_prompt',
      'final_question',
      'debrief',
    ],
    allowFieldGuideNarratives: false,
  },

  [MissionStage.DRILL2]: {
    showIdentityTags: true,
    showShortTermMemory: false,          // NO memory during drill
    showLongTermMemory: false,
    allowedContentFields: [
      'drill2_prompt',
    ],
    forbiddenContentFields: [
      'drill1_prompt',
      'head',
      'practical',
      'final_question',
      'debrief',
    ],
    allowFieldGuideNarratives: false,
  },

  [MissionStage.DEBRIEF]: {
    showIdentityTags: true,
    showShortTermMemory: true,           // Synthesis mode begins
    showLongTermMemory: true,            // FIRST TIME long-term patterns appear
    allowedContentFields: [
      'debrief',
    ],
    forbiddenContentFields: [
      'drill1_prompt',
      'drill2_prompt',
      'final_question',
    ],
    allowFieldGuideNarratives: false,
  },

  [MissionStage.FINAL]: {
    showIdentityTags: true,
    showShortTermMemory: true,
    showLongTermMemory: true,
    allowedContentFields: [
      'final_question',
      'field_guide_prompt',              // Used for Field Guide generation
    ],
    forbiddenContentFields: [
      'drill1_prompt',
      'drill2_prompt',
      'head',
      'practical',
    ],
    allowFieldGuideNarratives: false,
  },
  
  [MissionStage.REFLECTION]: {
    showIdentityTags: true,
    showShortTermMemory: true,
    showLongTermMemory: true,
    allowedContentFields: [
      'final_question',                   // Reused as deep reflection prompt
    ],
    forbiddenContentFields: [
      'drill1_prompt',
      'drill2_prompt',
      'head',
      'practical',
      'debrief',
    ],
    allowFieldGuideNarratives: false,
  },

  [MissionStage.COMPLETE]: {
    showIdentityTags: true,
    showShortTermMemory: true,
    showLongTermMemory: true,
    allowedContentFields: [
      'echelon_closing',
    ],
    forbiddenContentFields: [],          // Nothing forbidden at completion
    allowFieldGuideNarratives: true,     // Field Guide narratives now allowed
  },
};

/**
 * Get visibility rules for a given stage
 * NOW POWERED BY BOX-STAGE MAP - queries box activation
 */
export function getVisibilityRules(stage: MissionStage): StageVisibilityRules {
  const stageString = String(stage).toLowerCase();
  const visibility = getVisibilityFromBoxes(stageString);
  
  // Get legacy rules for content field filtering (still needed for backward compatibility)
  const legacyRules = VISIBILITY_MATRIX[stage] || VISIBILITY_MATRIX[MissionStage.BRIEFING];
  
  // Merge box-based visibility with content field rules
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
 * Filter content object based on visibility rules for current stage
 * 
 * @param content - Raw lesson content object
 * @param stage - Current mission stage
 * @returns Filtered content containing only allowed fields
 */
export function filterContentByVisibility(
  content: Record<string, any>,
  stage: MissionStage
): Record<string, any> {
  const rules = getVisibilityRules(stage);
  const filtered: Record<string, any> = {};

  // If wildcard forbids everything, only allow explicitly allowed fields
  const hasWildcardForbidden = rules.forbiddenContentFields.includes('*');

  for (const [key, value] of Object.entries(content)) {
    // Skip null/undefined values
    if (value === null || value === undefined) continue;

    // Check if field is explicitly allowed
    if (rules.allowedContentFields.includes(key)) {
      filtered[key] = value;
      continue;
    }

    // If wildcard present, reject everything not explicitly allowed
    if (hasWildcardForbidden) {
      continue;
    }

    // Check if field is explicitly forbidden
    if (rules.forbiddenContentFields.includes(key)) {
      continue;
    }

    // If not forbidden and no wildcard, allow through
    filtered[key] = value;
  }

  return filtered;
}

/**
 * Check if identity tags should be shown for current stage
 */
export function shouldShowIdentityTags(stage: MissionStage): boolean {
  return getVisibilityRules(stage).showIdentityTags;
}

/**
 * Check if short-term memory should be shown for current stage
 */
export function shouldShowShortTermMemory(stage: MissionStage): boolean {
  return getVisibilityRules(stage).showShortTermMemory;
}

/**
 * Check if long-term memory should be shown for current stage
 */
export function shouldShowLongTermMemory(stage: MissionStage): boolean {
  return getVisibilityRules(stage).showLongTermMemory;
}

/**
 * Check if Field Guide narratives can be included for current stage
 */
export function canShowFieldGuideNarratives(stage: MissionStage): boolean {
  return getVisibilityRules(stage).allowFieldGuideNarratives;
}

/**
 * Get debug summary of visibility rules for current stage
 */
export function getVisibilityDebugInfo(stage: MissionStage): string {
  const rules = getVisibilityRules(stage);
  
  return `
VISIBILITY RULES: ${stage}
========================
Identity Tags: ${rules.showIdentityTags ? '✅ SHOWN' : '❌ HIDDEN'}
Short-Term Memory: ${rules.showShortTermMemory ? '✅ SHOWN' : '❌ HIDDEN'}
Long-Term Memory: ${rules.showLongTermMemory ? '✅ SHOWN' : '❌ HIDDEN'}
Field Guide: ${rules.allowFieldGuideNarratives ? '✅ ALLOWED' : '❌ SUPPRESSED'}

Allowed Fields:
${rules.allowedContentFields.map(f => `  ✅ ${f}`).join('\n')}

Forbidden Fields:
${rules.forbiddenContentFields.map(f => `  ❌ ${f}`).join('\n')}
  `.trim();
}
