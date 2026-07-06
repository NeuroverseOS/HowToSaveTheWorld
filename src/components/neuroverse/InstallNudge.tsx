import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MonitorDown, Share, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  isRunningStandalone,
  canOneTapInstall,
  promptInstall,
} from "@/lib/install-prompt";
import { detectInstallPlatform } from "@/lib/pwa-detection";

const SNOOZE_KEY = "neuroverse_install_nudge_snoozed_at";
const SNOOZE_DAYS = 3;

function isSnoozed(): boolean {
  const at = parseInt(localStorage.getItem(SNOOZE_KEY) ?? "", 10);
  return !Number.isNaN(at) && Date.now() - at < SNOOZE_DAYS * 86_400_000;
}

/**
 * Shown whenever the operator is working in an ordinary browser tab instead
 * of the installed app. Keeps encouraging the real thing — its own window,
 * offline, launchable from the home screen — and offers a genuine one-tap
 * Install on browsers that allow it. Recurring by design: dismiss snoozes
 * for a few days, never forever.
 */
export function InstallNudge() {
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [, forceRender] = useState(0);

  if (dismissed || isSnoozed() || isRunningStandalone()) return null;

  const platform = detectInstallPlatform();

  const oneTap = async () => {
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      toast({
        title: "Anchoring...",
        description: "Open How to Save the World from your home screen or app list — the Foxhole is better as its own window.",
      });
      setDismissed(true);
    } else if (outcome === "unavailable") {
      forceRender((n) => n + 1);
    }
  };

  const dismiss = () => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now()));
    setDismissed(true);
  };

  return (
    <Card className="p-4 sm:p-5 bg-neuro-cyan/5 border-neuro-cyan/40 animate-fade-in">
      <div className="flex items-start gap-3">
        <MonitorDown className="h-5 w-5 text-neuro-cyan shrink-0 mt-0.5" />
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              You're in a browser tab. The Foxhole is better installed.
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Install the app to really work locally: its own window, works offline,
              launches from your home screen — no address bar, no tabs, just the mission.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canOneTapInstall() ? (
              <Button size="sm" onClick={oneTap} className="bg-neuro-cyan hover:bg-neuro-cyan/90 text-background">
                <MonitorDown className="h-3.5 w-3.5 mr-1.5" />
                Install the App
              </Button>
            ) : platform === "ios" ? (
              <p className="text-xs text-neuro-cyan flex items-center gap-1.5">
                <Share className="h-3.5 w-3.5" />
                Tap <span className="font-semibold">Share</span> →{" "}
                <span className="font-semibold">Add to Home Screen</span>
              </p>
            ) : platform === "unsupported" ? (
              <p className="text-xs text-muted-foreground">
                This browser can't install apps — open this site in Chrome or Edge to install.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Look for the <span className="text-neuro-cyan">install icon</span> in the address
                bar (or browser menu → "Install app").
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Remind me in a few days"
          title="Remind me in a few days"
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}
