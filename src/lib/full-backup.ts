// ============================================================================
// FULL BACKUP (v2)
// One file that carries everything: core state PLUS the satellite stores
// (deep reflections, mission logs, Echelon threads). Restoring it on any
// device resumes the operator exactly where they left off — same lesson,
// same stage, same conversations, same dossier.
//
// Backward compatible both ways: v1 state-only files still import here, and
// v2 files still import into older builds (they read the `state` field).
// ============================================================================

import { loadState, saveState, type StateSchema } from "./state-engine";
import { collectSatellites, restoreSatellites, type SatelliteBundle } from "./satellite-stores";
import { markExported } from "./backup-tracker";

export interface FullBackup {
  neuroverse_version: string;
  format?: "neuroverse_full_backup_v2";
  exported_at: string;
  exported_from: string;
  state: StateSchema;
  satellites?: SatelliteBundle;
}

export function buildFullBackup(): FullBackup | null {
  const state = loadState();
  if (!state) return null;
  return {
    neuroverse_version: "2.0.0",
    format: "neuroverse_full_backup_v2",
    exported_at: new Date().toISOString(),
    exported_from: "NeuroVerse OS",
    state,
    satellites: collectSatellites(),
  };
}

/** Build and download the full backup. Returns false when no state exists. */
export function downloadFullBackup(): boolean {
  const backup = buildFullBackup();
  if (!backup) return false;

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `neuroverse_backup_${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  markExported();
  return true;
}

export interface RestoreResult {
  state: StateSchema;
  satellitesRestored: number;
  legacyFormat: boolean;
}

/**
 * Restore from a parsed backup file (v2 full bundle, v1 envelope, or a bare
 * state object). Caller confirms with the operator and validates the state
 * before invoking. Reload after — every engine reads storage on mount.
 */
export function restoreFullBackup(parsed: unknown): RestoreResult {
  const data = parsed as FullBackup & StateSchema;
  const state = (data.state ?? data) as StateSchema;
  const isV2 = data?.format === "neuroverse_full_backup_v2" && !!data.satellites;

  saveState(state);
  const satellitesRestored = isV2 ? restoreSatellites(data.satellites) : 0;

  return { state, satellitesRestored, legacyFormat: !isV2 };
}
