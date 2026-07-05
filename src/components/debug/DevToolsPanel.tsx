import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Code2, Trash2, Download, Upload, RefreshCw, Box } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loadState, clearState, hasState } from "@/lib/state-engine";
import { getActiveBoxesForStage, getVisibilityFromBoxes, BOX_STAGE_MAP } from "@/lib/box-stage-map";

export function DevToolsPanel() {
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  // Keyboard shortcut: Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClearLocalStorage = () => {
    const confirmed = window.confirm(
      "Destroy ALL local data? Your callsign, archetype, mission progress, reflections, and stored AI key will be permanently erased from this device. This is your sovereign right \u2014 and it cannot be undone."
    );
    if (!confirmed) return;
    localStorage.clear();
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Storage Cleared",
      description: "All localStorage has been cleared. Refresh to restart onboarding.",
    });
  };

  const handleClearState = () => {
    const confirmed = window.confirm(
      "Reset your journey state? Mission progress and identity will be cleared on this device (your stored AI key is kept). This cannot be undone."
    );
    if (!confirmed) return;
    clearState();
    setRefreshKey(prev => prev + 1);
    toast({
      title: "State Cleared",
      description: "NeuroVerse state has been cleared.",
    });
  };

  const handleExportState = () => {
    try {
      const state = loadState();
      const dataStr = JSON.stringify(state, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `neuroverse-state-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "State Exported",
        description: "State downloaded as JSON file.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export state.",
        variant: "destructive",
      });
    }
  };

  const getLocalStorageKeys = () => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }
    return keys;
  };

  const getStorageSize = (key: string): string => {
    const value = localStorage.getItem(key);
    if (!value) return "0 B";
    
    const bytes = new Blob([value]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const storageKeys = getLocalStorageKeys();
  const stateExists = hasState();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 left-4 z-50 shadow-lg"
          title="Dev Tools (Ctrl+Shift+D)"
        >
          <Code2 className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Sovereignty Inspector</SheetTitle>
          <SheetDescription>
            This is everything How to Save the World knows about you. It lives here, on your device. Inspect it. Export it. Destroy it. No one can do this for you \u2014 or to you.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6" key={refreshKey}>
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearLocalStorage}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Storage
              </Button>
              
              {stateExists && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearState}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear State Only
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportState}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export State
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Storage Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Storage Overview</CardTitle>
              <CardDescription>
                {storageKeys.length} keys in localStorage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {storageKeys.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data in localStorage</p>
                ) : (
                  storageKeys.map((key) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono truncate">{key}</p>
                        <p className="text-xs text-muted-foreground">
                          {getStorageSize(key)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          localStorage.removeItem(key);
                          setRefreshKey(prev => prev + 1);
                          toast({
                            title: "Key Removed",
                            description: `Removed "${key}" from storage`,
                          });
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* State Info */}
          {stateExists && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">State Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">State Initialized</span>
                    <Badge variant="default">Yes</Badge>
                  </div>
                  
                  {(() => {
                    try {
                      const state = loadState();
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">User ID</span>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {state.user.id.substring(0, 8)}...
                            </code>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Current Lesson</span>
                            <Badge variant="outline">{state.progress.current_lesson_id}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Archetype</span>
                            <Badge variant="outline">
                              {state.user.archetype.primary || "Not set"}
                            </Badge>
                          </div>
                        </>
                      );
                    } catch {
                      return <p className="text-sm text-destructive">Error reading state</p>;
                    }
                  })()}
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Box Activation Debug Panel */}
          {stateExists && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Box className="h-4 w-4" />
                  Box Activation
                </CardTitle>
                <CardDescription>
                  Active content boxes for current mission stage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  try {
                    const state = loadState();
                    const currentLessonId = state.progress.current_lesson_id;
                    const currentStage = state.progress.mission_progress[currentLessonId]?.current_stage || 'onboarding_screen_1';
                    const activeBoxes = getActiveBoxesForStage(currentStage);
                    const visibility = getVisibilityFromBoxes(currentStage);
                    const stageEntry = BOX_STAGE_MAP.find(
                      e => e.stage === currentStage || e.stage === currentStage.replace('mission_', '')
                    );

                    const boxNames: Record<number, string> = {
                      1: 'Core Rules',
                      2: 'Identity Tags',
                      3: 'Stage Instruction',
                      4: 'Stage Content',
                      5: 'Lesson Modifiers',
                      6: 'Short-term Memory',
                      7: 'Long-term Notes'
                    };

                    return (
                      <div className="space-y-4">
                        {/* Current Stage */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Current Stage</p>
                          <Badge variant="default" className="font-mono">
                            {currentStage}
                          </Badge>
                        </div>

                        {/* Active Boxes */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Active Boxes</p>
                          <div className="grid grid-cols-2 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7].map((boxNum) => {
                              const isActive = activeBoxes.includes(boxNum);
                              return (
                                <div
                                  key={boxNum}
                                  className={`p-2 rounded-md border text-xs ${
                                    isActive
                                      ? 'bg-primary/10 border-primary text-primary'
                                      : 'bg-muted/50 border-border text-muted-foreground'
                                  }`}
                                >
                                  <div className="font-medium">Box {boxNum}</div>
                                  <div className="text-[10px] opacity-80">
                                    {boxNames[boxNum]}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Visibility Flags */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Visibility Rules</p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>Identity Tags</span>
                              <Badge variant={visibility.showIdentityTags ? "default" : "outline"} className="text-[10px] h-5">
                                {visibility.showIdentityTags ? "Visible" : "Hidden"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span>Short-term Memory</span>
                              <Badge variant={visibility.showShortTermMemory ? "default" : "outline"} className="text-[10px] h-5">
                                {visibility.showShortTermMemory ? "Visible" : "Hidden"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span>Long-term Memory</span>
                              <Badge variant={visibility.showLongTermMemory ? "default" : "outline"} className="text-[10px] h-5">
                                {visibility.showLongTermMemory ? "Visible" : "Hidden"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span>Field Guide Output</span>
                              <Badge variant={visibility.allowFieldGuideNarratives ? "default" : "outline"} className="text-[10px] h-5">
                                {visibility.allowFieldGuideNarratives ? "Allowed" : "Blocked"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Stage Notes */}
                        {stageEntry?.notes && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Stage Notes</p>
                            <p className="text-xs bg-muted/50 p-2 rounded-md italic">
                              {stageEntry.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  } catch (error) {
                    return (
                      <p className="text-sm text-destructive">
                        Error loading box activation data
                      </p>
                    );
                  }
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
