// ============================================================================
// REFLECTION STORAGE ENGINE
// Local-first persistence for deep reflection data
// ============================================================================

export type ReflectionMode = "standard" | "micro" | "exercise" | "deep";

export interface ReflectionEntry {
  lessonId: number;
  stage: "drill1" | "drill2" | "video" | "debrief" | "final";
  mode: ReflectionMode;
  prompt: string;
  operatorPrimary: string;
  operatorFollowup: string | null;
  echelonMirror: string;
  echelonFollowup: string | null;
  echelonClose: string;
  timestamp: number;
}

const REFLECTION_KEY = "neuroverse_reflections_v2";

/**
 * Save a reflection entry to local storage
 */
export function saveReflectionEntry(entry: ReflectionEntry): void {
  try {
    const existing = getReflectionEntries();
    existing.push(entry);
    localStorage.setItem(REFLECTION_KEY, JSON.stringify(existing));
    console.log(`[REFLECTION] Saved entry for lesson ${entry.lessonId}`);
  } catch (error) {
    console.error("[REFLECTION] Failed to save entry:", error);
  }
}

/**
 * Get all reflection entries, optionally filtered by lesson ID
 */
export function getReflectionEntries(lessonId?: number): ReflectionEntry[] {
  try {
    const stored = localStorage.getItem(REFLECTION_KEY);
    const entries = stored ? JSON.parse(stored) : [];
    
    if (lessonId !== undefined) {
      return entries.filter((e: ReflectionEntry) => e.lessonId === lessonId);
    }
    
    return entries;
  } catch (error) {
    console.error("[REFLECTION] Failed to load entries:", error);
    return [];
  }
}

/**
 * Clear all reflection entries (used for reset/debugging)
 */
export function clearReflectionEntries(): void {
  try {
    localStorage.removeItem(REFLECTION_KEY);
    console.log("[REFLECTION] Cleared all entries");
  } catch (error) {
    console.error("[REFLECTION] Failed to clear entries:", error);
  }
}

/**
 * Get reflection count for a lesson
 */
export function getReflectionCount(lessonId: number): number {
  return getReflectionEntries(lessonId).length;
}

/**
 * Get most recent reflection for a lesson
 */
export function getLatestReflection(lessonId: number): ReflectionEntry | null {
  const entries = getReflectionEntries(lessonId);
  if (entries.length === 0) return null;
  
  return entries.reduce((latest, current) => 
    current.timestamp > latest.timestamp ? current : latest
  );
}
