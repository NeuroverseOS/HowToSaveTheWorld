import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// ─── Data Sovereignty: runtime backend override ─────────────────────────────
// Mirrors the bring-your-own-AI-key pattern (/activate-echelon): a user or
// community can point this app at THEIR OWN Supabase project at runtime by
// storing its URL + publishable (anon) key in localStorage. When both values
// are present and valid, every database query and edge-function call targets
// that sovereign backend. Otherwise the app uses the hub backend baked in at
// build time via env vars — byte-identical to the original behavior.
//
// Managed from Settings → Data Sovereignty. A page reload applies changes,
// since the client is constructed once at module load.

export const SOVEREIGN_URL_STORAGE_KEY = 'neuroverse_supabase_url';
export const SOVEREIGN_ANON_KEY_STORAGE_KEY = 'neuroverse_supabase_anon_key';

const HUB_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const HUB_SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface SovereignBackend {
  url: string;
  anonKey: string;
}

/**
 * Normalize + validate a candidate Supabase URL.
 * Returns the cleaned URL (no trailing slash) or null if unusable.
 */
export function normalizeSupabaseUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    if (!parsed.host) return null;
    return trimmed;
  } catch {
    return null;
  }
}

function readSovereignOverride(): SovereignBackend | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const url = normalizeSupabaseUrl(localStorage.getItem(SOVEREIGN_URL_STORAGE_KEY));
    const anonKey = localStorage.getItem(SOVEREIGN_ANON_KEY_STORAGE_KEY)?.trim();
    if (!url || !anonKey) return null;
    return { url, anonKey };
  } catch {
    // Storage unavailable (private mode, SSR, etc.) — fall back to hub.
    return null;
  }
}

const sovereignBackend = readSovereignOverride();

/** The Supabase URL currently in effect (sovereign override or hub). */
export const ACTIVE_SUPABASE_URL: string = sovereignBackend?.url ?? HUB_SUPABASE_URL;

/** The publishable/anon key currently in effect (sovereign override or hub). */
export const ACTIVE_SUPABASE_PUBLISHABLE_KEY: string =
  sovereignBackend?.anonKey ?? HUB_SUPABASE_PUBLISHABLE_KEY;

/** True when a sovereign (user-owned) backend override is active. */
export function isSovereignBackendActive(): boolean {
  return sovereignBackend !== null;
}

/** Host of the active backend, for display in Settings (e.g. "xxxx.supabase.co"). */
export function getActiveBackendHost(): string {
  try {
    return new URL(ACTIVE_SUPABASE_URL).host;
  } catch {
    return ACTIVE_SUPABASE_URL;
  }
}

/**
 * Build an edge-function URL against the ACTIVE backend, so a sovereign
 * backend's functions are called instead of the hub's.
 */
export function getEdgeFunctionUrl(functionName: string): string {
  return `${ACTIVE_SUPABASE_URL}/functions/v1/${functionName}`;
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(ACTIVE_SUPABASE_URL, ACTIVE_SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});
