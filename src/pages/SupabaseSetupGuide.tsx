import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function SupabaseSetupGuide() {
  const navigate = useNavigate();

  const sqlCode = `-- Create table for NeuroVerse state storage
create table if not exists user_state (
  id text primary key,
  state_json jsonb not null,
  updated_at timestamptz default now()
);

-- Enable RLS (optional for personal project)
alter table user_state enable row level security;

-- Allow all operations (safe because it's your private project)
create policy "Allow all access"
on user_state
for all
using (true)
with check (true);`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/settings")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
          <ThemeToggle />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24 space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-neuro-cyan to-neuro-purple bg-clip-text text-transparent mb-2">
            Supabase Setup Guide
          </h1>
          <p className="text-muted-foreground">
            Set up your own free Supabase account for multi-device sync.
          </p>
        </div>

        {/* Step 1 */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-neuro-cyan text-background font-bold">
                1
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Create a Free Supabase Account
              </h2>
            </div>
            <p className="text-muted-foreground">
              Go to{" "}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neuro-cyan underline hover:text-neuro-cyan/80 inline-flex items-center gap-1"
              >
                supabase.com
                <ExternalLink className="h-3 w-3" />
              </a>{" "}
              and sign up for a free account.
            </p>
          </div>
        </Card>

        {/* Step 2 */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-neuro-cyan text-background font-bold">
                2
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Create a New Project
              </h2>
            </div>
            <p className="text-muted-foreground">
              From your Supabase dashboard, click "New Project" and choose any name
              you like (e.g., "neuroverse-sync").
            </p>
          </div>
        </Card>

        {/* Step 3 */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-neuro-cyan text-background font-bold">
                3
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Copy Your Project URL and API Key
              </h2>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>In your Supabase project:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Go to Settings → API</li>
                <li>
                  Copy the <strong>Project URL</strong> (looks like
                  https://xxxxx.supabase.co)
                </li>
                <li>
                  Copy the <strong>anon/public</strong> API key (not the service
                  role key)
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Step 4 */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-neuro-cyan text-background font-bold">
                4
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Run This SQL in Your Supabase
              </h2>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>In your Supabase project:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Go to the SQL Editor</li>
                <li>Create a new query</li>
                <li>Paste the code below and click "Run"</li>
              </ul>
            </div>
            <div className="relative">
              <pre className="bg-background/50 border border-border rounded-lg p-4 overflow-x-auto text-xs font-mono text-foreground">
                {sqlCode}
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => {
                  navigator.clipboard.writeText(sqlCode);
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        </Card>

        {/* Step 5 */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-neuro-cyan text-background font-bold">
                5
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Return to NeuroVerse Settings
              </h2>
            </div>
            <p className="text-muted-foreground">
              Go back to NeuroVerse OS Settings and paste your Project URL and API
              key. Then tap "Save My Cloud Settings".
            </p>
          </div>
        </Card>

        {/* Step 6 */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-neuro-cyan text-background font-bold">
                6
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Tap "Sync Now" to Upload Your First Backup
              </h2>
            </div>
            <p className="text-muted-foreground">
              Your NeuroVerse OS state will be uploaded to <strong>your</strong>{" "}
              Supabase. You can now access it from any device.
            </p>
          </div>
        </Card>

        {/* Important Note */}
        <Card className="p-6 bg-neuro-purple/10 border-neuro-purple/30">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Important</h3>
            <p className="text-sm text-muted-foreground">
              This is <strong>your</strong> Supabase project. NeuroVerse OS never
              sees your data. You control everything. You can delete or export your
              data anytime from your Supabase dashboard.
            </p>
          </div>
        </Card>

        {/* Action Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={() => navigate("/settings")}
            className="bg-neuro-cyan hover:bg-neuro-cyan/90"
          >
            Return to Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
