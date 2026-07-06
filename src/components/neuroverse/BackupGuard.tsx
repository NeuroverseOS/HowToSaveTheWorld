import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type StateSchema } from "@/lib/state-engine";
import { shouldNudgeBackup, snoozeBackupNudge } from "@/lib/backup-tracker";
import { downloadVaultZip } from "@/lib/markdown-vault-export";
import { downloadFullBackup } from "@/lib/full-backup";

interface BackupGuardProps {
  state: StateSchema;
}

/**
 * Sovereignty's sharp edge, said out loud: this device holds the only copy.
 * Uninstalling the app or clearing browser data erases the operator's record,
 * and no browser lets us intercept that moment — so we warn while there is
 * still time, and make "download everything" one tap.
 */
export function BackupGuard({ state }: BackupGuardProps) {
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !shouldNudgeBackup(state)) return null;

  const exportJson = () => {
    if (downloadFullBackup()) {
      toast({
        title: "Backup Saved",
        description:
          "Everything — progress, reflections, conversations. Restorable from Settings any time.",
      });
    }
  };

  const exportVault = () => {
    const count = downloadVaultZip();
    if (count > 0) {
      toast({ title: "Vault Exported", description: `${count} Markdown files — readable anywhere, forever.` });
    }
  };

  const dismiss = () => {
    snoozeBackupNudge(state);
    setDismissed(true);
  };

  return (
    <Card className="p-4 sm:p-5 bg-amber-500/5 border-amber-500/40 animate-fade-in">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Your training record lives only on this device.
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              That's sovereignty — nobody holds your data but you. The trade: if this app is
              uninstalled or browser data is cleared, {state.progress.lessons_completed.length}{" "}
              {state.progress.lessons_completed.length === 1 ? "mission" : "missions"} of work is erased
              permanently. There is no cloud copy unless you make one. Take thirty seconds and keep
              what you've built.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={exportJson}
              className="bg-amber-500/90 hover:bg-amber-500 text-background"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Full Backup (.json)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={exportVault}
              className="border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Obsidian Vault (.md)
            </Button>
          </div>
          <a
            href="/settings#cloud-vault"
            className="inline-block text-xs text-muted-foreground underline hover:text-foreground"
          >
            Prefer automatic? Link your own database — guided setup, 2 minutes →
          </a>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Remind me after my next mission"
          title="Remind me after my next mission"
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}
