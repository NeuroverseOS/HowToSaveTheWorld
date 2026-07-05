import { AudioSettings, ECHELON_VOICES } from "@/data/voices";
import { supabase } from "@/integrations/supabase/client";

let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let isCurrentlySpeaking = false;

/**
 * Main TTS entry point
 * Routes to OpenAI or browser TTS based on voice selection
 */
export async function speakText(text: string, settings: AudioSettings): Promise<void> {
  if (!settings.enabled || !text.trim()) return;

  // Stop any existing speech
  stopSpeaking();
  isCurrentlySpeaking = true;

  const voice = ECHELON_VOICES[settings.voice];
  
  try {
    if (voice?.provider === "openai") {
      await speakWithOpenAI(text, settings);
    } else {
      await speakWithBrowser(text, settings);
    }
  } catch (error) {
    console.error("TTS error:", error);
    // Auto-fallback to browser TTS on failure
    console.log("Falling back to browser TTS");
    await speakWithBrowser(text, settings);
  }
}

/**
 * OpenAI TTS via edge function (secure)
 * Requires a signed-in session — the edge function returns 401 for anonymous
 * operators (it spends the server's OpenAI key). Any failure here, including
 * that 401, is caught by speakText and falls back to browser speechSynthesis.
 */
async function speakWithOpenAI(text: string, settings: AudioSettings): Promise<void> {
  const { data, error } = await supabase.functions.invoke("echelon-speak", {
    body: { text, voice: settings.voice },
  });

  if (error) {
    const status = (error as { context?: { status?: number } })?.context?.status;
    if (status === 401) {
      console.log("Echelon voice requires sign-in — using browser TTS instead");
    }
    throw new Error(`OpenAI TTS error: ${error.message}`);
  }

  if (!data?.audioContent) {
    throw new Error("No audio content returned from edge function");
  }

  // Decode base64 audio and play
  const audioBlob = base64ToBlob(data.audioContent, "audio/mpeg");
  const audioUrl = URL.createObjectURL(audioBlob);
  
  currentAudio = new Audio(audioUrl);
  currentAudio.volume = settings.volume;
  currentAudio.playbackRate = settings.speed;
  
  currentAudio.onended = () => {
    isCurrentlySpeaking = false;
    URL.revokeObjectURL(audioUrl);
  };
  
  currentAudio.onerror = () => {
    isCurrentlySpeaking = false;
    URL.revokeObjectURL(audioUrl);
  };

  await currentAudio.play();
}

/**
 * Browser TTS (offline fallback)
 */
async function speakWithBrowser(text: string, settings: AudioSettings): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error("Browser TTS not supported"));
      return;
    }

    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.rate = settings.speed;
    currentUtterance.pitch = settings.pitch;
    currentUtterance.volume = settings.volume;

    currentUtterance.onend = () => {
      isCurrentlySpeaking = false;
      resolve();
    };

    currentUtterance.onerror = (event) => {
      isCurrentlySpeaking = false;
      reject(event.error);
    };

    window.speechSynthesis.speak(currentUtterance);
  });
}

/**
 * Stop current speech (interrupt)
 */
export function stopSpeaking(): void {
  // Stop HTML5 audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  // Stop browser TTS
  if (window.speechSynthesis && currentUtterance) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }

  isCurrentlySpeaking = false;
}

/**
 * Check if currently speaking
 */
export function isSpeaking(): boolean {
  return isCurrentlySpeaking;
}

/**
 * Helper: Convert base64 to blob
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
