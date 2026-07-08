// Single source of truth for "is this running as the installed app?"
//
// No single signal is reliable: display-mode media queries can be
// flaky right after a browser relaunch, iOS never fires them, and a
// stale service worker can serve a manifest without our start_url
// marker. So detection is layered, and any positive signal is
// persisted — one good launch anchors the device permanently.

const INSTALLED_KEY = "neuroverse_pwa_installed";
const BYPASS_KEY = "neuroverse_bypass_pwa";

export function markAppAnchored(): void {
  localStorage.setItem(INSTALLED_KEY, "true");
}

export function isAppAnchored(): boolean {
  const urlParams = new URLSearchParams(window.location.search);

  if (
    urlParams.get("bypassPWA") === "true" ||
    localStorage.getItem(BYPASS_KEY) === "true"
  ) {
    localStorage.setItem(BYPASS_KEY, "true");
    return true;
  }

  // The installed app launches at start_url "/?source=pwa"
  if (urlParams.get("source") === "pwa") {
    markAppAnchored();
    return true;
  }

  const modes = [
    "standalone",
    "minimal-ui",
    "fullscreen",
    "window-controls-overlay",
  ];
  const isStandalone = modes.some(
    (m) => window.matchMedia(`(display-mode: ${m})`).matches,
  );
  const isIOSStandalone = (window.navigator as any).standalone === true;
  if (isStandalone || isIOSStandalone) {
    markAppAnchored();
    return true;
  }

  return localStorage.getItem(INSTALLED_KEY) === "true";
}

// Which install path applies to this visitor's browser. PWAs install
// one-tap on Chromium browsers, manually on iOS Safari, and not at all
// on Firefox or desktop Safari — the UI should say so instead of
// showing everyone the same three-step list.
export type InstallPlatform = "ios" | "android" | "desktop" | "unsupported";

export function detectInstallPlatform(): InstallPlatform {
  const ua = navigator.userAgent;
  const isIOS =
    /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIOS) return "ios";
  if (/Android/.test(ua)) return "android";
  const isChromium = /Chrome\/|Chromium\/|Edg\//.test(ua) && !/OPR\/Mini/.test(ua);
  return isChromium ? "desktop" : "unsupported";
}
