import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Copy, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { normalizeSupabaseUrl } from "@/integrations/supabase/client";

export const VAULT_SQL = `-- NeuroVerse personal cloud vault (run once in SQL Editor)
create table if not exists public.user_state (
  id text primary key,
  state_json jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.user_state enable row level security;
-- This project is YOUR personal vault: only someone holding your
-- project URL and API key can reach it. Keep both private.
create policy "vault select" on public.user_state for select using (true);
create policy "vault insert" on public.user_state for insert with check (true);
create policy "vault update" on public.user_state for update using (true);`;

interface VaultSetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with verified credentials. Parent saves, first-syncs, enables auto-sync. */
  onLinked: (url: string, anonKey: string) => Promise<void>;
}

/**
 * Guided personal-vault setup: three small steps instead of a docs page.
 * Verifies the connection with precise diagnostics before anything is saved.
 */
export function VaultSetupWizard({ open, onOpenChange, onLinked }: VaultSetupWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(VAULT_SQL);
      toast({ title: "SQL Copied", description: "Paste it into your project's SQL Editor and press Run." });
    } catch {
      toast({ title: "Copy failed", description: "Select the SQL text and copy it manually.", variant: "destructive" });
    }
  };

  const testAndLink = async () => {
    setProblem(null);
    const cleanUrl = normalizeSupabaseUrl(url);
    const cleanKey = anonKey.trim();
    if (!cleanUrl || !cleanKey) {
      setProblem("Enter both the project URL and the API key.");
      return;
    }

    setTesting(true);
    try {
      const probe = createClient(cleanUrl, cleanKey);
      const { error } = await probe.from("user_state").select("id").limit(1);

      if (error) {
        const msg = error.message || "";
        if (/does not exist|42P01/i.test(msg)) {
          setProblem("Connected — but the vault table is missing. Go back to Step 2, run the SQL, then try again.");
        } else if (/invalid api key|jwt|401/i.test(msg)) {
          setProblem("The API key was rejected. Copy the 'anon / public' key from Project Settings → API Keys.");
        } else {
          setProblem(`Connection test failed: ${msg}`);
        }
        return;
      }

      await onLinked(cleanUrl, cleanKey);
      setStep(4); // success screen
    } catch {
      setProblem("Could not reach that URL. Check the project URL (https://xxxxx.supabase.co) and your connection.");
    } finally {
      setTesting(false);
    }
  };

  const reset = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setStep(1);
      setProblem(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent className="max-w-lg bg-card border-neuro-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {step === 4 ? "Vault Linked ⚡" : `Link Your Cloud Vault — Step ${step} of 3`}
          </DialogTitle>
          <DialogDescription>
            {step === 4
              ? "Your work now backs up to a database only you control."
              : "Two minutes, free tier, your keys only. Nothing ever touches NeuroVerse servers."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-foreground/90">
              Create a free Supabase project — it's your private database, on your own account.
            </p>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1.5">
              <li>Open supabase.com and sign up (free)</li>
              <li>Click <span className="text-foreground">New project</span>, give it any name</li>
              <li>Wait ~1 minute while it provisions</li>
            </ol>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="border-neuro-cyan/40 text-neuro-cyan hover:bg-neuro-cyan/10">
                <a href="https://supabase.com/dashboard/new" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Supabase
                </a>
              </Button>
              <Button onClick={() => setStep(2)} className="bg-neuro-cyan hover:bg-neuro-cyan/90 text-background">
                I have a project →
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-foreground/90">
              In your project, open <span className="text-neuro-cyan">SQL Editor</span> (left sidebar), paste
              this, and press <span className="text-foreground">Run</span>. It creates your vault table.
            </p>
            <pre className="text-[11px] leading-relaxed bg-background/60 border border-neuro-border rounded-md p-3 overflow-x-auto max-h-44 text-muted-foreground">
              {VAULT_SQL}
            </pre>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copySql} className="border-neuro-cyan/40 text-neuro-cyan hover:bg-neuro-cyan/10">
                <Copy className="h-4 w-4 mr-2" />
                Copy SQL
              </Button>
              <Button onClick={() => setStep(3)} className="bg-neuro-cyan hover:bg-neuro-cyan/90 text-background">
                I ran it →
              </Button>
            </div>
            <button type="button" onClick={() => setStep(1)} className="text-xs text-muted-foreground underline">
              ← back
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-foreground/90">
              From <span className="text-neuro-cyan">Project Settings → API</span>, copy the Project URL and
              the <span className="text-foreground">anon / public</span> key.
            </p>
            <div className="space-y-2">
              <Label htmlFor="vault-url">Project URL</Label>
              <Input
                id="vault-url"
                placeholder="https://xxxxx.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vault-key">anon / public API key</Label>
              <Input
                id="vault-key"
                type="password"
                placeholder="eyJhbGci... or sb_publishable_..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            {problem && <p className="text-sm text-amber-500">{problem}</p>}
            <div className="flex gap-2 items-center">
              <Button onClick={testAndLink} disabled={testing} className="bg-neuro-green hover:bg-neuro-green/90">
                {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                {testing ? "Testing..." : "Test & Link Vault"}
              </Button>
              <button type="button" onClick={() => setStep(2)} className="text-xs text-muted-foreground underline">
                ← back
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-foreground/90">
              ✅ Connection verified · first backup uploaded · <span className="text-neuro-green">auto-sync on</span> —
              from now on your full record (progress, reflections, conversations) uploads after every mission.
            </p>
            <p className="text-xs text-muted-foreground">
              Restore any time from Settings → Multi-Device Sync → Download, on any device.
            </p>
            <Button onClick={() => reset(false)} className="bg-neuro-cyan hover:bg-neuro-cyan/90 text-background">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
