import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Monitor } from "lucide-react";

export function ViewportDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    // Keyboard shortcut: Ctrl/Cmd + D to toggle
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const getBreakpoint = () => {
    const width = dimensions.width;
    if (width < 640) return { name: "xs", color: "text-red-400", range: "< 640px" };
    if (width < 768) return { name: "sm", color: "text-orange-400", range: "640-768px" };
    if (width < 1024) return { name: "md", color: "text-yellow-400", range: "768-1024px" };
    if (width < 1280) return { name: "lg", color: "text-green-400", range: "1024-1280px" };
    return { name: "xl", color: "text-blue-400", range: "> 1280px" };
  };

  const breakpoint = getBreakpoint();

  const testBreakpoints = [
    { width: 320, label: "320px (iPhone SE)" },
    { width: 375, label: "375px (iPhone)" },
    { width: 414, label: "414px (iPhone Plus)" },
    { width: 768, label: "768px (iPad)" },
    { width: 1024, label: "1024px (Desktop)" },
  ];

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 p-0 bg-neuro-cyan/20 hover:bg-neuro-cyan/30 border border-neuro-cyan/50 shadow-lg"
        title="Show Debug Panel (Ctrl/Cmd + D)"
      >
        <Monitor className="w-5 h-5 text-neuro-cyan" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 p-4 bg-card/95 backdrop-blur-md border-neuro-border shadow-2xl w-[280px] sm:w-[320px]">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Monitor className="w-4 h-4 text-neuro-cyan" />
            Viewport Debug
          </h3>
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center p-2 bg-neuro-surface/50 rounded border border-neuro-border">
            <span className="text-muted-foreground">Width:</span>
            <span className="font-mono font-bold text-foreground">{dimensions.width}px</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-neuro-surface/50 rounded border border-neuro-border">
            <span className="text-muted-foreground">Height:</span>
            <span className="font-mono font-bold text-foreground">{dimensions.height}px</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-neuro-surface/50 rounded border border-neuro-border">
            <span className="text-muted-foreground">Breakpoint:</span>
            <span className={`font-mono font-bold ${breakpoint.color}`}>
              {breakpoint.name.toUpperCase()}
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground text-center pt-1">
            {breakpoint.range}
          </div>
        </div>

        <div className="pt-2 border-t border-neuro-border">
          <p className="text-[10px] text-muted-foreground mb-2">Test Breakpoints:</p>
          <div className="grid grid-cols-2 gap-1.5">
            {testBreakpoints.map((bp) => (
              <div
                key={bp.width}
                className={`text-[10px] p-1.5 rounded text-center ${
                  dimensions.width === bp.width
                    ? "bg-neuro-cyan/20 text-neuro-cyan border border-neuro-cyan/50"
                    : "bg-neuro-surface/30 text-muted-foreground border border-neuro-border/50"
                }`}
              >
                {bp.label}
              </div>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-muted-foreground text-center pt-2 border-t border-neuro-border">
          Toggle: <kbd className="px-1 py-0.5 bg-neuro-surface rounded text-foreground">Ctrl/Cmd+D</kbd>
        </div>
      </div>
    </Card>
  );
}
