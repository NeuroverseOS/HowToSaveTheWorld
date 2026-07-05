// NeuroVerse Identity System - Trait Definitions and Tag Extraction
// This file contains the FULL trait definitions for the Field Guide (user-facing)
// Only TAGS are sent to Echelon, never full definitions

export interface TraitDefinition {
  tag: string;
  name: string;
  definition: string;
  subskills: string[];
  shadow: string;
  superpower: string;
}

// Complete trait map with all 9 core traits
export const TRAIT_MAP: Record<string, TraitDefinition> = {
  systems_thinking: {
    tag: "systems_thinking",
    name: "Systems Thinking",
    definition: "Sees downstream effects, incentives, and structural truths reflexively.",
    subskills: ["downstream_effects", "incentive_alignment", "structural_truth_detection"],
    shadow: "Isolation or frustration when others cannot see the pattern.",
    superpower: "Sees the game board while others move pieces."
  },
  
  pattern_recognition: {
    tag: "pattern_recognition",
    name: "Pattern Recognition",
    definition: "Identifies recurring structures across domains and contexts.",
    subskills: ["cross_domain_mapping", "behavioral_patterns", "market_patterns"],
    shadow: "False pattern detection or over-generalization.",
    superpower: "Predicts outcomes before others see the trend."
  },
  
  strategic_thinking: {
    tag: "strategic_thinking",
    name: "Strategic Thinking",
    definition: "Plans multi-step pathways accounting for constraints and leverage points.",
    subskills: ["long_term_planning", "leverage_identification", "constraint_navigation"],
    shadow: "Analysis paralysis or over-planning at the expense of action.",
    superpower: "Sees 10 moves ahead while others react move-by-move."
  },
  
  emotional_intelligence: {
    tag: "emotional_intelligence",
    name: "Emotional Intelligence",
    definition: "Reads emotional states, motivations, and relational dynamics accurately.",
    subskills: ["empathy_mapping", "motivation_detection", "conflict_resolution"],
    shadow: "Emotional overwhelm or manipulation vulnerability.",
    superpower: "Navigates human dynamics with precision and care."
  },
  
  creative_problem_solving: {
    tag: "creative_problem_solving",
    name: "Creative Problem Solving",
    definition: "Generates novel solutions by combining disparate concepts.",
    subskills: ["lateral_thinking", "constraint_reframing", "innovation_synthesis"],
    shadow: "Impractical ideas or disconnection from implementation reality.",
    superpower: "Invents solutions others didn't know were possible."
  },
  
  execution_bias: {
    tag: "execution_bias",
    name: "Execution Bias",
    definition: "Converts intent into action rapidly and iteratively.",
    subskills: ["rapid_prototyping", "bias_to_action", "iteration_speed"],
    shadow: "Premature action without sufficient planning.",
    superpower: "Ships while others are still talking about it."
  },
  
  analytical_rigor: {
    tag: "analytical_rigor",
    name: "Analytical Rigor",
    definition: "Dissects problems into component parts and evaluates evidence systematically.",
    subskills: ["root_cause_analysis", "data_interpretation", "logical_reasoning"],
    shadow: "Over-analysis or dismissal of intuitive insights.",
    superpower: "Finds truth in noise, separates signal from distortion."
  },
  
  adaptive_learning: {
    tag: "adaptive_learning",
    name: "Adaptive Learning",
    definition: "Adjusts mental models based on new information rapidly.",
    subskills: ["feedback_integration", "mental_model_updating", "growth_mindset"],
    shadow: "Identity instability or lack of conviction.",
    superpower: "Evolves faster than environment changes."
  },
  
  communication_clarity: {
    tag: "communication_clarity",
    name: "Communication Clarity",
    definition: "Translates complex concepts into clear, actionable language.",
    subskills: ["simplification", "narrative_framing", "audience_adaptation"],
    shadow: "Over-simplification or loss of nuance.",
    superpower: "Makes the complex understandable, the abstract tangible."
  }
};

// Extract only tags for Echelon (never send full definitions to AI)
export function getOperatorTags(userTraits: string[]): string[] {
  return userTraits.filter(tag => TRAIT_MAP[tag]).map(tag => TRAIT_MAP[tag].tag);
}

// Get full trait definition for Field Guide display (user-facing only)
export function getTraitDefinition(traitTag: string): TraitDefinition | null {
  return TRAIT_MAP[traitTag] || null;
}

// Get all trait tags
export function getAllTraitTags(): string[] {
  return Object.keys(TRAIT_MAP);
}

// Check if a trait tag is valid
export function isValidTraitTag(tag: string): boolean {
  return tag in TRAIT_MAP;
}

// ============================================
// IDENTITY NOTE MANAGEMENT (Boxes 6 & 7)
// ============================================

import { supabase } from "@/integrations/supabase/client";

// Box 6: Save recent insight (short-term memory)
export async function saveRecentInsight(userId: string, insight: string) {
  const { error } = await supabase
    .from('operator_identity_notes')
    .upsert({
      user_id: userId,
      note_type: 'recent_insight',
      note_content: insight,
      created_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,note_type'
    });
  
  if (error) {
    console.error('[IDENTITY SYSTEM] Failed to save recent insight:', error);
    throw error;
  }
  
  console.log('[IDENTITY SYSTEM] Recent insight saved (Box 6)');
}

// Box 7: Save long-term pattern note (persistent memory)
export async function saveLongTermPattern(userId: string, pattern: string) {
  const { error } = await supabase
    .from('operator_identity_notes')
    .upsert({
      user_id: userId,
      note_type: 'long_term_pattern',
      note_content: pattern,
      created_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,note_type'
    });
  
  if (error) {
    console.error('[IDENTITY SYSTEM] Failed to save long-term pattern:', error);
    throw error;
  }
  
  console.log('[IDENTITY SYSTEM] Long-term pattern saved (Box 7)');
}

// Fetch identity notes for prompt assembly (client-side if needed)
export async function getIdentityNotes(userId: string): Promise<{
  recentInsight?: string;
  longTermPattern?: string;
}> {
  const { data, error } = await supabase
    .from('operator_identity_notes')
    .select('note_type, note_content')
    .eq('user_id', userId)
    .in('note_type', ['recent_insight', 'long_term_pattern']);
  
  if (error) {
    console.error('[IDENTITY SYSTEM] Failed to fetch identity notes:', error);
    return {};
  }
  
  return {
    recentInsight: data?.find(n => n.note_type === 'recent_insight')?.note_content,
    longTermPattern: data?.find(n => n.note_type === 'long_term_pattern')?.note_content
  };
}

// Clear recent insight (for mission boundaries)
export async function clearRecentInsight(userId: string) {
  const { error } = await supabase
    .from('operator_identity_notes')
    .delete()
    .eq('user_id', userId)
    .eq('note_type', 'recent_insight');
  
  if (error) {
    console.error('[IDENTITY SYSTEM] Failed to clear recent insight:', error);
    throw error;
  }
  
  console.log('[IDENTITY SYSTEM] Recent insight cleared (Box 6 reset)');
}
