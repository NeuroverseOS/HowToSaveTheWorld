import { useState } from 'react';
import { useUnlockAnimationContext } from '@/components/neuroverse/UnlockAnimationProvider';
import { Button } from '@/components/ui/button';
import { Sparkles, Zap, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function UnlockPreview() {
  const { triggerUnlock } = useUnlockAnimationContext();
  const [lastTriggered, setLastTriggered] = useState<string>('');

  const triggerDesignMode = () => {
    triggerUnlock({
      type: 'work_mode_design',
      data: {
        name: 'VANGUARD ALPHA-13',
        description: 'You have proven pattern fluency, frame control, and structural reasoning. Your thinking now meets the threshold for architectural cognition. Tell me what we are designing.',
      },
    });
    setLastTriggered('Design Mode');
  };

  const triggerBuildMode = () => {
    triggerUnlock({
      type: 'work_mode_build',
      data: {
        name: 'VANGUARD ALPHA-13',
        description: 'Your execution signatures show consistency, discipline, and clarity. You are ready to construct the future, piece by piece. What are we building?',
      },
    });
    setLastTriggered('Build Mode');
  };

  const triggerLeadMode = () => {
    triggerUnlock({
      type: 'work_mode_lead',
      data: {
        name: 'VANGUARD ALPHA-13',
        description: 'You now demonstrate an emergent leadership arc: foresight, empathy, conflict navigation, and narrative control. What context do we lead through?',
      },
    });
    setLastTriggered('Lead Mode');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Work Mode Unlock Preview</h1>
          <p className="text-muted-foreground">
            Test and review the cinematic unlock sequences for Design, Build, and Lead modes.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Design Mode Card */}
          <Card className="border-purple-500/20 hover:border-purple-500/40 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-500/10">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <CardTitle className="text-purple-400">Design Mode</CardTitle>
              </div>
              <CardDescription>
                Strategic partner, pattern-seeking, possibility-expanding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={triggerDesignMode}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                Preview Design Unlock
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Unlocks at Lesson 30
              </p>
            </CardContent>
          </Card>

          {/* Build Mode Card */}
          <Card className="border-neuro-cyan/20 hover:border-neuro-cyan/40 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-neuro-cyan/10">
                  <Zap className="w-6 h-6 text-neuro-cyan" />
                </div>
                <CardTitle className="text-neuro-cyan">Build Mode</CardTitle>
              </div>
              <CardDescription>
                Tactical precision operator, execution-focused, detail-oriented
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={triggerBuildMode}
                className="w-full bg-neuro-cyan hover:bg-neuro-cyan/80 text-black"
              >
                Preview Build Unlock
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Unlocks at Lesson 60
              </p>
            </CardContent>
          </Card>

          {/* Lead Mode Card */}
          <Card className="border-neuro-orange/20 hover:border-neuro-orange/40 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-neuro-orange/10">
                  <Star className="w-6 h-6 text-neuro-orange" />
                </div>
                <CardTitle className="text-neuro-orange">Lead Mode</CardTitle>
              </div>
              <CardDescription>
                Relational advisor, narrative-aware, empathy-driven
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={triggerLeadMode}
                className="w-full bg-neuro-orange hover:bg-neuro-orange/80 text-black"
              >
                Preview Lead Unlock
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Unlocks at Lesson 90
              </p>
            </CardContent>
          </Card>
        </div>

        {lastTriggered && (
          <div className="p-4 rounded-lg bg-card border border-primary/20">
            <p className="text-sm text-muted-foreground">
              Last triggered: <span className="text-primary font-medium">{lastTriggered}</span>
            </p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Animation Details</CardTitle>
            <CardDescription>Technical specifications for Work Mode unlocks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-mono">3000ms (3 seconds)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Animation Type:</span>
              <span className="font-mono">work-mode-unlock</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CSS Class:</span>
              <span className="font-mono">.work-mode-unlock</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mobile Duration:</span>
              <span className="font-mono">1500ms (50% faster)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
