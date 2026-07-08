// NeuroVerse Phase Assessment Engine
// At the close of each training phase (lessons 30 / 60 / 90), Echelon writes
// a formal one-page assessment — a witnessing, not a grade.
// Only sealed assessments persist (Mirror Gate canon: authority remains with the recruit).

import { supabase } from "@/integrations/supabase/client";
import { callOperatorAI, hasOperatorAIKey } from "./operator-ai";
import {
  loadState,
  saveState,
  type OperatorRank,
  type PhaseAssessmentRecord,
  type StateSchema,
} from "./state-engine";

// ============================================
// PHASE DEFINITIONS
// ============================================

export interface PhaseDefinition {
  phase: 1 | 2 | 3;
  assessmentName: string;
  phaseTitle: string;
  lessonStart: number;
  lessonEnd: number;
  capstoneLesson: 30 | 60 | 90;
  conferredRank: OperatorRank;
  nextPhaseTitle: string;
}

export const PHASE_DEFINITIONS: Record<1 | 2 | 3, PhaseDefinition> = {
  1: {
    phase: 1,
    assessmentName: "Perception Assessment",
    phaseTitle: "Design",
    lessonStart: 1,
    lessonEnd: 30,
    capstoneLesson: 30,
    conferredRank: "Vanguard Apprentice",
    nextPhaseTitle: "Build",
  },
  2: {
    phase: 2,
    assessmentName: "Systems Assessment",
    phaseTitle: "Build",
    lessonStart: 31,
    lessonEnd: 60,
    capstoneLesson: 60,
    conferredRank: "Vanguard",
    nextPhaseTitle: "Lead",
  },
  3: {
    phase: 3,
    assessmentName: "Command Assessment",
    phaseTitle: "Lead",
    lessonStart: 61,
    lessonEnd: 90,
    capstoneLesson: 90,
    conferredRank: "Steward",
    nextPhaseTitle: "Capstone",
  },
};

/**
 * Map a capstone lesson number (30/60/90) to its phase, or null otherwise.
 */
export function getPhaseForCapstoneLesson(lessonNumber: number): 1 | 2 | 3 | null {
  if (lessonNumber === 30) return 1;
  if (lessonNumber === 60) return 2;
  if (lessonNumber === 90) return 3;
  return null;
}

/**
 * Get the sealed assessment for a phase, if one exists.
 */
export function getSealedAssessment(
  state: StateSchema,
  phase: 1 | 2 | 3
): PhaseAssessmentRecord | null {
  return state.phase_assessments?.find((a) => a.phase === phase) || null;
}

/**
 * Replay-safety check: re-completing a capstone lesson must not re-run the ceremony.
 */
export function isPhaseAssessmentSealed(state: StateSchema, phase: 1 | 2 | 3): boolean {
  return getSealedAssessment(state, phase) !== null;
}

/**
 * Find the lowest phase whose capstone lesson is complete but whose assessment
 * has not been sealed (ceremony pending or abandoned mid-flow).
 */
export function getPendingCeremonyPhase(state: StateSchema): 1 | 2 | 3 | null {
  for (const phase of [1, 2, 3] as const) {
    const def = PHASE_DEFINITIONS[phase];
    if (
      state.progress.lessons_completed.includes(def.capstoneLesson) &&
      !isPhaseAssessmentSealed(state, phase)
    ) {
      return phase;
    }
  }
  return null;
}

// ============================================
// PHASE DATA GATHERING
// ============================================

interface PhaseContext {
  callsign: string;
  archetype: { primary: string; shadow: string; rising: string };
  reflections: { lesson_id: number; content: string }[];
  unlockEvents: string[];
}

/**
 * Gather this phase's data from local state plus (best-effort, if signed in)
 * the operator's evolution log in Supabase.
 */
async function gatherPhaseContext(state: StateSchema, phase: 1 | 2 | 3): Promise<PhaseContext> {
  const def = PHASE_DEFINITIONS[phase];

  // Confirmed reflections for lessons in the phase range (local, canonical)
  const reflections = state.reflections
    .filter((r) => r.lesson_id >= def.lessonStart && r.lesson_id <= def.lessonEnd)
    .map((r) => ({ lesson_id: r.lesson_id, content: r.content }));

  // Trait unlocks / subskills / shadows earned during the phase (best-effort mirror)
  const unlockEvents: string[] = [];
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data, error } = await supabase
        .from("operator_evolution_log")
        .select("lesson_id, trait_tag, subskill_unlocked, insight_type, insight_text")
        .eq("user_id", state.user.id)
        .gte("lesson_id", def.lessonStart)
        .lte("lesson_id", def.lessonEnd)
        .order("created_at", { ascending: true });

      if (!error && data) {
        for (const entry of data) {
          const parts = [
            entry.insight_type || "evolution",
            entry.trait_tag ? `trait: ${entry.trait_tag}` : null,
            entry.subskill_unlocked ? `subskill: ${entry.subskill_unlocked}` : null,
            entry.insight_text || null,
          ].filter(Boolean);
          unlockEvents.push(parts.join(" — "));
        }
      }
    }
  } catch (error) {
    console.log("[PHASE ASSESSMENT] Evolution log unavailable (anonymous mode):", error);
  }

  // Local identity fallback when no cloud mirror is available
  if (unlockEvents.length === 0) {
    for (const trait of state.identity.unlocked_traits) {
      unlockEvents.push(`trait unlocked: ${trait}`);
    }
    for (const shadow of state.identity.revealed_shadows) {
      unlockEvents.push(`shadow revealed: ${shadow}`);
    }
  }

  return {
    callsign: state.user.vanguard.callsign || "Recruit",
    archetype: {
      primary: state.user.archetype.primary || "Unknown",
      shadow: state.user.archetype.shadow || "Unknown",
      rising: state.user.archetype.rising || "Unknown",
    },
    reflections,
    unlockEvents,
  };
}

// ============================================
// ASSESSMENT GENERATION (BYOK — user's own AI)
// ============================================

const ECHELON_ASSESSOR_SYSTEM =
  "You are Echelon, the AI instructor of NeuroVerse OS. You write formal phase assessments in first person. Voice: mythic-tech, terse, precise. No emojis, no markdown formatting, no headers. An assessment is a witnessing, not a grade.";

function buildAssessmentPrompt(
  def: PhaseDefinition,
  context: PhaseContext,
  adjustmentNote?: string
): string {
  const reflectionsBlock =
    context.reflections.length > 0
      ? context.reflections
          .map((r) => `[Mission ${r.lesson_id}] ${r.content.slice(0, 600)}`)
          .join("\n\n")
      : "No confirmed reflections on record for this phase.";

  const unlocksBlock =
    context.unlockEvents.length > 0
      ? context.unlockEvents.map((e) => `- ${e}`).join("\n")
      : "No recorded unlocks for this phase.";

  let prompt = `Write the "${def.assessmentName}" for Operator ${context.callsign}, marking completion of the ${def.phaseTitle} phase (missions ${def.lessonStart}-${def.lessonEnd}).

OPERATOR RECORD
Archetype — Primary: ${context.archetype.primary} | Shadow: ${context.archetype.shadow} | Rising: ${context.archetype.rising}

CONFIRMED REFLECTIONS FROM THIS PHASE:
${reflectionsBlock}

UNLOCKS EARNED DURING THIS PHASE:
${unlocksBlock}

REQUIREMENTS:
- One page. Plain prose paragraphs only. No headers, no lists, no emojis.
- Open by addressing "Operator ${context.callsign}".
- Witness how the operator's thinking changed across this phase. Cite their own words where they earn it.
- Name the pattern behind their unlocks.
- Name their shadow honestly. No flattery, no cruelty.
- First person Echelon throughout: I observed, I confirm. This is a witnessing, not a grade.
- Close with a single line commissioning them into the ${def.nextPhaseTitle} phase as ${def.conferredRank}.`;

  if (adjustmentNote) {
    prompt += `

REVISION REQUESTED BY THE OPERATOR (authority remains with the recruit — honor this note):
"${adjustmentNote}"`;
  }

  return prompt;
}

/**
 * Generate the phase assessment via the operator's own AI provider.
 * Provider routing lives in the shared callOperatorAI helper.
 */
export async function generatePhaseAssessment(
  phase: 1 | 2 | 3,
  adjustmentNote?: string
): Promise<string | null> {
  try {
    const state = loadState();
    if (!state) {
      console.error("[PHASE ASSESSMENT] No state available");
      return null;
    }

    if (!hasOperatorAIKey()) {
      console.error("[PHASE ASSESSMENT] No API key available");
      return null;
    }

    const def = PHASE_DEFINITIONS[phase];
    const context = await gatherPhaseContext(state, phase);
    const prompt = buildAssessmentPrompt(def, context, adjustmentNote);

    const assessment = await callOperatorAI({
      system: ECHELON_ASSESSOR_SYSTEM,
      prompt,
      temperature: 0.7,
      maxTokens: 2048,
    });

    if (!assessment) {
      console.error("[PHASE ASSESSMENT] Empty assessment returned");
      return null;
    }

    console.log(`[PHASE ASSESSMENT] Generated ${PHASE_DEFINITIONS[phase].assessmentName}`);
    return assessment;
  } catch (error) {
    console.error("[PHASE ASSESSMENT] Generation failed:", error);
    return null;
  }
}

// ============================================
// MIRROR GATE: SEALING
// ============================================

/**
 * Seal a phase assessment. Only sealed assessments persist — canon.
 * Local state is canonical; Supabase field_guide_pages is a best-effort mirror
 * (page_type 'phase_assessment') when signed in.
 */
export async function sealPhaseAssessment(
  phase: 1 | 2 | 3,
  content: string
): Promise<PhaseAssessmentRecord | null> {
  const state = loadState();
  if (!state) return null;

  const def = PHASE_DEFINITIONS[phase];
  const record: PhaseAssessmentRecord = {
    phase,
    name: def.assessmentName,
    content,
    sealed_at: new Date().toISOString(),
    lesson_id: def.capstoneLesson,
  };

  // Replace any existing record for this phase (replay-safe)
  state.phase_assessments = [
    ...state.phase_assessments.filter((a) => a.phase !== phase),
    record,
  ].sort((a, b) => a.phase - b.phase);
  saveState(state);

  // Best-effort cloud mirror when signed in
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from("field_guide_pages").insert({
        user_id: state.user.id,
        trait_tag: `phase_${phase}`,
        page_type: "phase_assessment",
        narrative: content,
      });
    }
  } catch (error) {
    console.error("[PHASE ASSESSMENT] Cloud mirror failed (local seal intact):", error);
  }

  console.log(`[PHASE ASSESSMENT] Sealed: ${def.assessmentName}`);
  return record;
}
