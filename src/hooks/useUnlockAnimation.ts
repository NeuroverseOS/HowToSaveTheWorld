import { useState, useEffect, useCallback, useRef } from 'react';
import { playUnlockSound } from '@/lib/audio-controller';

export type UnlockAnimationType = 
  | 'trait' 
  | 'subskill' 
  | 'shadow' 
  | 'superpower' 
  | 'mission' 
  | 'section'
  | 'work_mode_design'
  | 'work_mode_build'
  | 'work_mode_lead';

export interface UnlockAnimation {
  type: UnlockAnimationType;
  data: {
    name: string;
    icon?: string;
    description?: string;
  };
}

/**
 * Animation duration map (in milliseconds)
 * Must match CSS animation durations
 */
const ANIMATION_DURATIONS: Record<UnlockAnimationType, number> = {
  trait: 800,
  subskill: 500,
  shadow: 900,
  superpower: 1200,
  mission: 1000,
  section: 1000,
  work_mode_design: 3000,
  work_mode_build: 3000,
  work_mode_lead: 3000,
};

/**
 * Hook to manage unlock celebration animations with queue system
 * Ensures only one animation plays at a time (no stacking)
 */
export const useUnlockAnimation = () => {
  const [queue, setQueue] = useState<UnlockAnimation[]>([]);
  const [currentAnimation, setCurrentAnimation] = useState<UnlockAnimation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // User preferences from localStorage
  const [audioEnabled, setAudioEnabledState] = useState(() => {
    const stored = localStorage.getItem('neuroverse_unlock_audio');
    return stored === 'true';
  });

  const [reducedMotion, setReducedMotionState] = useState(() => {
    const stored = localStorage.getItem('neuroverse_reduced_motion');
    if (stored !== null) return stored === 'true';
    
    // Check system preference
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  /**
   * Update audio preference and persist to localStorage
   */
  const setAudioEnabled = useCallback((enabled: boolean) => {
    setAudioEnabledState(enabled);
    localStorage.setItem('neuroverse_unlock_audio', String(enabled));
  }, []);

  /**
   * Update reduced motion preference and persist to localStorage
   */
  const setReducedMotion = useCallback((enabled: boolean) => {
    setReducedMotionState(enabled);
    localStorage.setItem('neuroverse_reduced_motion', String(enabled));
  }, []);

  /**
   * Add animation to queue
   * Queue system prevents animation stacking
   */
  const triggerUnlock = useCallback((animation: UnlockAnimation) => {
    console.log('[UnlockAnimation] Queuing:', animation.type, animation.data.name);
    setQueue(prev => [...prev, animation]);
  }, []);

  /**
   * Check if a specific animation type should play audio
   */
  const shouldPlayAudio = useCallback((type: UnlockAnimationType): boolean => {
    if (!audioEnabled) return false;
    
    // Only these types have audio
    const audioTypes: UnlockAnimationType[] = ['trait', 'superpower', 'mission'];
    return audioTypes.includes(type);
  }, [audioEnabled]);

  /**
   * Play next animation from queue
   * Enforces sequential playback
   */
  const playNextAnimation = useCallback(() => {
    if (queue.length === 0 || isPlaying) {
      return;
    }

    const next = queue[0];
    console.log('[UnlockAnimation] Playing:', next.type, next.data.name);
    
    setIsPlaying(true);
    setCurrentAnimation(next);
    
    // Play audio if enabled and this type has sound
    if (shouldPlayAudio(next.type)) {
      playUnlockSound(next.type, audioEnabled);
    }
    
    // Get animation duration (50% faster on mobile)
    const isMobile = window.innerWidth <= 768;
    let duration = ANIMATION_DURATIONS[next.type];
    if (isMobile) {
      duration = duration * 0.5;
    }
    
    // If reduced motion, use minimal duration
    if (reducedMotion) {
      duration = 300;
    }

    // Remove from queue after animation completes
    timeoutRef.current = setTimeout(() => {
      console.log('[UnlockAnimation] Completed:', next.type);
      setQueue(prev => prev.slice(1));
      setCurrentAnimation(null);
      setIsPlaying(false);
    }, duration + 100); // Add 100ms buffer
  }, [queue, isPlaying, reducedMotion, audioEnabled, shouldPlayAudio]);

  /**
   * Process queue when animations are added or completed
   */
  useEffect(() => {
    if (queue.length > 0 && !isPlaying) {
      playNextAnimation();
    }
  }, [queue, isPlaying, playNextAnimation]);

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Get CSS class name for animation type
   */
  const getAnimationClass = useCallback((type: UnlockAnimationType): string => {
    const classMap: Record<UnlockAnimationType, string> = {
      trait: 'trait-unlocked',
      subskill: 'subskill-unlocked',
      shadow: 'shadow-revealed',
      superpower: 'superpower-unlocked',
      mission: 'mission-complete-stamp',
      section: 'cosmic-sweep-overlay',
      work_mode_design: 'work-mode-unlock',
      work_mode_build: 'work-mode-unlock',
      work_mode_lead: 'work-mode-unlock',
    };
    return classMap[type];
  }, []);

  return {
    // Animation state
    currentAnimation,
    isPlaying,
    queueLength: queue.length,
    
    // Actions
    triggerUnlock,
    getAnimationClass,
    shouldPlayAudio,
    
    // Preferences
    audioEnabled,
    setAudioEnabled,
    reducedMotion,
    setReducedMotion,
  };
};
