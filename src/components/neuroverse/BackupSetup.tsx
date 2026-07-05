import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Cloud, Shield, ArrowRight, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BackupSetupProps {
  onComplete: (backupChoice: 'manual' | 'cloud' | 'declined') => void;
}

export function BackupSetup({ onComplete }: BackupSetupProps) {
  const [selected, setSelected] = useState<'manual' | 'cloud' | 'declined' | null>(null);

  const handleConfirm = () => {
    if (!selected) {
      toast({
        title: "Selection Required",
        description: "Choose a backup method to continue",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: selected === 'manual' ? "Manual Backup Selected" : selected === 'cloud' ? "Cloud Sync Selected" : "No Backup Selected",
      description: selected === 'manual' 
        ? "You'll be reminded to export your data after each lesson" 
        : selected === 'cloud'
        ? "You can configure cloud sync in Settings after onboarding"
        : "You can set up backups anytime in Settings",
    });

    onComplete(selected);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="circuit-overlay opacity-20" />

      <div className="relative z-10 w-full max-w-4xl space-y-4 sm:space-y-6 md:space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 sm:space-y-3 md:space-y-4">
          <div className="inline-block p-3 sm:p-4 rounded-full bg-neuro-orange/10 mb-2 sm:mb-3 md:mb-4">
            <Shield className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-neuro-orange animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            DATA SOVEREIGNTY PROTOCOL
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your training data belongs to you. Choose how you want to protect it.
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Option 1: Manual Export */}
          <Card 
            className={`p-4 sm:p-5 md:p-6 cursor-pointer transition-all hover:scale-105 ${
              selected === 'manual' 
                ? 'border-neuro-cyan bg-neuro-cyan/10 ring-2 ring-neuro-cyan' 
                : 'border-neuro-border bg-card/50 hover:border-neuro-cyan/50'
            }`}
            onClick={() => setSelected('manual')}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <Download className="h-8 w-8 text-neuro-cyan" />
                {selected === 'manual' && (
                  <Check className="h-6 w-6 text-neuro-cyan" />
                )}
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Manual Export
                </h3>
                <Badge variant="outline" className="mb-3 border-neuro-green text-neuro-green">
                  Recommended
                </Badge>
                <p className="text-sm text-muted-foreground mb-4">
                  Export your data as a JSON file after each lesson. Store it wherever you want: 
                  iCloud, Google Drive, Dropbox, or your device.
                </p>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-neuro-green" />
                  <span>100% local-first</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-neuro-green" />
                  <span>No account required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-neuro-green" />
                  <span>You control storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-neuro-green" />
                  <span>Reminder after each lesson</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Option 2: Cloud Sync */}
          <Card 
            className={`p-4 sm:p-5 md:p-6 cursor-pointer transition-all hover:scale-105 ${
              selected === 'cloud' 
                ? 'border-neuro-purple bg-neuro-purple/10 ring-2 ring-neuro-purple' 
                : 'border-neuro-border bg-card/50 hover:border-neuro-purple/50'
            }`}
            onClick={() => setSelected('cloud')}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <Cloud className="h-8 w-8 text-neuro-purple" />
                {selected === 'cloud' && (
                  <Check className="h-6 w-6 text-neuro-purple" />
                )}
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Cloud Sync
                </h3>
                <Badge variant="outline" className="mb-3 border-neuro-purple text-neuro-purple">
                  Advanced
                </Badge>
                <p className="text-sm text-muted-foreground mb-4">
                  Use your own Supabase account for automatic sync across devices. 
                  Requires setup after onboarding.
                </p>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-neuro-purple" />
                  <span>Multi-device sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-neuro-purple" />
                  <span>Your own infrastructure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-neuro-purple" />
                  <span>Automatic backups</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-neuro-purple" />
                  <span>Requires Supabase account</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Option 3: Decline */}
          <Card 
            className={`p-4 sm:p-5 md:p-6 cursor-pointer transition-all hover:scale-105 ${
              selected === 'declined' 
                ? 'border-muted bg-muted/10 ring-2 ring-muted' 
                : 'border-neuro-border bg-card/50 hover:border-muted/50'
            }`}
            onClick={() => setSelected('declined')}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <Shield className="h-8 w-8 text-muted-foreground" />
                {selected === 'declined' && (
                  <Check className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Skip for Now
                </h3>
                <Badge variant="outline" className="mb-3 border-muted-foreground/50 text-muted-foreground">
                  Not Recommended
                </Badge>
                <p className="text-sm text-muted-foreground mb-4">
                  Continue without backup protection. You can set this up later in Settings.
                </p>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="text-destructive">⚠️</span>
                  <span>No backup protection</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-destructive">⚠️</span>
                  <span>Data loss if cache cleared</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-muted-foreground" />
                  <span>Can enable in Settings</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Confirmation */}
        <div className="text-center space-y-3 sm:space-y-4">
          <Button
            onClick={handleConfirm}
            disabled={!selected}
            variant="critical"
            size="lg"
            className="px-6 sm:px-8 md:px-12 py-4 sm:py-5 md:py-6 text-base sm:text-lg"
          >
            Confirm Selection <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
            This is part of NeuroVerse's sovereign architecture. Your data never leaves your device 
            unless you explicitly export or sync it using your own infrastructure.
          </p>
        </div>
      </div>
    </div>
  );
}
