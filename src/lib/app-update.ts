// ============================================================================
// APP UPDATE — force the newest deployed build onto the device.
//
// iOS installed PWAs are notorious for serving a stale cached build even after
// a hard close: the new service worker downloads but never activates. So the
// in-app "Check for Updates" doesn't just reload — it tears down the old
// service worker and its caches, guaranteeing the next load pulls every asset
// fresh from the network (a new worker re-registers automatically).
//
// Sovereignty: a reload must never be able to cost the operator their record.
// We export a full backup FIRST — one file with progress, reflections, and
// conversations — so "get the update" and "keep my data" are the same action.
// ============================================================================

import { downloadFullBackup } from "./full-backup";

export interface UpdateOptions {
  /** Download a full backup before reloading. Defaults to true. */
  backup?: boolean;
}

/**
 * Back up, purge the stale service worker + caches, then reload to the newest
 * build. localStorage (the operator's actual data) is never touched — only the
 * cached app shell is cleared, so progress survives intact.
 */
export async function backupAndUpdate({ backup = true }: UpdateOptions = {}): Promise<void> {
  if (backup) {
    try {
      downloadFullBackup();
    } catch {
      /* no state yet (fresh browser) — nothing to back up */
    }
  }

  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* best-effort teardown — reload regardless so the user is never stuck */
  }

  // The unregister/cache-clear above is async and takes a beat, which also
  // gives the backup download time to flush before the page tears down.
  window.location.reload();
}
