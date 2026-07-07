// ============================================================================
// RESET TIERS — the single source of truth for what each reset clears.
//
// The operator's experience lives in TWO places: the core state
// (neuroverse_state) and the satellite stores (Echelon threads, reflections,
// mission logs). A reset that clears one but not the other produces ghosts —
// missions that rehydrate mid-conversation after "starting over."
// Every reset path in the app must go through one of these two functions.
//
// Device configuration is never touched by either tier: resetting your
// training should not disconnect your hardware. AI provider keys, the
// sovereign backend, the personal vault link, theme, motion, audio-unlock,
// and PWA/install flags all survive.
// ============================================================================

import { loadState, saveState, initializeState } from "./state-engine";
import { downloadFullBackup } from "./full-backup";

// Per-mission artifacts: conversation threads, reflections, mission logs.
// These rehydrate lessons — they must die whenever progress resets.
const MISSION_DATA_KEYS = [
  "nv:echelonThread",
  "nv:echelonMessages",
  "neuroverse_reflections_v2",
  "neuroverse_mission_log_v2",
];

// Everything that constitutes "the experience" — core state, mission data,
// onboarding flags, and backup-nudge tracking. Deliberately NOT listed:
// AI provider config, sovereign backend, vault creds, theme, reduced motion,
// audio unlock, PWA flags, lesson content cache.
const EXPERIENCE_KEYS = [
  ...MISSION_DATA_KEYS,
  "neuroverse_state",
  "neuroverse_orientation_complete",
  "neuroverse_archetype_funding_shown",
  "neuroverse_seen_cinematic",
  "neuroverse_recruitment_source",
  "neuroverse_last_export",
  "neuroverse_backup_nudge_snooze",
];

/**
 * Back to Mission 1 — identity survives.
 * Callsign, archetype, language, backup and audio preferences carry over;
 * progress, world state, ranks, traits, threads, and reflections start fresh.
 */
export function resetMissionProgress(): void {
  // A wipe always hands the operator a backup first — nothing is ever cleared
  // without a restorable file in their hands (sovereignty non-negotiable).
  try { downloadFullBackup(); } catch { /* no state — nothing to back up */ }
  const state = loadState();
  if (state) {
    const fresh = initializeState();
    fresh.user = state.user;
    saveState(fresh);
  }
  MISSION_DATA_KEYS.forEach((key) => localStorage.removeItem(key));
}

/**
 * The full wipe — the experience starts from nothing.
 * Only device configuration survives (see EXPERIENCE_KEYS note above).
 * Callers should hard-redirect to "/" afterwards so the operator lands at
 * the true start and no in-memory caches survive:
 *   resetEverything(); window.location.href = "/";
 */
export function resetEverything(): void {
  // Back up before the full wipe — the operator leaves with everything, even
  // when they're erasing everything.
  try { downloadFullBackup(); } catch { /* no state — nothing to back up */ }
  EXPERIENCE_KEYS.forEach((key) => localStorage.removeItem(key));
}

/** @deprecated kept for older callers — routes through resetMissionProgress */
export function resetToLessonOne() {
  const confirmed = window.confirm(
    "Reset your progress back to Mission 1? Completed missions, mission threads, and reflections will be cleared — your identity and archetype are kept."
  );

  if (confirmed) {
    resetMissionProgress();
    window.location.href = "/dashboard";
  }
}
