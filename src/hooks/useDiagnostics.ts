// NeuroVerse OS — Systems Diagnostics Hook
// Centralized diagnostic checks and repair functions for Systems Panel

import { useState } from "react";
import { loadState, validateState, saveState } from "@/lib/state-engine";
import { getAllLessons, clearLessonCache } from "@/lib/lesson-loader";
import { getCacheStats, clearAllCaches } from "@/lib/echelon-store";
import { validateLessons, type LessonValidationResult } from "@/lib/lesson-validator";
import type { Lesson } from "@/lib/lesson-queries";

// Status Check Results
export interface PWAStatus {
  installed: boolean;
  standalone: boolean;
  installable: boolean;
}

export interface NetworkStatus {
  online: boolean;
  type: string;
}

export interface StorageStatus {
  available: number;  // MB
  used: number;       // MB
  quota: number;      // MB
  percentage: number;
}

export interface LessonCacheStatus {
  loaded: boolean;
  count: number;
  version: number;
}

export interface EchelonCacheStatus {
  threads: number;
  messages: number;
  size: string;
}

export interface StateIntegrityStatus {
  valid: boolean;
  userId: string;
  vanguardCallsign: string | null;
  archetypePrimary: string | null;
  currentLesson: number;
}

export interface DiagnosticResult {
  id: string;
  label: string;
  status: 'pass' | 'warning' | 'error';
  message: string;
  details?: any;
}

export function useDiagnostics() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  // ========== STATUS CHECKS (Read-Only) ==========

  const checkPWAStatus = (): PWAStatus => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInstalled = isStandalone || (window.navigator as any).standalone === true;
    
    // Check if installable (has beforeinstallprompt event possibility)
    const isInstallable = 'serviceWorker' in navigator;
    
    return {
      installed: isInstalled,
      standalone: isStandalone,
      installable: isInstallable,
    };
  };

  const checkNetworkStatus = (): NetworkStatus => {
    return {
      online: navigator.onLine,
      type: (navigator as any).connection?.effectiveType || 'unknown',
    };
  };

  const checkStorageStatus = async (): Promise<StorageStatus> => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const quota = estimate.quota || 0;
        const usage = estimate.usage || 0;
        
        return {
          available: Math.round((quota - usage) / (1024 * 1024)),
          used: Math.round(usage / (1024 * 1024)),
          quota: Math.round(quota / (1024 * 1024)),
          percentage: quota > 0 ? Math.round((usage / quota) * 100) : 0,
        };
      } catch (error) {
        console.warn('[DIAGNOSTICS] Storage estimate failed:', error);
      }
    }
    
    return { available: 0, used: 0, quota: 0, percentage: 0 };
  };

  const validateLessonCache = async (): Promise<LessonCacheStatus> => {
    try {
      const lessons = await getAllLessons();
      const versionStr = localStorage.getItem('neuroverse_lessons_version');
      const version = versionStr ? parseInt(versionStr) : 0;
      
      return {
        loaded: lessons.length > 0,
        count: lessons.length,
        version,
      };
    } catch (error) {
      console.error('[DIAGNOSTICS] Lesson cache check failed:', error);
      return { loaded: false, count: 0, version: 0 };
    }
  };

  const validateLessonIntegrity = async (): Promise<LessonValidationResult> => {
    try {
      const lessons = await getAllLessons();
      return validateLessons(lessons);
    } catch (error) {
      console.error('[DIAGNOSTICS] Lesson integrity check failed:', error);
      return {
        isValid: false,
        totalLessons: 0,
        missingNumbers: [],
        duplicateNumbers: [],
        schemaErrors: [],
      };
    }
  };

  const checkEchelonCache = (): EchelonCacheStatus => {
    try {
      const stats = getCacheStats();
      return {
        threads: stats.totalThreads,
        messages: stats.totalMessages,
        size: stats.cacheSize,
      };
    } catch (error) {
      console.error('[DIAGNOSTICS] Echelon cache check failed:', error);
      return { threads: 0, messages: 0, size: '0 KB' };
    }
  };

  const checkStateIntegrity = (): StateIntegrityStatus => {
    try {
      const state = loadState();
      if (!state) {
        return {
          valid: false,
          userId: '',
          vanguardCallsign: null,
          archetypePrimary: null,
          currentLesson: 0,
        };
      }
      
      const isValid = validateState(state);
      
      return {
        valid: isValid,
        userId: state.user.id,
        vanguardCallsign: state.user.vanguard.callsign,
        archetypePrimary: state.user.archetype.primary,
        currentLesson: state.progress.current_lesson_id,
      };
    } catch (error) {
      console.error('[DIAGNOSTICS] State integrity check failed:', error);
      return {
        valid: false,
        userId: '',
        vanguardCallsign: null,
        archetypePrimary: null,
        currentLesson: 0,
      };
    }
  };

  // ========== REPAIR ACTIONS (Require Confirmation) ==========

  const refreshLessonsJson = async (): Promise<void> => {
    try {
      clearLessonCache();
      
      // Force reload from /lessons.json
      const response = await fetch('/lessons.json', { cache: 'reload' });
      if (!response.ok) throw new Error('Failed to fetch lessons.json');
      
      const data = await response.json();
      const lessons = Array.isArray(data) ? data : data.lessons || [];
      
      // Cache to localStorage
      localStorage.setItem('neuroverse_lessons_cache', JSON.stringify(lessons));
      localStorage.setItem('neuroverse_lessons_version', (data.version || 1).toString());
      localStorage.setItem('neuroverse_lessons_timestamp', Date.now().toString());
      
      console.log('[DIAGNOSTICS] Lesson cache rebuilt:', lessons.length);
    } catch (error) {
      console.error('[DIAGNOSTICS] Refresh lessons failed:', error);
      throw error;
    }
  };

  const clearEchelonCache = (): void => {
    clearAllCaches();
    console.log('[DIAGNOSTICS] Echelon cache cleared');
  };

  const rebuildFieldGuide = (): void => {
    const state = loadState();
    if (!state) {
      throw new Error('No state found');
    }
    
    // Reset Field Guide sections
    state.field_guide.sections = [];
    saveState(state);
    
    console.log('[DIAGNOSTICS] Field Guide index reset');
  };

  const resetLocalProgress = (): void => {
    const state = loadState();
    if (!state) {
      throw new Error('No state found');
    }
    
    // Clear progress but keep identity
    state.progress.lessons_completed = [];
    state.progress.current_lesson_id = 1;
    state.progress.mission_progress = {};
    state.reflections = [];
    state.achievements = [];
    
    saveState(state);
    console.log('[DIAGNOSTICS] Local progress reset');
  };

  const validateAndFixState = (): void => {
    const state = loadState();
    if (!state) {
      throw new Error('No state found');
    }
    
    // Ensure all required fields exist
    if (!state.user.vanguard) {
      state.user.vanguard = {
        designation: "Vanguard",
        callsign: null,
        full_identity: null,
        assigned_at: null,
        activation_complete: false,
        is_graduated: false,
        graduation_timestamp: null,
        post_foxhole_objective: null,
      };
    }
    
    if (!state.user.archetype) {
      state.user.archetype = {
        primary: null,
        shadow: null,
        rising: null,
        assessment_complete: false,
      };
    }
    
    saveState(state);
    console.log('[DIAGNOSTICS] State validation complete');
  };

  // ========== FULL DIAGNOSTIC RUNNER ==========

  const runFullDiagnostic = async (): Promise<DiagnosticResult[]> => {
    setIsRunning(true);
    const diagnosticResults: DiagnosticResult[] = [];
    
    try {
      // Check PWA Status
      const pwaStatus = checkPWAStatus();
      diagnosticResults.push({
        id: 'pwa-status',
        label: 'PWA Installation',
        status: pwaStatus.installed ? 'pass' : 'warning',
        message: pwaStatus.installed 
          ? `Installed (${pwaStatus.standalone ? 'standalone' : 'browser'})`
          : 'Not installed as PWA',
        details: pwaStatus,
      });
      
      // Check Network
      const networkStatus = checkNetworkStatus();
      diagnosticResults.push({
        id: 'network-status',
        label: 'Network Connection',
        status: networkStatus.online ? 'pass' : 'warning',
        message: networkStatus.online ? `Online (${networkStatus.type})` : 'Offline',
        details: networkStatus,
      });
      
      // Check Storage
      const storageStatus = await checkStorageStatus();
      diagnosticResults.push({
        id: 'storage-status',
        label: 'Storage Capacity',
        status: storageStatus.percentage > 90 ? 'warning' : 'pass',
        message: `${storageStatus.used} MB used / ${storageStatus.quota} MB total (${storageStatus.percentage}%)`,
        details: storageStatus,
      });
      
      // Check Lesson Cache
      const lessonCache = await validateLessonCache();
      diagnosticResults.push({
        id: 'lesson-cache',
        label: 'Lesson Cache',
        status: lessonCache.count === 96 ? 'pass' : 'error',
        message: `${lessonCache.count} / 96 lessons loaded (v${lessonCache.version})`,
        details: lessonCache,
      });
      
      // Check Lesson Integrity
      const lessonIntegrity = await validateLessonIntegrity();
      diagnosticResults.push({
        id: 'lesson-integrity',
        label: 'Lesson Integrity',
        status: lessonIntegrity.isValid ? 'pass' : 'error',
        message: lessonIntegrity.isValid 
          ? 'All 96 lessons valid'
          : `Issues: ${lessonIntegrity.missingNumbers.length} missing, ${lessonIntegrity.duplicateNumbers.length} duplicates`,
        details: lessonIntegrity,
      });
      
      // Check Echelon Cache
      const echelonCache = checkEchelonCache();
      diagnosticResults.push({
        id: 'echelon-cache',
        label: 'Echelon Memory',
        status: 'pass',
        message: `${echelonCache.threads} threads, ${echelonCache.messages} messages (${echelonCache.size})`,
        details: echelonCache,
      });
      
      // Check State Integrity
      const stateIntegrity = checkStateIntegrity();
      diagnosticResults.push({
        id: 'state-integrity',
        label: 'State Integrity',
        status: stateIntegrity.valid ? 'pass' : 'error',
        message: stateIntegrity.valid 
          ? `Valid (Lesson ${stateIntegrity.currentLesson})`
          : 'State validation failed',
        details: stateIntegrity,
      });
      
    } catch (error) {
      console.error('[DIAGNOSTICS] Full diagnostic failed:', error);
    } finally {
      setIsRunning(false);
    }
    
    setResults(diagnosticResults);
    return diagnosticResults;
  };

  return {
    // Status Checks
    checkPWAStatus,
    checkNetworkStatus,
    checkStorageStatus,
    validateLessonCache,
    validateLessonIntegrity,
    checkEchelonCache,
    checkStateIntegrity,
    
    // Repair Actions
    refreshLessonsJson,
    clearEchelonCache,
    rebuildFieldGuide,
    resetLocalProgress,
    validateAndFixState,
    
    // Full Diagnostic
    runFullDiagnostic,
    isRunning,
    results,
  };
}
