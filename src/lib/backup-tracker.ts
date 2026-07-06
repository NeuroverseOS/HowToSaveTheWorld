// ============================================================================
// BACKUP TRACKER
// Local-first sovereignty has a sharp edge: uninstalling the app or clearing
// browser data erases the operator's entire record, and no browser lets a PWA
// intercept its own uninstall. So protection is proactive — track when the
// operator last downloaded their work, and warn when real progress is
// sitting unexported on a single device.
// ============================================================================

import { loadState, type StateSchema } from "./state-engine";

const EXPORT_KEY = "neuroverse_last_export";
const SNOOZE_KEY = "neuroverse_backup_nudge_snooze";

export interface ExportRecord {
  at: string;
  missions_at_export: number;
}

export function getLastExport(): ExportRecord | null {
  try {
    const raw = localStorage.getItem(EXPORT_KEY);
    return raw ? (JSON.parse(raw) as ExportRecord) : null;
  } catch {
    return null;
  }
}

/** Call from every export path (JSON backup, Obsidian vault). */
export function markExported(): void {
  try {
    const state = loadState();
    const record: ExportRecord = {
      at: new Date().toISOString(),
      missions_at_export: state?.progress.lessons_completed.length ?? 0,
    };
    localStorage.setItem(EXPORT_KEY, JSON.stringify(record));
    localStorage.removeItem(SNOOZE_KEY);
  } catch (error) {
    console.error("[BACKUP TRACKER] Failed to record export:", error);
  }
}

/** Dismissing the nudge snoozes it until the next mission completes. */
export function snoozeBackupNudge(state: StateSchema): void {
  try {
    localStorage.setItem(SNOOZE_KEY, String(state.progress.lessons_completed.length));
  } catch {
    /* non-fatal */
  }
}

/**
 * True when meaningful work sits unexported on this device:
 * - any progress and never exported, or
 * - 3+ missions completed since the last export, or
 * - an export exists but is more than 14 days old with new work since.
 * A dismissal holds until the operator completes another mission.
 */
export function shouldNudgeBackup(state: StateSchema): boolean {
  const completed = state.progress.lessons_completed.length;
  if (completed === 0) return false;

  const snoozedAt = parseInt(localStorage.getItem(SNOOZE_KEY) ?? "", 10);
  if (!Number.isNaN(snoozedAt) && completed <= snoozedAt) return false;

  const record = getLastExport();
  if (!record) return true;

  const missionsSince = completed - record.missions_at_export;
  if (missionsSince >= 3) return true;

  const days = (Date.now() - new Date(record.at).getTime()) / 86_400_000;
  return missionsSince >= 1 && days >= 14;
}
