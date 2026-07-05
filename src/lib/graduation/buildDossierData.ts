import { loadState } from "@/lib/state-engine";
import { supabase } from "@/integrations/supabase/client";
import { getTraitCompletion, getEvolutionTimeline } from "@/lib/identity-unlock-engine";
import { TRAIT_MAP } from "@/lib/identity-system";

export interface DossierData {
  callsign: string;
  userId: string;
  language: string;
  rank: string;
  phaseAssessments: {
    phase: number;
    name: string;
    content: string;
    sealed_at: string;
  }[];
  archetypes: {
    primary: string | null;
    shadow: string | null;
    rising: string | null;
  };
  traits: {
    trait_tag: string;
    trait_name: string;
    unlocked: boolean;
    subskills_unlocked: string[];
    total_subskills: number;
    shadow_revealed: boolean;
    superpower_revealed: boolean;
    completionPercent: number;
  }[];
  timeline: {
    id: string;
    lesson_id: number | null;
    trait_tag: string | null;
    subskill_unlocked: string | null;
    insight_type: string | null;
    insight_text: string | null;
    unlocked_at: string | null;
  }[];
  longTermPattern: string | null;
  missionStats: {
    totalMissions: number;
    completedMissions: number;
    completionRate: number;
  };
  generatedAt: string;
}

export async function buildDossierData(): Promise<DossierData> {
  console.log('[DOSSIER] Building graduation dossier data...');
  
  const state = loadState();
  if (!state) {
    throw new Error('No state found - cannot build dossier');
  }

  const userId = state.user.id;
  const callsign = state.user.vanguard.callsign || "Recruit";
  const language = state.user.language?.code || "en";
  const rank = state.rank?.current || "Recruit";

  // Sealed phase assessments (in phase order). Users who graduated before
  // this feature existed simply have none — omitted gracefully downstream.
  const phaseAssessments = (state.phase_assessments || [])
    .slice()
    .sort((a, b) => a.phase - b.phase)
    .map((a) => ({
      phase: a.phase,
      name: a.name,
      content: a.content,
      sealed_at: a.sealed_at,
    }));

  // Fetch archetype data
  const archetypes = {
    primary: state.user.archetype.primary,
    shadow: state.user.archetype.shadow,
    rising: state.user.archetype.rising,
  };

  // Fetch all trait completion data
  const allTraitTags = Object.keys(TRAIT_MAP);
  const traitPromises = allTraitTags.map(async (traitTag) => {
    const completion = await getTraitCompletion(userId, traitTag);
    return {
      trait_tag: traitTag,
      trait_name: completion.trait.name,
      unlocked: completion.unlocked,
      subskills_unlocked: Array(completion.subskillsUnlocked).fill('').map((_, i) => 
        completion.trait.subskills[i]
      ).filter(Boolean),
      total_subskills: completion.trait.subskills.length,
      shadow_revealed: completion.shadowRevealed,
      superpower_revealed: completion.superpowerRevealed,
      completionPercent: completion.completionPercent,
    };
  });

  const traits = await Promise.all(traitPromises);

  // Fetch evolution timeline (returns database rows, not EvolutionLogEntry interface)
  const timelineData = await getEvolutionTimeline(userId);
  const timeline = timelineData.map((entry: any) => ({
    id: entry.id as string,
    lesson_id: entry.lesson_id ?? null,
    trait_tag: entry.trait_tag ?? null,
    subskill_unlocked: entry.subskill_unlocked ?? null,
    insight_type: entry.insight_type ?? null,
    insight_text: entry.insight_text ?? null,
    unlocked_at: entry.created_at ?? null,
  }));

  // Fetch long-term pattern from operator_identity_notes
  let longTermPattern: string | null = null;
  try {
    const { data: notes, error } = await supabase
      .from('operator_identity_notes')
      .select('note_content')
      .eq('user_id', userId)
      .eq('note_type', 'long_term_pattern')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!error && notes) {
      longTermPattern = notes.note_content;
    }
  } catch (error) {
    console.log('[DOSSIER] No long-term pattern found:', error);
  }

  // Calculate mission statistics
  const totalMissions = 90; // NeuroVerse canonical total
  const completedMissions = state.progress.lessons_completed.length;
  const completionRate = Math.round((completedMissions / totalMissions) * 100);

  const dossierData: DossierData = {
    callsign,
    userId,
    language,
    rank,
    phaseAssessments,
    archetypes,
    traits,
    timeline,
    longTermPattern,
    missionStats: {
      totalMissions,
      completedMissions,
      completionRate,
    },
    generatedAt: new Date().toISOString(),
  };

  console.log('[DOSSIER] Dossier data assembled:', {
    traits: traits.filter(t => t.unlocked).length,
    timeline: timeline.length,
    missions: completedMissions,
  });

  return dossierData;
}
