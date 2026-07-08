// NeuroVerse Audio Controller - Unlock Sound System
// Manages audio playback for unlock celebrations
// All audio is optional and controlled by user preferences

import { UnlockAnimationType } from '@/hooks/useUnlockAnimation';

// Audio cache to prevent re-loading files
const audioCache = new Map<string, HTMLAudioElement>();

// Sound map - defines which unlock types have audio
const SOUND_MAP: Partial<Record<UnlockAnimationType, { url: string; volume: number }>> = {
  trait: { url: '/audio/trait-unlock.mp3', volume: 0.2 },
  superpower: { url: '/audio/superpower-reveal.mp3', volume: 0.2 },
  mission: { url: '/audio/mission-complete.mp3', volume: 0.1 },
};

/**
 * Play unlock sound for specific animation type
 * Gracefully fails if audio unavailable (no errors thrown)
 * 
 * @param type - Type of unlock animation
 * @param enabled - Whether audio is enabled by user
 */
export const playUnlockSound = (type: UnlockAnimationType, enabled: boolean): void => {
  // Early exit if audio disabled
  if (!enabled) return;

  // Get sound config for this unlock type
  const soundConfig = SOUND_MAP[type];
  if (!soundConfig) return; // No audio for this type

  const { url, volume } = soundConfig;

  try {
    // Lazy load and cache audio element
    if (!audioCache.has(url)) {
      const audio = new Audio(url);
      audio.volume = volume;
      audio.preload = 'auto';
      audioCache.set(url, audio);
    }

    // Get cached audio and play
    const audio = audioCache.get(url)!;
    audio.currentTime = 0; // Reset to start
    
    // Play with graceful error handling
    audio.play().catch((error) => {
      console.warn('[Audio Controller] Failed to play sound:', error);
      // Silent failure - don't disrupt user experience
    });
  } catch (error) {
    console.warn('[Audio Controller] Audio system error:', error);
    // Silent failure - audio is optional
  }
};

/**
 * Preload audio files for better performance
 * Call this on app initialization or when entering mission
 */
export const preloadUnlockSounds = (): void => {
  Object.entries(SOUND_MAP).forEach(([_, config]) => {
    if (!audioCache.has(config.url)) {
      try {
        const audio = new Audio(config.url);
        audio.volume = config.volume;
        audio.preload = 'auto';
        audioCache.set(config.url, audio);
      } catch (error) {
        console.warn('[Audio Controller] Failed to preload:', config.url);
      }
    }
  });
};

/**
 * Clear audio cache (useful for cleanup on unmount)
 */
export const clearAudioCache = (): void => {
  audioCache.forEach((audio) => {
    audio.pause();
    audio.src = '';
  });
  audioCache.clear();
};
