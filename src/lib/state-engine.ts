// NeuroVerse OS State Engine
// Implements the state schema from BlockD

import { collectSatellites, restoreSatellites } from "./satellite-stores";

// Mission Stage Types
// EXPANDED TO INCLUDE ONBOARDING STAGES (Box-Stage Map Integration v3.0)
export enum MissionStage {
  // Onboarding stages (pre-mission)
  ONBOARDING_SCREEN_1 = 'onboarding_screen_1',
  LANGUAGE_SELECTION = 'language_selection',
  ASSESSMENT = 'assessment',
  ORIENTATION_FOXHOLE = 'orientation_foxhole',
  
  // Mission stages
  BRIEFING = 'briefing',
  DRILL1 = 'drill1',
  VIDEO = 'video',
  HP = 'hp',
  DRILL2 = 'drill2',
  DEBRIEF = 'debrief',
  FINAL = 'final',
  REFLECTION = 'reflection',  // NEW: Deep reflection sub-stage
  COMPLETE = 'complete',
}

// OPERATOR RANK SYSTEM (Phase Graduations)
// Recruit → Operator (lesson 30) → Vanguard (lesson 60) → Steward (lesson 90)
export type OperatorRank = "Recruit" | "Vanguard Apprentice" | "Vanguard" | "Steward";

export const RANK_SEQUENCE: OperatorRank[] = ["Recruit", "Vanguard Apprentice", "Vanguard", "Steward"];

export interface RankRecord {
  rank: OperatorRank;
  earned_at: string;
  lesson_id: number;
}

// PHASE ASSESSMENT (sealed by the operator at the Mirror Gate)
export interface PhaseAssessmentRecord {
  phase: 1 | 2 | 3;
  name: string;              // "Perception Assessment" | "Systems Assessment" | "Command Assessment"
  content: string;           // the sealed assessment text
  sealed_at: string;
  lesson_id: number;         // 30 | 60 | 90
}

export interface MissionProgress {
  current_stage: MissionStage;
  stage_history: {
    stage: MissionStage;
    completed_at: string;
    user_response?: string;
  }[];
  video_completed: boolean;
  drill1_response: string | null;
  drill2_response: string | null;
  final_response: string | null;
}

export interface StateSchema {
  user: {
    id: string;
    name: string | null;
    
    // LANGUAGE PREFERENCE
    language: {
      code: string;              // "en", "de", "es", etc.
      name: string;              // "English", "Deutsch", "Español"
      selected_at: string | null;
    };
    
    // VANGUARD IDENTITY (external operational)
    vanguard: {
      designation: "Vanguard";
      callsign: string | null;           // "Alpha-13"
      full_identity: string | null;      // "Vanguard Alpha-13"
      assigned_at: string | null;
      activation_complete: boolean;
      // GRADUATION SYSTEM
      is_graduated: boolean;
      graduation_timestamp: string | null;
      post_foxhole_objective: string | null;
    };
    
    // ARCHETYPE SIGNATURE (internal psychological)
    archetype: {
      primary: string | null;
      shadow: string | null;
      rising: string | null;
      assessment_complete: boolean;
    };
    
    // BACKUP PREFERENCE (data sovereignty)
    backup: {
      method: 'manual' | 'cloud' | 'declined' | null;
      configured_at: string | null;
      last_export_at: string | null;
    };
    
    // AUDIO OUTPUT (Echelon Speech Layer)
    audio: {
      voice: string;
      speed: number;
      pitch: number;
      volume: number;
      enabled: boolean;
      configured_at: string | null;
    };
  };
  
  // WORK MODE (Design/Build/Lead operational modes)
  work: {
    modes_unlocked: {
      design: boolean;  // unlocks at lesson 30
      build: boolean;   // unlocks at lesson 60
      lead: boolean;    // unlocks at lesson 90
    };
    early_unlock_enabled: boolean;  // Settings override
    current_mode: 'design' | 'build' | 'lead' | null;
    current_context: {
      project_name: string;
      description: string;
      tags: string[];
      created_at: string;
    } | null;
    work_history: Array<{
      mode: string;
      context_name: string;
      started_at: string;
      ended_at: string | null;
    }>;
  };
  
  // OPERATOR RANK (conferred at phase graduation ceremonies)
  rank: {
    current: OperatorRank;
    history: RankRecord[];
  };

  // SEALED PHASE ASSESSMENTS (only sealed assessments persist — Mirror Gate canon)
  phase_assessments: PhaseAssessmentRecord[];

  // OPERATOR IDENTITY SYSTEM (trait tags for Echelon)
  identity: {
    unlocked_traits: string[];           // trait tags only (e.g., "systems_thinking")
    active_subskills: string[];          // subskill tags that have been unlocked
    revealed_shadows: string[];          // shadow aspects revealed
    revealed_superpowers: string[];      // superpower aspects revealed
  };
  
  progress: {
    current_lesson_id: number;
    current_section: number;
    current_phase: 1 | 2 | 3;
    lessons_completed: number[];
    sections_completed: number[];
    last_active: string;
    mission_progress: {
      [lessonId: number]: MissionProgress;
    };
  };
  reflections: {
    lesson_id: number;
    timestamp: string;
    content: string;
    mission_choice: "solo" | "team" | null;
  }[];
  field_guide: {
    sections: {
      section_id: number;
      title: string;
      lesson_range: string;
      signature: string;
      strength: string;
      vulnerability: string;
      pattern: string;
      evolution: string;
      generated_at: string;
    }[];
  };
  achievements: {
    badge_id: string;
    section_id: number;
    title: string;
    description: string;
    awarded_at: string;
  }[];
  fog: {
    current_level: number;
    history: {
      lesson_id: number;
      level: number;
      timestamp: string;
    }[];
  };
  drift: {
    current_score: number;
    history: {
      lesson_id: number;
      score: number;
      timestamp: string;
    }[];
  };

  // CAMPAIGN WORLD STATE (THE SLIDE — see docs/WORLD_DESIGN.md)
  world: {
    slide: number;                       // 0-100 centralization index; entropy pulls it up
    signal: number;                      // 0-100 operator resource; never zero-sum
    slide_history: {
      lesson_id: number;
      slide: number;
      reason: string;
      at: string;
    }[];
    decisions: {
      event_id: string;
      choice_id: string;
      lesson_id: number;
      at: string;
      effects: { signal: number; slide: number };
    }[];
  };
  metadata: {
    version: string;
    created_at: string;
    last_updated: string;
  };
}

const STATE_KEY = "neuroverse_state";

export function initializeState(): StateSchema {
  const now = new Date().toISOString();
  return {
    user: {
      id: crypto.randomUUID(), // Local sovereign identity
      name: null,
      language: {
        code: "en",
        name: "English",
        selected_at: null,
      },
      backup: {
        method: null,
        configured_at: null,
        last_export_at: null,
      },
      vanguard: {
        designation: "Vanguard",
        callsign: null,
        full_identity: null,
        assigned_at: null,
        activation_complete: false,
        is_graduated: false,
        graduation_timestamp: null,
        post_foxhole_objective: null,
      },
      archetype: {
        primary: null,
        shadow: null,
        rising: null,
        assessment_complete: false,
      },
      audio: {
        voice: "local_default",
        speed: 1.0,
        pitch: 1.0,
        volume: 1.0,
        enabled: false,
        configured_at: null,
      },
    },
    work: {
      modes_unlocked: {
        design: false,
        build: false,
        lead: false,
      },
      early_unlock_enabled: false,
      current_mode: null,
      current_context: null,
      work_history: [],
    },
    rank: {
      current: "Recruit",
      history: [],
    },
    phase_assessments: [],
    identity: {
      unlocked_traits: [],
      active_subskills: [],
      revealed_shadows: [],
      revealed_superpowers: [],
    },
    progress: {
      current_lesson_id: 1, // Always start at lesson 1
      current_section: 1,
      current_phase: 1,
      lessons_completed: [],
      sections_completed: [],
      last_active: now,
      mission_progress: {},
    },
    reflections: [],
    field_guide: {
      sections: [],
    },
    achievements: [],
    fog: {
      current_level: 0,
      history: [],
    },
    drift: {
      current_score: 0,
      history: [],
    },
    world: {
      slide: 62, // campaign opening state: deep in the third band, drifting
      signal: 100,
      slide_history: [],
      decisions: [],
    },
    metadata: {
      version: "1.0.0",
      created_at: now,
      last_updated: now,
    },
  };
}

export function loadState(): StateSchema | null {
  try {
    const stored = localStorage.getItem(STATE_KEY);
    if (!stored) return null;
    
    const state = JSON.parse(stored) as any;
    
    // Migrate old state structures to new schema
    if (!state.user?.language) {
      console.log("Migrating state: adding language preference");
      if (!state.user) state.user = {};
      state.user.language = {
        code: "en",
        name: "English",
        selected_at: null,
      };
    }
    
    if (!state.user?.vanguard) {
      console.log("Migrating state: adding vanguard structure");
      if (!state.user) state.user = {};
      state.user.vanguard = {
        designation: "Vanguard",
        callsign: null,
        full_identity: null,
        assigned_at: null,
        activation_complete: false,
        is_graduated: false,
        graduation_timestamp: null,
        post_foxhole_objective: null,
      };
    }
    
    // Migrate graduation fields if missing
    if (state.user?.vanguard && !('is_graduated' in state.user.vanguard)) {
      console.log("Migrating state: adding graduation fields");
      state.user.vanguard.is_graduated = false;
      state.user.vanguard.graduation_timestamp = null;
      state.user.vanguard.post_foxhole_objective = null;
    }
    
    // Migrate audio settings if missing
    if (!state.user?.audio) {
      console.log("Migrating state: adding audio settings");
      if (!state.user) state.user = {};
      state.user.audio = {
        voice: "local_default",
        speed: 1.0,
        pitch: 1.0,
        volume: 1.0,
        enabled: false,
        configured_at: null,
      };
    }
    
    // Migrate work mode if missing
    if (!state.work) {
      console.log("Migrating state: adding work mode");
      state.work = {
        modes_unlocked: {
          design: false,
          build: false,
          lead: false,
        },
        early_unlock_enabled: false,
        current_mode: null,
        current_context: null,
        work_history: [],
      };
    }
    
    if (!state.user?.archetype) {
      console.log("Migrating state: adding archetype structure");
      if (!state.user) state.user = {};
      state.user.archetype = {
        primary: null,
        shadow: null,
        rising: null,
        assessment_complete: false,
      };
    }
    
    // Migrate rank system if missing (derive from completed lessons)
    if (!state.rank) {
      console.log("Migrating state: adding rank system");
      const completed: number[] = state.progress?.lessons_completed || [];
      const derived = deriveRankFromLessons(completed);
      const now = new Date().toISOString();
      const history: RankRecord[] = [];
      const capstones: { rank: OperatorRank; lesson: number }[] = [
        { rank: "Vanguard Apprentice", lesson: 30 },
        { rank: "Vanguard", lesson: 60 },
        { rank: "Steward", lesson: 90 },
      ];
      for (const { rank, lesson } of capstones) {
        if (RANK_SEQUENCE.indexOf(derived) >= RANK_SEQUENCE.indexOf(rank)) {
          history.push({ rank, earned_at: now, lesson_id: lesson });
        }
      }
      state.rank = { current: derived, history };
    }

    // Migrate phase assessments if missing
    if (!state.phase_assessments) {
      console.log("Migrating state: adding phase assessments");
      state.phase_assessments = [];
    }

    // Migrate campaign world state if missing (THE SLIDE)
    if (!state.world) {
      console.log("Migrating state: adding campaign world state");
      state.world = {
        slide: 62,
        signal: 100,
        slide_history: [],
        decisions: [],
      };
    }

    // Ensure user.id exists
    if (!state.user?.id) {
      console.log("Migrating state: adding user id");
      if (!state.user) state.user = {};
      state.user.id = crypto.randomUUID();
    }
    
    return state as StateSchema;
  } catch (error) {
    console.error("Failed to load state:", error);
    return null;
  }
}

export function saveState(state: StateSchema): void {
  try {
    state.metadata.last_updated = new Date().toISOString();
    localStorage.setItem(STATE_KEY, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error("Failed to save state:", error);
  }
}

export function updateState(updates: Partial<StateSchema>): StateSchema {
  const current = loadState() || initializeState();
  const updated = { ...current, ...updates };
  saveState(updated);
  return updated;
}

export function hasState(): boolean {
  return localStorage.getItem(STATE_KEY) !== null;
}

export function clearState(): void {
  localStorage.removeItem(STATE_KEY);
}

// ============================================
// RANK SYSTEM HELPERS
// ============================================

/**
 * Derive the operator's rank from completed lessons.
 * Used for migration of existing users and as a fallback check.
 */
export function deriveRankFromLessons(lessonsCompleted: number[]): OperatorRank {
  const phaseComplete = (start: number, end: number) =>
    lessonsCompleted.filter((n) => n >= start && n <= end).length === end - start + 1;

  if (phaseComplete(61, 90)) return "Steward";
  if (phaseComplete(31, 60)) return "Vanguard";
  if (phaseComplete(1, 30)) return "Vanguard Apprentice";
  return "Recruit";
}

/**
 * Confer a rank on the operator (called at phase graduation ceremonies).
 * Replay-safe: never demotes, never double-records.
 */
export function conferRank(rank: OperatorRank, lessonId: number): StateSchema | null {
  const state = loadState();
  if (!state) return null;

  const currentIndex = RANK_SEQUENCE.indexOf(state.rank.current);
  const newIndex = RANK_SEQUENCE.indexOf(rank);

  if (newIndex <= currentIndex) {
    console.log(`[RANK] ${rank} already conferred or below current rank`);
    return state;
  }

  state.rank.current = rank;
  state.rank.history.push({
    rank,
    earned_at: new Date().toISOString(),
    lesson_id: lessonId,
  });
  saveState(state);
  console.log(`[RANK] Conferred: ${rank} (lesson ${lessonId})`);
  return state;
}

// Ensure local identity exists
export function ensureLocalIdentity(): StateSchema {
  let state = loadState();
  if (!state) {
    state = initializeState();
    saveState(state);
  }
  if (!state.user.id) {
    state.user.id = crypto.randomUUID();
    saveState(state);
  }
  return state;
}

// Validation helper for imported state
export function validateState(state: any): boolean {
  try {
    return (
      state &&
      typeof state === 'object' &&
      state.user?.id &&
      typeof state.user.id === 'string' &&
      state.progress &&
      typeof state.progress.current_lesson_id === 'number' &&
      Array.isArray(state.reflections) &&
      Array.isArray(state.achievements) &&
      state.metadata?.version &&
      state.metadata?.created_at
    );
  } catch {
    return false;
  }
}

// User-Owned Supabase Sync Functions
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface UserSupabaseSettings {
  url: string;
  anon_key: string;
}

const USER_SUPABASE_KEY = "neuroverse_user_supabase";

export function saveUserSupabaseSettings(settings: UserSupabaseSettings): void {
  localStorage.setItem(USER_SUPABASE_KEY, JSON.stringify(settings));
}

export function loadUserSupabaseSettings(): UserSupabaseSettings | null {
  const stored = localStorage.getItem(USER_SUPABASE_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function clearUserSupabaseSettings(): void {
  localStorage.removeItem(USER_SUPABASE_KEY);
}

// Create dynamic client using user's credentials
function getUserSupabaseClient(): SupabaseClient | null {
  const settings = loadUserSupabaseSettings();
  if (!settings?.url || !settings?.anon_key) return null;
  
  return createClient(settings.url, settings.anon_key);
}

// Upload state to user's own Supabase — the full record: core state plus
// the satellite stores (reflections, mission logs, Echelon conversations),
// so a sync-down on a new device resumes exactly where the operator left off.
export async function uploadStateToUserSupabase(): Promise<void> {
  const userSupabase = getUserSupabaseClient();
  if (!userSupabase) throw new Error("User Supabase credentials not configured");

  const state = loadState();
  if (!state) throw new Error("No local state to upload");

  const now = new Date().toISOString();
  const { error } = await userSupabase
    .from('user_state')
    .upsert([
      { id: 'neuroverse_state', state_json: state, updated_at: now },
      { id: 'neuroverse_satellites', state_json: collectSatellites(), updated_at: now },
    ]);

  if (error) throw error;
}

// Download state from user's own Supabase. Restores satellite stores too
// when present (older self-hosted backends without that row still work).
export async function downloadStateFromUserSupabase(): Promise<StateSchema | null> {
  const userSupabase = getUserSupabaseClient();
  if (!userSupabase) throw new Error("User Supabase credentials not configured");

  const { data, error } = await userSupabase
    .from('user_state')
    .select('state_json, updated_at')
    .eq('id', 'neuroverse_state')
    .maybeSingle();

  if (error) throw error;

  try {
    const { data: satellites } = await userSupabase
      .from('user_state')
      .select('state_json')
      .eq('id', 'neuroverse_satellites')
      .maybeSingle();
    if (satellites?.state_json) {
      restoreSatellites(satellites.state_json as Record<string, string>);
    }
  } catch (satError) {
    console.warn('[SYNC] Satellite restore skipped:', satError);
  }

  return data?.state_json as StateSchema | null;
}

// Get last sync timestamp from user's Supabase
export async function getUserSyncTimestamp(): Promise<string | null> {
  const userSupabase = getUserSupabaseClient();
  if (!userSupabase) return null;

  const { data } = await userSupabase
    .from('user_state')
    .select('updated_at')
    .eq('id', 'neuroverse_state')
    .maybeSingle();

  return data?.updated_at || null;
}
