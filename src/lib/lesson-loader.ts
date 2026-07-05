import { supabase } from "@/integrations/supabase/client";
import type { Lesson } from "./lesson-queries";

const CACHE_KEY = 'neuroverse_lessons_cache';
const CACHE_VERSION_KEY = 'neuroverse_lessons_version';
const CACHE_TIMESTAMP_KEY = 'neuroverse_lessons_timestamp';

interface LessonCache {
  lessons: Lesson[];
  version: number;
  timestamp: number;
}

// A. Try loading from local JSON file (fastest, might be stale)
async function loadLocalJSON(): Promise<{ lessons: Lesson[], version: number } | null> {
  try {
    const response = await fetch('/lessons.json');
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Handle both array format and object format with metadata
    if (Array.isArray(data)) {
      return { lessons: data, version: 0 }; // Legacy format, no version
    }
    
    return { 
      lessons: data.lessons || [], 
      version: data.version || 0 
    };
  } catch (error) {
    console.log('[LESSON LOADER] Local JSON not found or invalid:', error);
    return null;
  }
}

// B. Try loading from localStorage cache
function loadFromCache(): LessonCache | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const version = localStorage.getItem(CACHE_VERSION_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (!cached || !version) return null;
    
    const lessons = JSON.parse(cached);
    return {
      lessons,
      version: parseInt(version),
      timestamp: timestamp ? parseInt(timestamp) : 0
    };
  } catch (error) {
    console.log('[LESSON LOADER] Cache read failed:', error);
    return null;
  }
}

// C. Fetch from Supabase (source of truth)
async function fetchFromSupabase(): Promise<{ lessons: Lesson[], version: number }> {
  console.log('[LESSON LOADER] Fetching from Supabase...');
  
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .order('lesson_number');
  
  if (lessonsError) {
    console.error('[LESSON LOADER] Supabase fetch failed:', lessonsError);
    throw new Error('Failed to fetch lessons from Supabase');
  }
  
  const { data: metadata, error: metadataError } = await supabase
    .from('lesson_metadata')
    .select('lesson_version')
    .single();
  
  const version = metadata?.lesson_version || 1;
  
  console.log(`[LESSON LOADER] Fetched ${lessons?.length || 0} lessons from Supabase (version ${version})`);
  
  return { 
    lessons: lessons || [], 
    version 
  };
}

// D. Save to localStorage cache
function cacheToLocalStorage(lessons: Lesson[], version: number): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(lessons));
    localStorage.setItem(CACHE_VERSION_KEY, version.toString());
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log(`[LESSON LOADER] Cached ${lessons.length} lessons (version ${version})`);
  } catch (error) {
    console.warn('[LESSON LOADER] Failed to cache to localStorage:', error);
  }
}

// E. Get latest version from Supabase with timeout
async function getLatestVersion(): Promise<number> {
  try {
    // Add 5 second timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    
    const versionPromise = supabase
      .from('lesson_metadata')
      .select('lesson_version')
      .single();
    
    const { data, error } = await Promise.race([versionPromise, timeoutPromise]);
    
    if (error) {
      console.warn('[LESSON LOADER] Could not fetch version:', error);
      return 0; // Return 0 to indicate version check failed
    }
    
    return data?.lesson_version || 0;
  } catch (error) {
    console.warn('[LESSON LOADER] Version check timed out or failed:', error);
    return 0; // Return 0 to use local JSON without version check
  }
}

// MAIN LOAD FUNCTION: Implements the fallback chain (LOCAL-FIRST)
async function loadLessons(forceSupabase = false): Promise<Lesson[]> {
  // If force flag is set (e.g., dev bypass), skip local/cache
  if (forceSupabase) {
    console.log('[LESSON LOADER] Force flag set, fetching from Supabase');
    const supabaseData = await fetchFromSupabase();
    cacheToLocalStorage(supabaseData.lessons, supabaseData.version);
    return supabaseData.lessons;
  }
  
  // 1. Try local JSON FIRST (fastest, most reliable for PWA) - NO VERSION CHECK
  const local = await loadLocalJSON();
  if (local && local.lessons.length > 0) {
    console.log(`[LESSON LOADER] ✅ Local JSON found: ${local.lessons.length} lessons (v${local.version})`);
    // Cache it for faster subsequent loads
    cacheToLocalStorage(local.lessons, local.version);
    
    // Check version in background (non-blocking) for info only
    getLatestVersion().then(latestVersion => {
      if (latestVersion > 0 && latestVersion !== local.version) {
        console.log(`[LESSON LOADER] ℹ️ Newer version available in Supabase (v${latestVersion}), but using local JSON`);
      }
    }).catch(() => {});
    
    return local.lessons;
  }
  
  console.log('[LESSON LOADER] Local JSON not available, checking cache...');
  
  // 2. Try localStorage cache
  const cached = loadFromCache();
  if (cached && cached.lessons.length > 0) {
    console.log(`[LESSON LOADER] ✅ Cache found: ${cached.lessons.length} lessons`);
    return cached.lessons;
  }
  
  // 3. Last resort: Fetch from Supabase (only if local sources failed)
  try {
    console.log('[LESSON LOADER] No local data found, fetching from Supabase...');
    const supabaseData = await fetchFromSupabase();
    cacheToLocalStorage(supabaseData.lessons, supabaseData.version);
    return supabaseData.lessons;
  } catch (error) {
    console.error('[LESSON LOADER] ❌ All lesson sources failed:', error);
    throw new Error('Could not load lessons from any source');
  }
}

// Export functions maintaining existing API
let cachedLessons: Lesson[] | null = null;

export async function loadLocalLessons(forceRefresh = false): Promise<Lesson[]> {
  if (!forceRefresh && cachedLessons) {
    return cachedLessons;
  }
  
  cachedLessons = await loadLessons();
  return cachedLessons;
}

export async function getAllLessons(): Promise<Lesson[]> {
  return loadLocalLessons();
}

export async function getLessonByNumber(lessonNumber: number): Promise<Lesson | null> {
  const lessons = await loadLocalLessons();
  console.log('[LESSON LOADER] Total lessons loaded:', lessons.length);
  console.log('[LESSON LOADER] Looking for lesson_number:', lessonNumber);
  const found = lessons.find(l => l.lesson_number === lessonNumber) || null;
  console.log('[LESSON LOADER] Found lesson:', found ? `id=${found.id}, number=${found.lesson_number}` : 'null');
  return found;
}

export async function getLessonById(lessonId: number): Promise<Lesson | null> {
  const lessons = await loadLocalLessons();
  return lessons.find(l => l.id === lessonId) || null;
}

// Utility functions for cache management
export function clearLessonCache(): void {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_VERSION_KEY);
  localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  cachedLessons = null;
  console.log('[LESSON LOADER] Cache cleared');
}

export async function forceSupabaseRefresh(): Promise<Lesson[]> {
  clearLessonCache();
  cachedLessons = await loadLessons(true);
  return cachedLessons;
}
