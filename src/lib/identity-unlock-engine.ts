// NeuroVerse Identity Unlock Engine - Subsystem #4
// Controls trait unlocks, subskill unlocks, shadow reveals, and superpower reveals
// Writes to operator_traits and operator_evolution_log
// Integrates with Stage Engine and Prompt Assembly Engine

import { supabase } from "@/integrations/supabase/client";
import { TRAIT_MAP, type TraitDefinition } from "./identity-system";
import { saveRecentInsight, saveLongTermPattern } from "./identity-system";
import { getMissionLogs } from "./mission-log";
import {
  callOperatorAI,
  hasOperatorAIKey,
  parseJSONObjectFromAIResponse,
} from "./operator-ai";

// ============================================
// LOCAL-FIRST TRAIT DERIVATION
// ============================================
//
// The cloud trait tables (operator_traits, operator_evolution_log) only fill
// when the operator is signed in. Sovereignty-first, most operators never sign
// in — yet every completed mission already writes trait/shadow/power signals
// into the local mission log. So we derive the operator's living trait record
// from that local record and merge it with any cloud state. This is why the
// Field Guide and graduation dossier now reflect progress for local operators
// instead of showing "0 Traits Unlocked."

interface LocalTraitSignal {
  /** Distinct missions in which this trait was exercised. */
  missions: Set<number>;
  shadow: boolean;
  power: boolean;
}

/** Aggregate every mission log's signals per trait tag, once. */
function aggregateLocalTraitSignals(): Record<string, LocalTraitSignal> {
  const agg: Record<string, LocalTraitSignal> = {};
  const ensure = (tag: string): LocalTraitSignal =>
    (agg[tag] ??= { missions: new Set<number>(), shadow: false, power: false });

  for (const log of getMissionLogs()) {
    for (const tag of log.traitSignals || []) ensure(tag).missions.add(log.lessonId);
    for (const tag of log.shadowSignals || []) {
      const a = ensure(tag);
      a.shadow = true;
      a.missions.add(log.lessonId);
    }
    for (const tag of log.powerSignals || []) {
      const a = ensure(tag);
      a.power = true;
      a.missions.add(log.lessonId);
    }
  }
  return agg;
}

/** Derive one trait's completion state from local mission signals. */
function localTraitCompletion(traitTag: string) {
  const traitDef = TRAIT_MAP[traitTag];
  const signal = aggregateLocalTraitSignals()[traitTag];
  const missions = signal?.missions.size || 0;
  const totalSubskills = traitDef.subskills.length;

  // Each distinct mission that exercises the trait unlocks one subskill, up to
  // the trait's ceiling — training makes the lens sharper, mission by mission.
  const subskillsUnlocked = Math.min(missions, totalSubskills);
  // Shadow surfaces once the trait is well-practiced (mirrors the cloud engine's
  // 3-subskill auto-reveal) or the moment a shadow signal is detected outright.
  const shadowRevealed = !!signal && (signal.shadow || subskillsUnlocked >= totalSubskills);
  // Superpower emerges only when the trait is fully practiced, its shadow owned,
  // and a breakthrough (power) signal has fired.
  const superpowerRevealed = !!signal && signal.power && shadowRevealed && subskillsUnlocked >= totalSubskills;

  return {
    unlocked: missions >= 1,
    subskillsUnlocked,
    shadowRevealed,
    superpowerRevealed,
  };
}

// ============================================
// CORE UNLOCK TYPES
// ============================================

export interface UnlockResult {
  type: 'trait' | 'subskill' | 'shadow' | 'superpower';
  traitTag: string;
  subskillName?: string;
  insightText: string;
  timestamp: string;
}

export interface EvolutionLogEntry {
  user_id: string;
  lesson_id?: number;
  trait_tag?: string;
  subskill_unlocked?: string;
  insight_type: string;
  insight_text: string;
}

// ============================================
// UNLOCK RULES (Based on NeuroVerse Protocol)
// ============================================

/**
 * UNLOCK RULES:
 * - Each mission CAN unlock 1-2 traits (first time)
 * - Each mission unlocks 1 subskill within an existing trait
 * - Shadows reveal after 3 subskills in a trait
 * - Superpowers reveal after all subskills + shadow in a trait
 */

// ============================================
// 1. TRAIT UNLOCK (First-Time Activation)
// ============================================

/**
 * Unlock a trait for the first time
 * Writes to operator_traits and operator_evolution_log
 */
export async function unlockTrait(
  userId: string,
  traitTag: string,
  lessonId: number,
  insightText: string
): Promise<UnlockResult | null> {
  try {
    const traitDef = TRAIT_MAP[traitTag];
    if (!traitDef) {
      console.error(`[UNLOCK ENGINE] Invalid trait tag: ${traitTag}`);
      return null;
    }

    console.log(`[UNLOCK ENGINE] Unlocking trait: ${traitTag} for user ${userId}`);

    // Check if already unlocked
    const { data: existing } = await supabase
      .from('operator_traits')
      .select('unlocked')
      .eq('user_id', userId)
      .eq('trait_tag', traitTag)
      .single();

    if (existing?.unlocked) {
      console.log(`[UNLOCK ENGINE] Trait ${traitTag} already unlocked`);
      return null;
    }

    // Unlock the trait
    const { error: traitError } = await supabase
      .from('operator_traits')
      .upsert({
        user_id: userId,
        trait_tag: traitTag,
        unlocked: true,
        unlocked_at: new Date().toISOString(),
        subskills_unlocked: [],
        shadow_revealed: false,
        superpower_revealed: false,
      }, {
        onConflict: 'user_id,trait_tag'
      });

    if (traitError) {
      console.error('[UNLOCK ENGINE] Failed to unlock trait:', traitError);
      return null;
    }

    // Log to evolution log
    await logEvolution({
      user_id: userId,
      lesson_id: lessonId,
      trait_tag: traitTag,
      insight_type: 'trait_unlock',
      insight_text: insightText || `Trait activated: ${traitDef.name}`,
    });

    const result: UnlockResult = {
      type: 'trait',
      traitTag,
      insightText: `🔓 **${traitDef.name}** trait unlocked`,
      timestamp: new Date().toISOString(),
    };

    console.log(`[UNLOCK ENGINE] ✅ Trait unlocked: ${traitTag}`);
    return result;
  } catch (error) {
    console.error('[UNLOCK ENGINE] Trait unlock error:', error);
    return null;
  }
}

// ============================================
// 2. SUBSKILL UNLOCK
// ============================================

/**
 * Unlock a subskill within an existing trait
 * Each mission typically unlocks 1 subskill
 */
export async function unlockSubskill(
  userId: string,
  traitTag: string,
  subskillName: string,
  lessonId: number,
  insightText: string
): Promise<UnlockResult | null> {
  try {
    const traitDef = TRAIT_MAP[traitTag];
    if (!traitDef) {
      console.error(`[UNLOCK ENGINE] Invalid trait tag: ${traitTag}`);
      return null;
    }

    if (!traitDef.subskills.includes(subskillName)) {
      console.error(`[UNLOCK ENGINE] Invalid subskill ${subskillName} for trait ${traitTag}`);
      return null;
    }

    console.log(`[UNLOCK ENGINE] Unlocking subskill: ${subskillName} in ${traitTag}`);

    // Get current trait state
    const { data: trait, error: fetchError } = await supabase
      .from('operator_traits')
      .select('*')
      .eq('user_id', userId)
      .eq('trait_tag', traitTag)
      .single();

    if (fetchError || !trait) {
      console.error('[UNLOCK ENGINE] Trait not found, cannot unlock subskill');
      return null;
    }

    const currentSubskills = (trait.subskills_unlocked as string[]) || [];
    
    // Check if already unlocked
    if (currentSubskills.includes(subskillName)) {
      console.log(`[UNLOCK ENGINE] Subskill ${subskillName} already unlocked`);
      return null;
    }

    // Add subskill
    const updatedSubskills = [...currentSubskills, subskillName];

    const { error: updateError } = await supabase
      .from('operator_traits')
      .update({
        subskills_unlocked: updatedSubskills,
      })
      .eq('user_id', userId)
      .eq('trait_tag', traitTag);

    if (updateError) {
      console.error('[UNLOCK ENGINE] Failed to unlock subskill:', updateError);
      return null;
    }

    // Log to evolution log
    await logEvolution({
      user_id: userId,
      lesson_id: lessonId,
      trait_tag: traitTag,
      subskill_unlocked: subskillName,
      insight_type: 'subskill_unlock',
      insight_text: insightText || `Subskill unlocked: ${subskillName}`,
    });

    const result: UnlockResult = {
      type: 'subskill',
      traitTag,
      subskillName,
      insightText: `📈 ${traitDef.name}: **${subskillName.replace(/_/g, ' ')}** unlocked`,
      timestamp: new Date().toISOString(),
    };

    // Check if shadow should auto-reveal (3+ subskills)
    if (updatedSubskills.length >= 3 && !trait.shadow_revealed) {
      console.log(`[UNLOCK ENGINE] 🌑 Auto-revealing shadow for ${traitTag}`);
      await revealShadow(userId, traitTag, lessonId, 'Shadow revealed through repeated pattern observation');
    }

    console.log(`[UNLOCK ENGINE] ✅ Subskill unlocked: ${subskillName} (${updatedSubskills.length}/${traitDef.subskills.length})`);
    return result;
  } catch (error) {
    console.error('[UNLOCK ENGINE] Subskill unlock error:', error);
    return null;
  }
}

// ============================================
// 3. SHADOW REVEAL
// ============================================

/**
 * Reveal a trait's shadow aspect
 * Typically triggered after 3 subskills unlocked
 */
export async function revealShadow(
  userId: string,
  traitTag: string,
  lessonId: number,
  insightText: string
): Promise<UnlockResult | null> {
  try {
    const traitDef = TRAIT_MAP[traitTag];
    if (!traitDef) {
      console.error(`[UNLOCK ENGINE] Invalid trait tag: ${traitTag}`);
      return null;
    }

    console.log(`[UNLOCK ENGINE] Revealing shadow for: ${traitTag}`);

    // Check if already revealed
    const { data: trait } = await supabase
      .from('operator_traits')
      .select('shadow_revealed')
      .eq('user_id', userId)
      .eq('trait_tag', traitTag)
      .single();

    if (trait?.shadow_revealed) {
      console.log(`[UNLOCK ENGINE] Shadow already revealed for ${traitTag}`);
      return null;
    }

    // Reveal shadow
    const { error: updateError } = await supabase
      .from('operator_traits')
      .update({
        shadow_revealed: true,
      })
      .eq('user_id', userId)
      .eq('trait_tag', traitTag);

    if (updateError) {
      console.error('[UNLOCK ENGINE] Failed to reveal shadow:', updateError);
      return null;
    }

    // Log to evolution log
    await logEvolution({
      user_id: userId,
      lesson_id: lessonId,
      trait_tag: traitTag,
      insight_type: 'shadow_reveal',
      insight_text: insightText || `Shadow revealed: ${traitDef.shadow}`,
    });

    const result: UnlockResult = {
      type: 'shadow',
      traitTag,
      insightText: `🌑 **Shadow Revealed**: ${traitDef.shadow}`,
      timestamp: new Date().toISOString(),
    };

    console.log(`[UNLOCK ENGINE] ✅ Shadow revealed: ${traitTag}`);
    return result;
  } catch (error) {
    console.error('[UNLOCK ENGINE] Shadow reveal error:', error);
    return null;
  }
}

// ============================================
// 4. SUPERPOWER REVEAL
// ============================================

/**
 * Reveal a trait's superpower
 * Triggered after all subskills + shadow revealed
 */
export async function revealSuperpower(
  userId: string,
  traitTag: string,
  lessonId: number,
  insightText: string
): Promise<UnlockResult | null> {
  try {
    const traitDef = TRAIT_MAP[traitTag];
    if (!traitDef) {
      console.error(`[UNLOCK ENGINE] Invalid trait tag: ${traitTag}`);
      return null;
    }

    console.log(`[UNLOCK ENGINE] Revealing superpower for: ${traitTag}`);

    // Check if already revealed
    const { data: trait } = await supabase
      .from('operator_traits')
      .select('*')
      .eq('user_id', userId)
      .eq('trait_tag', traitTag)
      .single();

    if (trait?.superpower_revealed) {
      console.log(`[UNLOCK ENGINE] Superpower already revealed for ${traitTag}`);
      return null;
    }

    // Verify prerequisites (all subskills + shadow)
    const unlockedSubskills = (trait?.subskills_unlocked as string[]) || [];
    if (unlockedSubskills.length < traitDef.subskills.length) {
      console.log(`[UNLOCK ENGINE] Cannot reveal superpower: ${unlockedSubskills.length}/${traitDef.subskills.length} subskills`);
      return null;
    }

    if (!trait?.shadow_revealed) {
      console.log(`[UNLOCK ENGINE] Cannot reveal superpower: shadow not yet revealed`);
      return null;
    }

    // Reveal superpower
    const { error: updateError } = await supabase
      .from('operator_traits')
      .update({
        superpower_revealed: true,
      })
      .eq('user_id', userId)
      .eq('trait_tag', traitTag);

    if (updateError) {
      console.error('[UNLOCK ENGINE] Failed to reveal superpower:', updateError);
      return null;
    }

    // Log to evolution log
    await logEvolution({
      user_id: userId,
      lesson_id: lessonId,
      trait_tag: traitTag,
      insight_type: 'superpower_reveal',
      insight_text: insightText || `Superpower revealed: ${traitDef.superpower}`,
    });

    const result: UnlockResult = {
      type: 'superpower',
      traitTag,
      insightText: `⚡ **SUPERPOWER UNLOCKED**: ${traitDef.superpower}`,
      timestamp: new Date().toISOString(),
    };

    console.log(`[UNLOCK ENGINE] ✅ Superpower revealed: ${traitTag}`);
    return result;
  } catch (error) {
    console.error('[UNLOCK ENGINE] Superpower reveal error:', error);
    return null;
  }
}

// ============================================
// 5. EVOLUTION LOGGING
// ============================================

/**
 * Write unlock event to operator_evolution_log
 */
export async function logEvolution(entry: EvolutionLogEntry): Promise<void> {
  try {
    const { error } = await supabase
      .from('operator_evolution_log')
      .insert({
        ...entry,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[UNLOCK ENGINE] Evolution log write failed:', error);
    } else {
      console.log(`[UNLOCK ENGINE] 📝 Evolution logged: ${entry.insight_type}`);
    }
  } catch (error) {
    console.error('[UNLOCK ENGINE] Evolution log error:', error);
  }
}

// ============================================
// 6. UNLOCK DETERMINATION (AI-Powered)
// ============================================

interface UnlockAnalysisResult {
  new_traits?: string[];
  subskills?: Array<{ trait: string; subskill: string }>;
  reasoning?: string;
}

/**
 * Analyze final reflection and determine unlocks
 * Called after FINAL stage completes, before Field Guide generation
 *
 * Analysis runs CLIENT-SIDE on the operator's own BYOK provider (via
 * callOperatorAI) — the analyze-trait-unlocks edge function is retired
 * (it depended on the defunct Lovable AI gateway).
 */
export async function determineUnlocksFromReflection(
  userId: string,
  lessonId: number,
  finalReflection: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<UnlockResult[]> {
  try {
    console.log(`[UNLOCK ENGINE] 🔍 Analyzing reflection for unlocks...`);

    if (!hasOperatorAIKey()) {
      console.error("[UNLOCK ENGINE] No API key available for unlock analysis");
      return [];
    }

    const unlocks: UnlockResult[] = [];

    // Get current operator state
    const { data: currentTraits } = await supabase
      .from('operator_traits')
      .select('*')
      .eq('user_id', userId);

    const unlockedTraitTags = currentTraits?.filter(t => t.unlocked).map(t => t.trait_tag) || [];
    const availableTraits = Object.keys(TRAIT_MAP).filter(t => !unlockedTraitTags.includes(t));

    // Extract user responses from conversation
    const userResponses = conversationHistory
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n\n');

    // Build analysis prompt
    const analysisPrompt = `Analyze this mission reflection and determine cognitive trait unlocks.

USER REFLECTION:
${finalReflection}

FULL CONVERSATION:
${userResponses}

CURRENT UNLOCKED TRAITS:
${unlockedTraitTags.map(tag => `- ${TRAIT_MAP[tag].name} (${tag})`).join('\n') || 'None'}

AVAILABLE TRAITS TO UNLOCK:
${availableTraits.map(tag => `- ${tag}: ${TRAIT_MAP[tag].definition}`).join('\n')}

INSTRUCTIONS:
1. Identify 0-2 traits that are CLEARLY demonstrated in the reflection
2. For already unlocked traits, identify which subskill was demonstrated
3. Return ONLY valid JSON in this exact format:

{
  "new_traits": ["trait_tag1", "trait_tag2"],
  "subskills": [
    {"trait": "trait_tag", "subskill": "subskill_name"}
  ],
  "reasoning": "Brief explanation of why these unlocks were chosen"
}

If no clear demonstrations, return: {"new_traits": [], "subskills": [], "reasoning": "No clear trait demonstrations"}`;

    // Run AI analysis client-side with the operator's own provider/key
    const aiResponse = await callOperatorAI({
      system: "You are the NeuroVerse trait unlock analyzer. Analyze reflections and return ONLY valid JSON with trait and subskill determinations. Be conservative - only unlock if clearly demonstrated.",
      prompt: analysisPrompt,
      temperature: 0.3,
      maxTokens: 1024,
    });

    const analysisResult = parseJSONObjectFromAIResponse<UnlockAnalysisResult>(aiResponse);

    if (!analysisResult) {
      console.error('[UNLOCK ENGINE] AI analysis failed or returned unparseable output');
      return [];
    }

    console.log('[UNLOCK ENGINE] AI Analysis:', analysisResult);

    // Process new trait unlocks
    if (analysisResult.new_traits && Array.isArray(analysisResult.new_traits)) {
      for (const traitTag of analysisResult.new_traits) {
        if (TRAIT_MAP[traitTag] && !unlockedTraitTags.includes(traitTag)) {
          const result = await unlockTrait(
            userId,
            traitTag,
            lessonId,
            `Demonstrated through: ${analysisResult.reasoning || 'mission reflection'}`
          );
          if (result) unlocks.push(result);
        }
      }
    }

    // Process subskill unlocks
    if (analysisResult.subskills && Array.isArray(analysisResult.subskills)) {
      for (const { trait, subskill } of analysisResult.subskills) {
        if (TRAIT_MAP[trait] && unlockedTraitTags.includes(trait)) {
          const result = await unlockSubskill(
            userId,
            trait,
            subskill,
            lessonId,
            `Demonstrated: ${subskill.replace(/_/g, ' ')}`
          );
          if (result) unlocks.push(result);
        }
      }
    }

    // Update Box 6 (recent insight) with latest unlock
    if (unlocks.length > 0) {
      const latestUnlock = unlocks[unlocks.length - 1];
      await saveRecentInsight(userId, latestUnlock.insightText);
    }

    console.log(`[UNLOCK ENGINE] ✅ Determined ${unlocks.length} unlocks`);
    return unlocks;
  } catch (error) {
    console.error('[UNLOCK ENGINE] Unlock determination error:', error);
    return [];
  }
}

// ============================================
// 7. GET OPERATOR EVOLUTION TIMELINE
// ============================================

/**
 * Fetch complete evolution history for Field Guide display
 */
export async function getEvolutionTimeline(userId: string): Promise<EvolutionLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('operator_evolution_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[UNLOCK ENGINE] Failed to fetch evolution timeline:', error);
      return deriveLocalEvolution();
    }

    // Cloud is authoritative when present (signed-in operator). Otherwise fall
    // back to the timeline derived from the local mission log so local-first
    // operators still see their evolution history.
    return data && data.length > 0 ? data : deriveLocalEvolution();
  } catch (error) {
    console.error('[UNLOCK ENGINE] Evolution timeline error:', error);
    return deriveLocalEvolution();
  }
}

/**
 * Build an evolution timeline from the local mission log — trait activations,
 * reinforcements, shadow surfacings, and superpower emergences — in the same
 * newest-first order the cloud query returns.
 */
function deriveLocalEvolution(): EvolutionLogEntry[] {
  const logs = [...getMissionLogs()].sort((a, b) => a.lessonId - b.lessonId);
  const seenTrait = new Set<string>();
  const seenShadow = new Set<string>();
  const seenPower = new Set<string>();
  const entries: EvolutionLogEntry[] = [];

  const push = (
    log: (typeof logs)[number],
    tag: string,
    insight_type: string,
    insight_text: string,
  ) => {
    // The Field Guide timeline keys on `id` and renders `created_at`; these live
    // outside the cloud EvolutionLogEntry shape, so attach them via a widened cast.
    entries.push({
      id: `local-${log.lessonId}-${insight_type}-${tag}`,
      user_id: 'local',
      lesson_id: log.lessonId,
      trait_tag: tag,
      insight_type,
      insight_text,
      created_at: new Date(log.timestamp).toISOString(),
    } as EvolutionLogEntry);
  };

  for (const log of logs) {
    for (const tag of Array.from(new Set(log.traitSignals || []))) {
      const def = TRAIT_MAP[tag];
      if (!def) continue;
      if (!seenTrait.has(tag)) {
        seenTrait.add(tag);
        push(log, tag, 'trait_unlock', `Trait activated: ${def.name}`);
      } else {
        push(log, tag, 'subskill_unlock', `${def.name}: pattern reinforced`);
      }
    }
    for (const tag of Array.from(new Set(log.shadowSignals || []))) {
      const def = TRAIT_MAP[tag];
      if (!def || seenShadow.has(tag)) continue;
      seenShadow.add(tag);
      push(log, tag, 'shadow_reveal', `Shadow surfaced: ${def.shadow}`);
    }
    for (const tag of Array.from(new Set(log.powerSignals || []))) {
      const def = TRAIT_MAP[tag];
      if (!def || seenPower.has(tag)) continue;
      seenPower.add(tag);
      push(log, tag, 'superpower_reveal', `Superpower emerging: ${def.superpower}`);
    }
  }

  return entries.reverse();
}

// ============================================
// 8. GET TRAIT COMPLETION STATUS
// ============================================

/**
 * Calculate completion percentage for a trait
 */
export async function getTraitCompletion(
  userId: string,
  traitTag: string
): Promise<{
  trait: TraitDefinition;
  unlocked: boolean;
  subskillsUnlocked: number;
  totalSubskills: number;
  shadowRevealed: boolean;
  superpowerRevealed: boolean;
  completionPercent: number;
}> {
  const traitDef = TRAIT_MAP[traitTag];
  
  const { data: trait } = await supabase
    .from('operator_traits')
    .select('*')
    .eq('user_id', userId)
    .eq('trait_tag', traitTag)
    .single();

  const totalSubskills = traitDef.subskills.length;

  // Merge cloud state (signed-in) with the local-first derivation so the record
  // is honest whether or not the operator ever created an account. Take the
  // stronger of the two for every dimension — cloud progress is never lost, and
  // local progress finally shows up.
  const local = localTraitCompletion(traitTag);
  const cloudSubskills = (trait?.subskills_unlocked as string[])?.length || 0;
  const subskillsUnlocked = Math.max(cloudSubskills, local.subskillsUnlocked);
  const shadowRevealed = (trait?.shadow_revealed || false) || local.shadowRevealed;
  const superpowerRevealed = (trait?.superpower_revealed || false) || local.superpowerRevealed;
  const unlocked = (trait?.unlocked || false) || local.unlocked;

  // Calculate completion: subskills (60%) + shadow (20%) + superpower (20%)
  const subskillPercent = (subskillsUnlocked / totalSubskills) * 60;
  const shadowPercent = shadowRevealed ? 20 : 0;
  const superpowerPercent = superpowerRevealed ? 20 : 0;
  const completionPercent = Math.round(subskillPercent + shadowPercent + superpowerPercent);

  return {
    trait: traitDef,
    unlocked,
    subskillsUnlocked,
    totalSubskills,
    shadowRevealed,
    superpowerRevealed,
    completionPercent,
  };
}
