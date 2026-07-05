export interface AudioSettings {
  voice: string;        // "onyx", "alloy", "local_default"
  speed: number;        // 0.5 - 1.5 (default: 1.0)
  pitch: number;        // 0.5 - 1.5 (default: 1.0)  
  volume: number;       // 0 - 1 (default: 1.0)
  enabled: boolean;     // on/off toggle
}

export interface VoiceDefinition {
  id: string;
  name: string;
  provider: "openai" | "browser";
  description: string;
}

export const ECHELON_VOICES: Record<string, VoiceDefinition> = {
  // OpenAI TTS-1 voices (via edge function)
  onyx: { 
    id: "onyx", 
    name: "Onyx", 
    provider: "openai", 
    description: "Deep, authoritative — Recommended for Echelon" 
  },
  alloy: { 
    id: "alloy", 
    name: "Alloy", 
    provider: "openai", 
    description: "Neutral, balanced" 
  },
  echo: { 
    id: "echo", 
    name: "Echo", 
    provider: "openai", 
    description: "Warm resonance" 
  },
  nova: { 
    id: "nova", 
    name: "Nova", 
    provider: "openai", 
    description: "Soft, expressive" 
  },
  shimmer: { 
    id: "shimmer", 
    name: "Shimmer", 
    provider: "openai", 
    description: "Clear, energetic" 
  },
  fable: { 
    id: "fable", 
    name: "Fable", 
    provider: "openai", 
    description: "Narrative, storytelling" 
  },
  
  // Browser TTS (offline fallback)
  local_default: { 
    id: "local_default", 
    name: "System Voice", 
    provider: "browser", 
    description: "Offline fallback" 
  },
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  voice: "onyx",      // Recommended for Echelon
  speed: 1.0,
  pitch: 1.0,
  volume: 1.0,
  enabled: false,     // Disabled by default (opt-in)
};
