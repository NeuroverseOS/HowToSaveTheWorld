// ============================================================================
// INSTALL PROMPT
// The anchored flag (pwa-detection) remembers that a device was blessed once —
// but it can't tell whether THIS moment is running inside the installed app
// or in an ordinary browser tab. This module answers the live question and
// holds Chromium's captured beforeinstallprompt so any surface can offer a
// real one-tap Install instead of hoping people spot the address-bar icon.
// ============================================================================

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let captureInitialized = false;

/** Call once, early (App mount). Safe to call repeatedly. */
export function initInstallPromptCapture(): void {
  if (captureInitialized) return;
  captureInitialized = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log("[INSTALL] Install prompt captured — one-tap install available");
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    console.log("[INSTALL] App installed");
  });
}

/** Is this moment actually running inside the installed app? */
export function isRunningStandalone(): boolean {
  const modes = ["standalone", "minimal-ui", "fullscreen", "window-controls-overlay"];
  if (modes.some((m) => window.matchMedia(`(display-mode: ${m})`).matches)) return true;
  if ((window.navigator as { standalone?: boolean }).standalone === true) return true;
  // The installed app launches at start_url "/?source=pwa"
  return new URLSearchParams(window.location.search).get("source") === "pwa";
}

export function canOneTapInstall(): boolean {
  return deferredPrompt !== null;
}

/** Trigger the browser's real install dialog (Chromium only). */
export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferredPrompt) return "unavailable";
  const evt = deferredPrompt;
  deferredPrompt = null;
  await evt.prompt();
  const choice = await evt.userChoice;
  return choice.outcome;
}
