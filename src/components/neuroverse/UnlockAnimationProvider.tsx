// NeuroVerse Unlock Animation Provider
// Wraps useUnlockAnimation hook and renders UnlockOverlay components
// Use this component to enable unlock animations in your app

import React, { createContext, useContext } from 'react';
import { useUnlockAnimation, UnlockAnimation } from '@/hooks/useUnlockAnimation';
import { UnlockOverlay } from './UnlockOverlay';

interface UnlockAnimationContextValue {
  triggerUnlock: (animation: UnlockAnimation) => void;
  audioEnabled: boolean;
  setAudioEnabled: (enabled: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
}

const UnlockAnimationContext = createContext<UnlockAnimationContextValue | null>(null);

export const UnlockAnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    currentAnimation,
    isPlaying,
    triggerUnlock,
    audioEnabled,
    setAudioEnabled,
    reducedMotion,
    setReducedMotion,
  } = useUnlockAnimation();

  return (
    <UnlockAnimationContext.Provider
      value={{
        triggerUnlock,
        audioEnabled,
        setAudioEnabled,
        reducedMotion,
        setReducedMotion,
      }}
    >
      {children}
      
      {/* Render current animation overlay */}
      {isPlaying && currentAnimation && (
        <UnlockOverlay
          type={currentAnimation.type}
          data={currentAnimation.data}
          onComplete={() => {
            // Completion is handled by useUnlockAnimation hook
          }}
        />
      )}
    </UnlockAnimationContext.Provider>
  );
};

/**
 * Hook to access unlock animation system from any component
 * Must be used within UnlockAnimationProvider
 */
export const useUnlockAnimationContext = () => {
  const context = useContext(UnlockAnimationContext);
  if (!context) {
    throw new Error('useUnlockAnimationContext must be used within UnlockAnimationProvider');
  }
  return context;
};
