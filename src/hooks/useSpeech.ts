import { useState, useEffect, useCallback } from "react";
import { AudioSettings, DEFAULT_AUDIO_SETTINGS } from "@/data/voices";
import { speakText, stopSpeaking, isSpeaking as checkIsSpeaking } from "@/lib/speech-engine";
import { loadState, saveState } from "@/lib/state-engine";

export function useSpeech() {
  const [settings, setSettings] = useState<AudioSettings>(DEFAULT_AUDIO_SETTINGS);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Load settings from state on mount
  useEffect(() => {
    const state = loadState();
    if (state?.user.audio) {
      setSettings(state.user.audio);
    }
  }, []);

  // Monitor speaking state
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSpeaking(checkIsSpeaking());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Speak text with current settings
  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    try {
      await speakText(text, settings);
    } catch (error) {
      console.error("Speech error:", error);
    }
  }, [settings]);

  // Stop current speech
  const stop = useCallback(() => {
    stopSpeaking();
  }, []);

  // Update settings and persist to state
  const updateSettings = useCallback((partial: Partial<AudioSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...partial };
      
      // Persist to state
      const state = loadState();
      if (state) {
        state.user.audio = {
          ...newSettings,
          configured_at: new Date().toISOString(),
        };
        saveState(state);
      }
      
      return newSettings;
    });
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    settings,
    updateSettings,
  };
}
