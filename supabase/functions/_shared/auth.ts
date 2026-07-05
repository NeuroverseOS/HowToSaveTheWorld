// Shared auth helper for edge functions.
//
// All functions run with verify_jwt = false at the gateway so that anonymous
// operators (zero-signup training, BYOK AI keys) can still reach them. This
// helper is the in-code enforcement layer: it resolves the Authorization
// bearer token to a real signed-in user, or null when the caller is anonymous
// (no token, the project anon key, or an invalid/expired token).
//
// Callers decide policy:
// - echelon-chat: null => skip personal-data reads, keep chatting (anonymous OK)
// - echelon-speak / transcribe-audio: null => 401 (these spend the server's key)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

/**
 * Resolve the request's bearer token to an authenticated user id.
 * Returns null for anonymous callers instead of throwing.
 */
export async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  // The anon key is a valid JWT but carries no user session — treat as anonymous
  // without a round trip to the auth server.
  if (anonKey && token === anonKey) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl || !anonKey) return null;

  try {
    const authClient = createClient(supabaseUrl, anonKey);
    const { data, error } = await authClient.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user.id;
  } catch (error) {
    console.error("[AUTH] Token validation failed:", error);
    return null;
  }
}
