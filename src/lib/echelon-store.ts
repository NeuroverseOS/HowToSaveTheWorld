// NeuroVerse OS — Echelon Persistence Layer
// Implements localStorage-based conversation caching for token efficiency and offline capability

import { MissionStage } from "./state-engine";

// localStorage keys
const ECHELON_THREAD_KEY = 'nv:echelonThread';
const ECHELON_MESSAGES_KEY = 'nv:echelonMessages';

// Types
export interface EchelonThread {
  lessonId: number;
  sessionId: string;          // UUID per lesson session
  currentStage: MissionStage;
  startedAt: string;
  lastActivityAt: string;
}

export interface EchelonMessageCache {
  lessonId: number;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  lastSyncedAt: string;
}

// Thread Management
export function saveThread(thread: EchelonThread): void {
  try {
    const threads = loadAllThreads();
    threads[thread.lessonId] = thread;
    localStorage.setItem(ECHELON_THREAD_KEY, JSON.stringify(threads));
    console.log(`[ECHELON STORE] Thread saved for lesson ${thread.lessonId}`);
  } catch (error) {
    console.error('[ECHELON STORE] Failed to save thread:', error);
  }
}

export function loadThread(lessonId: number): EchelonThread | null {
  try {
    const threads = loadAllThreads();
    return threads[lessonId] || null;
  } catch (error) {
    console.error('[ECHELON STORE] Failed to load thread:', error);
    return null;
  }
}

function loadAllThreads(): Record<number, EchelonThread> {
  try {
    const stored = localStorage.getItem(ECHELON_THREAD_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Message Management
export function saveMessages(lessonId: number, messages: Array<{ role: "user" | "assistant"; content: string }>): void {
  try {
    const allCaches = loadAllMessageCaches();
    allCaches[lessonId] = {
      lessonId,
      messages,
      lastSyncedAt: new Date().toISOString(),
    };
    localStorage.setItem(ECHELON_MESSAGES_KEY, JSON.stringify(allCaches));
    console.log(`[ECHELON STORE] ${messages.length} messages cached for lesson ${lessonId}`);
  } catch (error) {
    console.error('[ECHELON STORE] Failed to save messages:', error);
  }
}

export function loadMessages(lessonId: number): Array<{ role: "user" | "assistant"; content: string }> {
  try {
    const allCaches = loadAllMessageCaches();
    const cache = allCaches[lessonId];
    return cache ? cache.messages : [];
  } catch (error) {
    console.error('[ECHELON STORE] Failed to load messages:', error);
    return [];
  }
}

function loadAllMessageCaches(): Record<number, EchelonMessageCache> {
  try {
    const stored = localStorage.getItem(ECHELON_MESSAGES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Cache Management
export function clearLessonCache(lessonId: number): void {
  try {
    // Clear thread
    const threads = loadAllThreads();
    delete threads[lessonId];
    localStorage.setItem(ECHELON_THREAD_KEY, JSON.stringify(threads));
    
    // Clear messages
    const caches = loadAllMessageCaches();
    delete caches[lessonId];
    localStorage.setItem(ECHELON_MESSAGES_KEY, JSON.stringify(caches));
    
    console.log(`[ECHELON STORE] Cache cleared for lesson ${lessonId}`);
  } catch (error) {
    console.error('[ECHELON STORE] Failed to clear cache:', error);
  }
}

export function clearAllCaches(): void {
  try {
    localStorage.removeItem(ECHELON_THREAD_KEY);
    localStorage.removeItem(ECHELON_MESSAGES_KEY);
    console.log('[ECHELON STORE] All caches cleared');
  } catch (error) {
    console.error('[ECHELON STORE] Failed to clear all caches:', error);
  }
}

// Utility: Create new thread
export function createThread(lessonId: number, currentStage: MissionStage): EchelonThread {
  return {
    lessonId,
    sessionId: crypto.randomUUID(),
    currentStage,
    startedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  };
}

// Utility: Update thread activity
export function updateThreadActivity(lessonId: number, updates: Partial<EchelonThread>): void {
  const thread = loadThread(lessonId);
  if (thread) {
    saveThread({
      ...thread,
      ...updates,
      lastActivityAt: new Date().toISOString(),
    });
  }
}

// Utility: Get cache stats
export function getCacheStats(): { totalThreads: number; totalMessages: number; cacheSize: string } {
  try {
    const threads = loadAllThreads();
    const caches = loadAllMessageCaches();
    
    const totalMessages = Object.values(caches).reduce((sum, cache) => sum + cache.messages.length, 0);
    
    // Estimate cache size
    const threadSize = localStorage.getItem(ECHELON_THREAD_KEY)?.length || 0;
    const messageSize = localStorage.getItem(ECHELON_MESSAGES_KEY)?.length || 0;
    const totalSize = threadSize + messageSize;
    const sizeKB = (totalSize / 1024).toFixed(2);
    
    return {
      totalThreads: Object.keys(threads).length,
      totalMessages,
      cacheSize: `${sizeKB} KB`,
    };
  } catch {
    return { totalThreads: 0, totalMessages: 0, cacheSize: '0 KB' };
  }
}
