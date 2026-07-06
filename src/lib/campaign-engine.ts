// ============================================================================
// CAMPAIGN ENGINE — THE SLIDE (Phase 1)
// World state, anomaly events, and consequence mechanics.
// Design: docs/WORLD_DESIGN.md. Everything here is local-first; the world
// lives in the operator's own state and nowhere else.
// ============================================================================

import { loadState, saveState, type StateSchema } from "./state-engine";

// ---------------------------------------------------------------------------
// Slide bands
// ---------------------------------------------------------------------------

export interface SlideBand {
  index: 0 | 1 | 2 | 3;
  name: "Open Sky" | "Overcast" | "The Slide" | "Locktown";
}

export function getSlideBand(slide: number): SlideBand {
  if (slide <= 25) return { index: 0, name: "Open Sky" };
  if (slide <= 50) return { index: 1, name: "Overcast" };
  if (slide <= 75) return { index: 2, name: "The Slide" };
  return { index: 3, name: "Locktown" };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ---------------------------------------------------------------------------
// World snapshot
// ---------------------------------------------------------------------------

export interface WorldSnapshot {
  slide: number;
  band: SlideBand;
  signal: number;
  lastDecision: StateSchema["world"]["decisions"][number] | null;
}

export function getWorldSnapshot(): WorldSnapshot | null {
  const state = loadState();
  if (!state) return null;
  const { world } = state;
  return {
    slide: world.slide,
    band: getSlideBand(world.slide),
    signal: world.signal,
    lastDecision: world.decisions[world.decisions.length - 1] ?? null,
  };
}

// ---------------------------------------------------------------------------
// Effective fog — the world made felt in every conversation
// effective = authored base + slide pressure + degraded-link pressure
// ---------------------------------------------------------------------------

export function getEffectiveFog(baseFog: number): number {
  const state = loadState();
  if (!state) return clamp(baseFog, 0, 5);
  const band = getSlideBand(state.world.slide);
  const slideMod = band.index >= 2 ? band.index - 1 : 0; // The Slide +1, Locktown +2
  const signalMod = state.world.signal < 30 ? 1 : 0;
  return clamp(baseFog + slideMod + signalMod, 0, 5);
}

// ---------------------------------------------------------------------------
// Mission completion tick — entropy pulls up, the work pushes back
// ---------------------------------------------------------------------------

export function applyMissionCompletion(lessonId: number, reflected: boolean): void {
  const state = loadState();
  if (!state) return;

  // Entropy tick (+1) is always paid; completing the mission (-2) beats it,
  // and an honest reflection (-1 more) widens the margin. Doing the work is
  // the only way the world improves — exactly the thesis.
  const delta = 1 - 2 - (reflected ? 1 : 0);
  state.world.slide = clamp(state.world.slide + delta, 0, 100);
  if (reflected) state.world.signal = clamp(state.world.signal + 5, 0, 100);

  state.world.slide_history.push({
    lesson_id: lessonId,
    slide: state.world.slide,
    reason: reflected ? "mission complete (reflected)" : "mission complete",
    at: new Date().toISOString(),
  });
  saveState(state);
  console.log(`[CAMPAIGN] Mission ${lessonId} tick: slide ${state.world.slide} (${getSlideBand(state.world.slide).name}), signal ${state.world.signal}`);
}

// ---------------------------------------------------------------------------
// Anomaly events — the broken axle
// ---------------------------------------------------------------------------

export interface AnomalyChoice {
  id: string;
  label: string;
  detail: string;                    // what this costs / risks, stated honestly
  effects: { signal: number; slide: number };
  echo: string;                      // Echelon's in-fiction acknowledgment
}

export interface AnomalyEvent {
  id: string;
  antagonist: string;
  title: string;
  concept: string;                   // the real decentralization concept taught
  narrative: string;
  teach: string;                     // revealed by "Ask Echelon" — free, always
  choices: AnomalyChoice[];
}

let anomalyCache: AnomalyEvent[] | null = null;

export async function loadAnomalies(): Promise<AnomalyEvent[]> {
  if (anomalyCache) return anomalyCache;
  try {
    const res = await fetch("/anomalies.json");
    if (!res.ok) return [];
    anomalyCache = (await res.json()) as AnomalyEvent[];
    return anomalyCache;
  } catch {
    return [];
  }
}

// Probability of an event firing at a stage transition, by Slide band —
// a darker world is a more eventful one.
const EVENT_CHANCE = [0.1, 0.18, 0.28, 0.38];

/**
 * Roll for an anomaly event at a stage transition.
 * Guards (per design §5): never in missions 1-3, never twice in one mission,
 * and each event fires at most once per operator.
 */
export async function rollAnomalyEvent(lessonId: number, lessonNumber: number): Promise<AnomalyEvent | null> {
  if (lessonNumber <= 3) return null;
  const state = loadState();
  if (!state) return null;
  if (state.world.decisions.some((d) => d.lesson_id === lessonId)) return null;

  const band = getSlideBand(state.world.slide);
  if (Math.random() > EVENT_CHANCE[band.index]) return null;

  const events = await loadAnomalies();
  const seen = new Set(state.world.decisions.map((d) => d.event_id));
  const fresh = events.filter((e) => !seen.has(e.id));
  if (fresh.length === 0) return null;

  return fresh[Math.floor(Math.random() * fresh.length)];
}

export function resolveAnomaly(event: AnomalyEvent, choice: AnomalyChoice, lessonId: number): WorldSnapshot | null {
  const state = loadState();
  if (!state) return null;

  state.world.signal = clamp(state.world.signal + choice.effects.signal, 0, 100);
  state.world.slide = clamp(state.world.slide + choice.effects.slide, 0, 100);
  state.world.decisions.push({
    event_id: event.id,
    choice_id: choice.id,
    lesson_id: lessonId,
    at: new Date().toISOString(),
    effects: { ...choice.effects },
  });
  state.world.slide_history.push({
    lesson_id: lessonId,
    slide: state.world.slide,
    reason: `${event.antagonist}: ${event.title} — ${choice.id}`,
    at: new Date().toISOString(),
  });
  saveState(state);
  console.log(`[CAMPAIGN] Event resolved: ${event.id}/${choice.id} → slide ${state.world.slide}, signal ${state.world.signal}`);
  return getWorldSnapshot();
}

// ---------------------------------------------------------------------------
// World context for Echelon — the narration carries the campaign
// ---------------------------------------------------------------------------

export function buildWorldPromptContext(): { context: string } | null {
  const snap = getWorldSnapshot();
  if (!snap) return null;
  const lines = [
    `WORLD STATE (campaign continuity — weave lightly into narration, never lecture about it):`,
    `- The Slide reads ${snap.slide}/100 — band: ${snap.band.name}.`,
    `- Operator Signal: ${snap.signal}/100${snap.signal < 30 ? " (link degraded — keep guidance shorter, terser)" : ""}.`,
  ];
  if (snap.lastDecision) {
    lines.push(
      `- Most recent operator decision: ${snap.lastDecision.event_id} → ${snap.lastDecision.choice_id}. You remember it; reference it only when genuinely relevant.`
    );
  }
  return { context: lines.join("\n") };
}
