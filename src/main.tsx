import { createRoot } from "react-dom/client";
import { inject } from "@vercel/analytics";
import App from "./App.tsx";
import "./index.css";
import "./styles/unlock-animations.css";
import { applyTextScale } from "./lib/text-scale";

// Apply the operator's saved text-size preference before first paint.
applyTextScale();

// Cookieless aggregate visit counts (Vercel Web Analytics) — no cookies,
// no cross-site tracking, no personal profiles; page views and referrers
// only, first-party. Deliberately NOT Google Analytics: the platform's
// no-tracking promise covers operators, and this keeps it true. Disclosed
// in the FAQ.
inject();

// Load Box Validation test utility in development
if (process.env.NODE_ENV === 'development') {
  import('./lib/box-validation-test');
}

// Nudge any long-lived service worker to check for a new build on every
// launch. Installs stranded on a months-old cache (uninstall/reinstall
// does NOT clear the service worker) recover on their next open.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => registrations.forEach((r) => r.update()))
      .catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(<App />);
