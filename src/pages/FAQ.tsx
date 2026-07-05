import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Download, Shield, KeyRound, Hammer, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { detectInstallPlatform } from "@/lib/pwa-detection";

const REPO_URL = "https://github.com/NeuroverseOS/HowToSaveTheWorld";

const INSTALL_STEPS: Record<string, { label: string; steps: string[] }> = {
  ios: {
    label: "iPhone / iPad (Safari)",
    steps: [
      "Open howtosavetheworld.info in Safari (not Chrome — Apple only allows installs from Safari).",
      "Tap the Share button (the square with an arrow).",
      'Scroll down and tap "Add to Home Screen", then "Add".',
      "The How to Save the World icon appears on your home screen. Open the app from there — not the website.",
    ],
  },
  android: {
    label: "Android (Chrome)",
    steps: [
      "Open howtosavetheworld.info in Chrome.",
      'Tap the ⋮ menu in the top-right corner.',
      'Tap "Install app" (or "Add to Home screen").',
      "The How to Save the World icon appears with your apps. Open the app from there — not the website.",
    ],
  },
  desktop: {
    label: "Computer (Chrome or Edge)",
    steps: [
      "Open howtosavetheworld.info in Chrome or Edge.",
      "Look for the install icon at the right end of the address bar (a monitor with a down arrow), or use menu ⋮ → \"Cast, save and share\" → \"Install\".",
      "Click Install. The app opens in its own window.",
      "From then on, launch it like any app — from your dock, taskbar, or Start menu.",
    ],
  },
  unsupported: {
    label: "Firefox / desktop Safari",
    steps: [
      "Your current browser can't install web apps — that's a browser limitation, not yours.",
      "Open howtosavetheworld.info in Chrome or Edge (computer / Android) or Safari (iPhone / iPad) and install from there.",
    ],
  },
};

export default function FAQ() {
  const navigate = useNavigate();
  const platform = detectInstallPlatform();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Show the visitor's own platform first, then the rest.
  const order = [platform, ...(["ios", "android", "desktop", "unsupported"] as const).filter((p) => p !== platform)];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-lg font-semibold mx-auto">Questions & Answers</h1>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
        {/* ── The app ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Download className="h-5 w-5 text-neuro-cyan" />
            <h2 className="text-2xl font-semibold">The App</h2>
          </div>

          <Card className="p-6 mb-4 bg-neuro-cyan/5 border-neuro-cyan/30">
            <p className="font-semibold text-foreground mb-2">
              The website is the launchpad. The course runs as an app.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              howtosavetheworld.info is where you learn about the mission and install the app —
              but the training itself happens inside the installed app on your phone or computer.
              Nothing "downloads" from an app store: your browser installs it directly, in one tap,
              and it works offline afterward. If you're reading lessons in a browser tab, you're in
              the wrong place — install below, then open the app icon.
            </p>
          </Card>

          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="why-website" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-left">
                Why did it open on the website instead of the app?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed space-y-2">
                <p>
                  Because you tapped a link, and links open in browsers. The app and the website
                  share the same address, so the difference is <em>where you launch from</em>: tapping
                  the app icon on your home screen opens the app; tapping a link in a message
                  or search result opens the website. Both are safe — but your training, your
                  reflections, and Echelon live in the app.
                </p>
                <p>
                  Rule of thumb: <strong>always launch from the icon.</strong>
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="how-install" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-left">
                How do I install it on my device?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed space-y-4">
                {order.map((p, i) => (
                  <div key={p}>
                    <p className="font-semibold text-foreground">
                      {INSTALL_STEPS[p].label}
                      {i === 0 && p !== "unsupported" && (
                        <span className="ml-2 text-xs text-neuro-cyan">← looks like your device</span>
                      )}
                      {i === 0 && p === "unsupported" && (
                        <span className="ml-2 text-xs text-neuro-cyan">← your current browser</span>
                      )}
                    </p>
                    <ol className="list-decimal ml-5 mt-1 space-y-1 text-sm">
                      {INSTALL_STEPS[p].steps.map((s, j) => (
                        <li key={j}>{s}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cant-find" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-left">
                I installed it but can't find the app.
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed space-y-2">
                <p>Look for the glowing tree icon (named "How to Save the World" — older installs may say "NeuroVerse OS"):</p>
                <ul className="list-disc ml-5 space-y-1 text-sm">
                  <li><strong>iPhone/iPad:</strong> on your home screen (swipe through pages, or search "Save the World").</li>
                  <li><strong>Android:</strong> in your app drawer and home screen.</li>
                  <li><strong>Windows:</strong> Start menu → search "Save the World". Pin it to the taskbar.</li>
                  <li><strong>Mac:</strong> Launchpad, or Spotlight (⌘-space) → "Save the World". Chrome also lists it at chrome://apps.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="install-required" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-left">
                It says INSTALL REQUIRED but I already installed it.
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed space-y-2">
                <p>
                  Two possibilities. Either you're in a browser tab rather than the installed app —
                  close the tab and launch from the icon — or the app's install detection missed a
                  signal. If you're sure you're inside the app, use the link on the install screen:
                  <em> "Already installed the app and still seeing this? Tap here to enter."</em> That
                  anchors your device permanently.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="updates" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-left">
                Do I need to update it? Does it cost anything to run?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed space-y-2">
                <p>
                  It updates itself — every launch quietly checks for a new build. There's no app
                  store, no update button, and using the app is free. The only cost anywhere in the
                  system is what your own AI provider charges for your conversations (typically
                  pennies per lesson, or nothing if you run a local model).
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* ── The AI ────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="h-5 w-5 text-neuro-cyan" />
            <h2 className="text-2xl font-semibold">Your AI, Your Instructor</h2>
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="which-ai" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-left">
                What AI do I need? Do I have to pay for one?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed space-y-2">
                <p>
                  You bring your own: OpenAI (ChatGPT), Anthropic (Claude), Google (Gemini), or
                  Ollama (a model running privately on your own computer — completely free). You
                  connect an API key once during activation; Google offers free-tier keys, and paid
                  keys typically cost pennies per lesson. Your key is stored only on your device and
                  is sent directly to your provider — we never see or store it.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="echelon" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-left">
                Who is Echelon? Is it a custom AI model?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed space-y-2">
                <p>
                  There is no Echelon model. Echelon is a character compiled at runtime by an
                  open-source kernel — the 7-Box system — running on whichever AI you connected. On
                  every message, the kernel decides exactly what your AI is allowed to see: the
                  current mission stage, your callsign and archetype, one lesson beat at a time. It
                  can't spoil the course because it never receives more than the present moment.
                </p>
                <p>
                  The full mechanism is documented in the open-source repo:{" "}
                  <a
                    href={`${REPO_URL}/blob/main/docs/HOW_ECHELON_WORKS.md`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neuro-cyan hover:underline"
                  >
                    How Echelon Works
                  </a>
                  .
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="retake" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-left">
                Can I retake the archetype assessment?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Yes — Settings → reset options let you retake the assessment. Your archetype triad
                (Primary, Shadow, Rising) shapes how Echelon coaches you, so retake it if your first
                run didn't feel true.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* ── Your data ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-neuro-cyan" />
            <h2 className="text-2xl font-semibold">Your Data</h2>
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="account" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-left">
                Do I need an account? Where does my data live?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed space-y-2">
                <p>
                  No account required. Your progress, reflections, archetype, and API key live on
                  your device — you can inspect, export, or destroy all of it any time in the
                  Sovereignty Inspector (Settings). If you want sync across devices, you can
                  optionally create an account, or go fully sovereign and point the app at your own
                  free database (Settings → Data Sovereignty).
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="open-source" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-left">
                Is it really open source? Can I check?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed space-y-2">
                <p>
                  Yes — the application code is MIT-licensed and the curriculum is CC BY-NC-SA. Read
                  every line before you install:{" "}
                  <a
                    href={REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neuro-cyan hover:underline inline-flex items-center gap-1"
                  >
                    <Github className="h-3.5 w-3.5" />
                    the repository
                  </a>
                  . Governance, maintainers, and fork policy are documented there too.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* ── Build your own ────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Hammer className="h-5 w-5 text-neuro-cyan" />
            <h2 className="text-2xl font-semibold">Build Your Own</h2>
          </div>

          <Card className="p-6 bg-card/50">
            <p className="text-muted-foreground leading-relaxed mb-4">
              Everything here — the AI instructor, missions, ranks, assessments — is an open-source
              engine. If you have a curriculum, a workshop, or a book, AI can teach it on this exact
              system.
            </p>
            <Button onClick={() => navigate("/build")} variant="outline">
              Have a course you want AI to teach? →
            </Button>
          </Card>
        </section>

        <div className="text-center pt-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary hover:underline">
            ← Back to howtosavetheworld.info
          </Link>
        </div>
      </div>
    </div>
  );
}
