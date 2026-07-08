// NeuroVerse OS — Systems Panel
// User-facing diagnostic console for troubleshooting and integrity checks

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Play, RefreshCw, Trash2, FileCheck, Activity, HardDrive, Wifi, WifiOff, CheckCircle2, AlertCircle, AlertTriangle, Loader2, Github, ExternalLink, Bug, Lightbulb, Download } from "lucide-react";
import { useDiagnostics, type DiagnosticResult } from "@/hooks/useDiagnostics";
import { formatValidationReport } from "@/lib/lesson-validator";
import { toast } from "@/hooks/use-toast";
import diagnosticsSchema from "@/data/diagnosticsSchema.json";

export default function SystemsPanel() {
  const navigate = useNavigate();
  const diagnostics = useDiagnostics();
  
  const [hasRun, setHasRun] = useState(false);
  const [selectedTroubleshooter, setSelectedTroubleshooter] = useState<string | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [showNarrative, setShowNarrative] = useState(true);

  useEffect(() => {
    // Show Echelon opening narrative on mount
    setTimeout(() => setShowNarrative(false), 5000);
  }, []);

  const handleRunDiagnostic = async () => {
    setHasRun(false);
    toast({
      title: "Scanning System",
      description: diagnosticsSchema.narratives.scanning,
    });
    
    await diagnostics.runFullDiagnostic();
    setHasRun(true);
    
    const hasErrors = diagnostics.results.some(r => r.status === 'error');
    toast({
      title: hasErrors ? "Anomalies Detected" : "System Nominal",
      description: hasErrors ? diagnosticsSchema.narratives.complete_fail : diagnosticsSchema.narratives.complete_pass,
    });
  };

  const handleRepairAction = async (action: () => void | Promise<void>, label: string) => {
    const confirmed = window.confirm(`${diagnosticsSchema.narratives.repair_confirm}\n\nAction: ${label}`);
    if (!confirmed) return;

    setIsRepairing(true);
    try {
      await action();
      toast({
        title: "Repair Complete",
        description: diagnosticsSchema.narratives.repair_complete,
      });
      
      // Re-run diagnostics after repair
      await diagnostics.runFullDiagnostic();
    } catch (error) {
      console.error('[SYSTEMS PANEL] Repair failed:', error);
      toast({
        title: "Repair Failed",
        description: diagnosticsSchema.narratives.repair_failed,
        variant: "destructive",
      });
    } finally {
      setIsRepairing(false);
    }
  };

  const handleDownloadBuildInfo = () => {
    try {
      const buildInfo = {
        timestamp: new Date().toISOString(),
        version: import.meta.env.VITE_APP_VERSION || "1.0.0",
        commit: import.meta.env.VITE_GIT_COMMIT || "dev",
        buildDate: import.meta.env.VITE_BUILD_DATE || "N/A",
        environment: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          online: navigator.onLine,
          cookiesEnabled: navigator.cookieEnabled,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
        },
        storage: {
          localStorageKeys: Object.keys(localStorage),
          localStorageSize: new Blob(Object.values(localStorage)).size,
        },
        diagnostics: diagnostics.results.map(r => ({
          id: r.id,
          label: r.label,
          status: r.status,
          message: r.message,
          details: r.details,
        })),
        performance: {
          memory: (performance as any).memory ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
            jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
          } : "Not available",
        },
      };

      const dataStr = JSON.stringify(buildInfo, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `neuroverse-diagnostics-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Diagnostics Exported",
        description: "System diagnostics downloaded successfully.",
      });
    } catch (error) {
      console.error('[SYSTEMS PANEL] Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Could not export system diagnostics.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: 'pass' | 'warning' | 'error') => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: 'pass' | 'warning' | 'error') => {
    switch (status) {
      case 'pass':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/settings")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
          <Badge variant="outline" className="text-xs">
            System Diagnostics v1.0
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8 pb-24 space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-neuro-cyan to-neuro-purple bg-clip-text text-transparent mb-2">
            Systems Panel
          </h1>
          <p className="text-muted-foreground text-sm">
            Diagnostic console for troubleshooting and integrity validation
          </p>
        </div>

        {/* Echelon Narrative Overlay */}
        {showNarrative && (
          <Alert className="bg-neuro-purple/10 border-neuro-purple/20">
            <Activity className="h-4 w-4 text-neuro-purple" />
            <AlertDescription className="text-sm">
              {diagnosticsSchema.narratives.opening}
            </AlertDescription>
          </Alert>
        )}

        {/* System Status Overview */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">System Status Overview</h2>
            <Button 
              onClick={handleRunDiagnostic} 
              disabled={diagnostics.isRunning}
              className="bg-neuro-purple hover:bg-neuro-purple/80"
            >
              {diagnostics.isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Full Diagnostic
                </>
              )}
            </Button>
          </div>

          {/* Quick Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hasRun && diagnostics.results.map((result) => (
              <div
                key={result.id}
                className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(result.status)}
                  <span className="text-sm font-medium">{result.label}</span>
                </div>
                <p className="text-xs opacity-80">{result.message}</p>
              </div>
            ))}
            
            {!hasRun && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Run diagnostic to view system status</p>
              </div>
            )}
          </div>
        </Card>

        {/* Diagnostic Results (Expandable) */}
        {hasRun && (
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Detailed Results</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {diagnostics.results.map((result) => (
                <AccordionItem key={result.id} value={result.id} className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 w-full">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">{result.label}</span>
                      <span className="ml-auto text-sm text-muted-foreground">{result.message}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-4 space-y-3">
                    <div className="bg-muted/30 rounded-lg p-4 text-xs font-mono">
                      <pre className="overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </div>
                    
                    {result.id === 'lesson-integrity' && result.details && !result.details.isValid && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                          {formatValidationReport(result.details)}
                        </pre>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        )}

        {/* Repair Tools */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Repair Tools</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Execute repair operations to restore system integrity
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleRepairAction(diagnostics.refreshLessonsJson, "Rebuild Lesson Cache")}
              disabled={isRepairing}
              className="justify-start h-auto py-4 px-4"
            >
              <RefreshCw className="h-4 w-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">Rebuild Lesson Cache</div>
                <div className="text-xs text-muted-foreground">Force reload lessons.json</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleRepairAction(diagnostics.clearEchelonCache, "Clear Echelon Memory")}
              disabled={isRepairing}
              className="justify-start h-auto py-4 px-4"
            >
              <Trash2 className="h-4 w-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">Clear Echelon Memory</div>
                <div className="text-xs text-muted-foreground">Reset conversation cache</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleRepairAction(diagnostics.rebuildFieldGuide, "Rebuild Field Guide")}
              disabled={isRepairing}
              className="justify-start h-auto py-4 px-4"
            >
              <FileCheck className="h-4 w-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">Rebuild Field Guide</div>
                <div className="text-xs text-muted-foreground">Reset Field Guide index</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleRepairAction(diagnostics.validateAndFixState, "Validate State")}
              disabled={isRepairing}
              className="justify-start h-auto py-4 px-4"
            >
              <CheckCircle2 className="h-4 w-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">Validate & Fix State</div>
                <div className="text-xs text-muted-foreground">Repair state structure</div>
              </div>
            </Button>
          </div>

          <Alert className="bg-destructive/10 border-destructive/20 mt-6">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-xs">
              <strong>Caution:</strong> Repair operations modify local state. Export your data before performing repairs.
            </AlertDescription>
          </Alert>
        </Card>

        {/* Guided Troubleshooter */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Guided Troubleshooter</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Step-by-step resolution for common issues
          </p>

          <div className="space-y-3">
            {diagnosticsSchema.troubleshooters.map((troubleshooter) => (
              <div key={troubleshooter.id} className="border border-border/50 rounded-lg">
                <button
                  onClick={() => setSelectedTroubleshooter(
                    selectedTroubleshooter === troubleshooter.id ? null : troubleshooter.id
                  )}
                  className="w-full p-4 text-left hover:bg-muted/30 rounded-lg transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-foreground">{troubleshooter.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{troubleshooter.description}</div>
                  </div>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </button>

                {selectedTroubleshooter === troubleshooter.id && (
                  <div className="px-4 pb-4 space-y-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Resolution Steps:</div>
                    {troubleshooter.steps.map((step, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neuro-purple/20 text-neuro-purple flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{step.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">{step.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Build Info */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Build Info</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Application version and source code information
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadBuildInfo}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Diagnostics
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <span className="text-sm text-muted-foreground">Version</span>
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                {import.meta.env.VITE_APP_VERSION || "1.0.0"}
              </code>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <span className="text-sm text-muted-foreground">Commit Hash</span>
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                {import.meta.env.VITE_GIT_COMMIT?.substring(0, 8) || "dev"}
              </code>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <span className="text-sm text-muted-foreground">Deployed</span>
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                {import.meta.env.VITE_BUILD_DATE || new Date().toISOString().split('T')[0]}
              </code>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <span className="text-sm text-muted-foreground">Source Code</span>
              <a
                href={import.meta.env.VITE_GITHUB_REPO || "https://github.com/NeuroverseOS/HowToSaveTheWorld"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-neuro-cyan hover:text-neuro-cyan/80 transition-colors"
              >
                <Github className="h-4 w-4" />
                View on GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <span className="text-sm text-muted-foreground">Bug Report</span>
              <a
                href={(() => {
                  const repoUrl = import.meta.env.VITE_GITHUB_REPO || "https://github.com/NeuroverseOS/HowToSaveTheWorld";
                  const version = import.meta.env.VITE_APP_VERSION || "1.0.0";
                  const commit = import.meta.env.VITE_GIT_COMMIT?.substring(0, 8) || "dev";
                  const userAgent = navigator.userAgent;
                  
                  const title = encodeURIComponent("[Bug Report] ");
                  const body = encodeURIComponent(
`**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
A clear description of what you expected to happen.

**System Information**
- Version: ${version}
- Commit: ${commit}
- Browser: ${userAgent}
- Date: ${new Date().toISOString()}

**Additional context**
Add any other context about the problem here.`
                  );
                  
                  return `${repoUrl}/issues/new?title=${title}&body=${body}&labels=bug`;
                })()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-400 transition-colors"
              >
                <Bug className="h-4 w-4" />
                Report Issue
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <span className="text-sm text-muted-foreground">Feature Request</span>
              <a
                href={(() => {
                  const repoUrl = import.meta.env.VITE_GITHUB_REPO || "https://github.com/NeuroverseOS/HowToSaveTheWorld";
                  const version = import.meta.env.VITE_APP_VERSION || "1.0.0";
                  
                  const title = encodeURIComponent("[Feature Request] ");
                  const body = encodeURIComponent(
`**Is your feature request related to a problem?**
A clear description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
A clear description of any alternative solutions or features you've considered.

**How would this enhance NeuroVerse OS?**
Explain how this feature aligns with the sovereign, local-first philosophy and cognitive OS framework.

**System Context**
- Version: ${version}
- Use Case: [Design Mode / Build Mode / Lead Mode / Training]

**Additional context**
Add any other context, mockups, or examples about the feature request here.`
                  );
                  
                  return `${repoUrl}/issues/new?title=${title}&body=${body}&labels=enhancement`;
                })()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-neuro-purple hover:text-neuro-purple/80 transition-colors"
              >
                <Lightbulb className="h-4 w-4" />
                Request Feature
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center italic">
              NeuroVerse OS is open-source and auditable. Don't trust us — trust the code.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
