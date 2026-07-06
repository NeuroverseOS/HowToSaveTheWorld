import { Card } from "@/components/ui/card";
import { getSlideBand } from "@/lib/campaign-engine";
import type { StateSchema } from "@/lib/state-engine";

interface WorldStatePanelProps {
  state: StateSchema;
  totalLessons?: number;
}

const BAND_COLORS = ["#22c55e", "#eab308", "#f97316", "#ef4444"]; // Open Sky → Locktown
const SECTION_COLORS = ["#06b6d4", "#22c55e", "#eab308", "#f97316", "#a855f7", "#ec4899"];

/** Deterministic pseudo-random from a lesson number (stable node positions). */
function nodePos(n: number, total: number, width: number, height: number) {
  const golden = 0.6180339887;
  const x = ((n * golden) % 1) * (width - 16) + 8;
  const jitter = (((n * 2654435761) >>> 16) % 1000) / 1000;
  const band = Math.floor(((n - 1) / total) * 4);
  const y = 12 + band * ((height - 24) / 4) + jitter * ((height - 24) / 4 - 6);
  return { x, y };
}

/**
 * THE SLIDE — campaign world state: the meter (what is being lost) and the
 * living map (what is being built). Every completed mission lights a node
 * of the Open Robotics Network. Design: docs/WORLD_DESIGN.md §2.4, §3.
 */
export function WorldStatePanel({ state, totalLessons = 96 }: WorldStatePanelProps) {
  const { slide, signal } = state.world;
  const band = getSlideBand(slide);
  const completed = new Set(state.progress.lessons_completed);
  const W = 640;
  const H = 120;

  return (
    <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-neuro-border space-y-4">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <span className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.15em] text-muted-foreground">
          Campaign · The Open Robotics Network
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          Objective: build it before the window closes
        </span>
      </div>

      {/* The Living Map — nodes light as missions complete */}
      <div className="rounded-md border border-neuro-border/50 bg-background/40 overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label={`Network map: ${completed.size} of ${totalLessons} nodes online`}>
          {Array.from({ length: totalLessons }, (_, i) => {
            const n = i + 1;
            const { x, y } = nodePos(n, totalLessons, W, H);
            const lit = completed.has(n);
            const color = SECTION_COLORS[Math.min(Math.floor(i / (totalLessons / 6)), 5)];
            return (
              <circle
                key={n}
                cx={x}
                cy={y}
                r={lit ? 3 : 1.5}
                fill={lit ? color : "currentColor"}
                opacity={lit ? 0.95 : 0.18}
              >
                {lit && <animate attributeName="opacity" values="0.95;0.6;0.95" dur="3s" repeatCount="indefinite" />}
              </circle>
            );
          })}
        </svg>
        <div className="px-3 pb-2 -mt-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {completed.size} / {totalLessons} nodes online
        </div>
      </div>

      {/* The Slide meter */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-baseline text-xs">
          <span className="font-mono uppercase tracking-[0.15em] text-muted-foreground">The Slide</span>
          <span className="font-mono tabular-nums font-medium" style={{ color: BAND_COLORS[band.index] }}>
            {slide} · {band.name}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${slide}%`, backgroundColor: BAND_COLORS[band.index] }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground font-mono">
          Entropy pulls toward Locktown. Every mission pushes back.
        </p>
      </div>

      {/* Signal */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-baseline text-xs">
          <span className="font-mono uppercase tracking-[0.15em] text-muted-foreground">Signal</span>
          <span className="font-mono tabular-nums text-neuro-cyan font-medium">{signal} / 100</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
          <div
            className="h-full rounded-full bg-neuro-cyan/80 transition-all duration-700"
            style={{ width: `${signal}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
