import { AudioSettings } from "@/data/voices";

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

  // Voice is 100% on-device (browser speechSynthesis). No server key,
  // no network call, no spend — Echelon's voice never leaves your machine.
  try {
    await speakWithBrowser(text, settings);
  } catch (error) {
    console.error("TTS error:", error);
    isCurrentlySpeaking = false;
  }
}

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
