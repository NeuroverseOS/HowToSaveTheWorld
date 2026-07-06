// ============================================================================
// AUTO-SYNC
// Once an operator links their personal cloud vault (their own Supabase
// project), backups should be automatic — set and forget. After each
// completed mission the full record (state + satellites) uploads in the
// background. Failures are logged, never disruptive: local-first means the
// device copy is always the primary.
// ============================================================================

import { uploadStateToUserSupabase, loadUserSupabaseSettings } from "./state-engine";

const KEY = "neuroverse_auto_sync";

export function isAutoSyncEnabled(): boolean {
  return localStorage.getItem(KEY) === "true";
}

export function setAutoSyncEnabled(on: boolean): void {
  localStorage.setItem(KEY, on ? "true" : "false");
}

/** True when vault credentials exist (auto-sync has somewhere to go). */
export function hasVaultLinked(): boolean {
  return !!loadUserSupabaseSettings();
}

/** Fire-and-forget vault upload. Safe to call anywhere; no-ops unless
 *  auto-sync is on and a vault is linked. */
export function maybeAutoSync(context: string): void {
  if (!isAutoSyncEnabled() || !hasVaultLinked()) return;
  uploadStateToUserSupabase()
    .then(() => console.log(`[AUTO-SYNC] Vault updated (${context})`))
    .catch((error) => console.warn(`[AUTO-SYNC] Upload failed (${context}):`, error));
}
