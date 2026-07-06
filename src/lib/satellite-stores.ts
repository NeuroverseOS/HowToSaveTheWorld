// ============================================================================
// SATELLITE STORES
// The operator's work is bigger than StateSchema: deep reflections, mission
// insight logs, and Echelon conversation threads live in their own
// localStorage keys. Any backup/restore or cloud sync that moves only the
// core state silently drops the dossier's soul — this module is the single
// source of truth for what else must travel.
//
// Whitelist only. AI provider keys and device flags never leave the device.
// ============================================================================

const SATELLITE_KEYS = [
  "neuroverse_reflections_v2",   // deep reflection entries (dossier)
  "neuroverse_mission_log_v2",   // per-mission insight summaries & signals
  "nv:echelonThread",            // Echelon thread positions per lesson
  "nv:echelonMessages",          // Echelon conversation caches per lesson
  "neuroverse_orientation_complete",
] as const;

export type SatelliteBundle = Record<string, string>;

/** Snapshot every whitelisted satellite store that currently has data. */
export function collectSatellites(): SatelliteBundle {
  const bundle: SatelliteBundle = {};
  for (const key of SATELLITE_KEYS) {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) bundle[key] = value;
    } catch {
      /* skip unreadable key */
    }
  }
  return bundle;
}

/** Restore a snapshot. Only whitelisted keys are written — imported files
 *  can never plant arbitrary localStorage entries. */
export function restoreSatellites(bundle: SatelliteBundle | undefined | null): number {
  if (!bundle) return 0;
  let restored = 0;
  for (const key of SATELLITE_KEYS) {
    const value = bundle[key];
    if (typeof value === "string") {
      try {
        localStorage.setItem(key, value);
        restored++;
      } catch (error) {
        console.error(`[SATELLITES] Failed to restore ${key}:`, error);
      }
    }
  }
  return restored;
}
