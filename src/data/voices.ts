export interface AudioSettings {
  voice: string;        // "local_default"
  speed: number;        // 0.5 - 1.5 (default: 1.0)
  pitch: number;        // 0.5 - 1.5 (default: 1.0)
  volume: number;       // 0 - 1 (default: 1.0)
  enabled: boolean;     // on/off toggle
}

export interface VoiceDefinition {
  id: string;
  name: string;
  provider: "browser";
  description: string;
}

// Echelon's voice runs entirely on-device via the browser's built-in
// speech synthesis. There is no cloud TTS: no server key, no spend,
// no audio leaving the machine. Speed and pitch shape the delivery.
export const ECHELON_VOICES: Record<string, VoiceDefinition> = {
  local_default: {
    id: "local_default",
    name: "System Voice",
    provider: "browser",
    description: "Your device's voice — private, offline, free"
  },
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  voice: "local_default",
  speed: 1.0,
  pitch: 1.0,
  volume: 1.0,
  enabled: false,     // Disabled by default (opt-in)
};
