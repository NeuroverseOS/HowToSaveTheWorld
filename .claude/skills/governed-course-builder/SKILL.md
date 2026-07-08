---
name: governed-course-builder
description: >-
  Turn a body of knowledge — expertise, IP, a curriculum, a craft — into a
  governed AI-taught course, and understand the architecture that makes an AI
  tutor trustworthy. Two layers: (1) the transferable governed-context-boundary
  pattern (the Eight-Box Kernel) for designing any AI teacher, and (2) the
  concrete build pipeline for the NeuroVerse OS / How to Save the World engine.
  Use when someone wants to build an AI course or tutor, turn their own material
  into AI-driven lessons, design or evaluate an AI teacher, author curriculum on
  this engine, or apply the governance pattern to another AI teaching system.
---

# Governed Course Builder

This skill does two things, and you should be clear with the person about
which one they want:

- **Layer 1 — the pattern.** How to govern an AI that teaches, independent
  of any engine: the governed-context-boundary idea and the Eight-Box
  Kernel. This is design thinking they can apply anywhere.
- **Layer 2 — the build.** How to turn their material into an actual
  running course on the NeuroVerse OS engine in this repository.

Most people arrive wanting Layer 2 ("help me build my course") but need
Layer 1 first, because a course built without the governance idea in mind
becomes a pile of content, not a taught experience. Lead with enough of
Layer 1 to make the build decisions obvious, then build.

All paths below are relative to the repository root, and are meant to be
**read on demand** — do not paste their full contents up front. Open a
file when the step you're on needs it.

---

## Layer 1 — The pattern (govern what the model may know)

The one idea under everything: **the entity that decides what a model may
know should not be the model.** An AI tutor is trustworthy not because you
told it to behave, but because at every moment it was only handed the
information that moment warranted — decided in advance, in code, outside
the model. Governance is not what you ask the model to do; it is what the
model is structurally incapable of doing.

Concretely, everything a tutor could know is split into eight independent
categories (the **Eight-Box Kernel**), and a stage-indexed table decides
which are active at each step:

1. **Core Rules** — voice, character, conduct. Always on.
2. **Identity** — who the learner is. Present only when relevant.
3. **Stage Instruction** — the task for this exact step.
4. **Stage Content** — the material for this step, delivered as authored.
5. **Modifiers** — tone/difficulty. Adjusts the room, not the substance.
6. **Short-Term Memory** — what the learner just said.
7. **Long-Term Pattern** — the deep read of their growth. Reflection
   stages only — never mid-drill.
8. **World State** — the story/stakes running underneath.

The five laws to hold any design to:

1. Authority must precede intelligence (decide before the model reasons).
2. Information is granted by stage, not by possibility (deny-by-default).
3. Culture must exist as environment, not content (always-on, structural).
4. Reflection must be separated from performance.
5. Governance is defined by impossibility, not intention.

**Go deeper only when needed:**
- The full argument and where this sits vs. RAG / least privilege / state
  machines: [`docs/KERNEL_ESSAY.md`](../../../docs/KERNEL_ESSAY.md)
- How it's actually enforced in this engine (the real stage-to-box table,
  hard law vs. soft law, the probe suite):
  [`docs/HOW_ECHELON_WORKS.md`](../../../docs/HOW_ECHELON_WORKS.md)

If the person only wants the pattern (they're designing for a different
system), stay in Layer 1 and use the essay as your source. If they want to
build here, carry the pattern into Layer 2 — especially laws 3 and 4,
which the build steps below operationalize.

---

## Layer 2 — The build pipeline (this engine)

**Before anything, read the rules of engagement:**
[`CLAUDE.md`](../../../CLAUDE.md). These are non-negotiable — sovereignty
(on-device, no telemetry, BYOK keys never stored), lessons-are-data,
author-through-the-schema, and the Builder's Audit. Do not skip them.

Then work these steps in order. Each names the file to open when you reach
it. **Do not generate lessons before the story and model exist** — a world
with no winter produces a reading list, not a campaign.

**Step 1 — The Story Audit (do this first, always).**
Open [`docs/STORY_GUIDE.md`](../../../docs/STORY_GUIDE.md). Interview the
creator until they can answer its eight world questions (the trail, the
winter, the named adversaries, the companion, the stakes, the
consequences, the reports, the destination). If they can't yet, your job
is the interview — not generating content.

**Step 2 — The thinking model.**
Open [`docs/MODEL_BUILDER_PROMPT.md`](../../../docs/MODEL_BUILDER_PROMPT.md).
Define the buckets of thinking the course teaches — the cognitive skills,
in the creator's own domain. This becomes the spine the lessons hang on.

**Step 3 — The world / story.**
Open [`docs/STORY_BUILDER_PROMPT.md`](../../../docs/STORY_BUILDER_PROMPT.md).
Build the future scenario and the campaign the learner is recruited into —
the layer that carries culture (Box 8 from Layer 1).

**Step 4 — Author the lessons.**
Open [`docs/COURSE_BUILDER_PROMPT.md`](../../../docs/COURSE_BUILDER_PROMPT.md)
for the generation method, and study the shape of a real row in
[`docs/example-curriculum/README.md`](../../../docs/example-curriculum/README.md)
(the worked course is the `.xlsx`/`.csv` beside it — read a row, not the
schema). Author **through the contract**, never around it:
[`src/lib/lesson-import-schema.ts`](../../../src/lib/lesson-import-schema.ts)
is the source of truth for columns; the blank template is
[`public/curriculum-template.csv`](../../../public/curriculum-template.csv).
Match the *shape* of the example, never its content (its curriculum is
CC BY-NC-SA — a fork brings its own).

Per-lesson, honor the weave rules in `STORY_GUIDE.md` §9–12: the
recruitment contract is stated, the briefing names a mission-link
mechanism that survives the swap test, the learner runs each framework
against their own real work, and the story beat is narrative — not schema
tokens. This is where Layer 1's laws 3 and 4 become concrete: culture
lives in the world/voice (not a values line), and reflective depth is
reserved for reflection stages.

**Step 5 — Audit before shipping.**
Walk [`docs/KERNEL_CHECKLIST.md`](../../../docs/KERNEL_CHECKLIST.md) item
by item for every subsystem the new course touches, then run the ship
checks it lists (`npx tsc --noEmit`, `npm run build`, the lesson
validator, one full manual mission pass). "It renders" is not "it is
wired correctly."

For the end-to-end narrative version of this pipeline, including
self-hosting, see
[`docs/BUILD_YOUR_OWN_COURSE.md`](../../../docs/BUILD_YOUR_OWN_COURSE.md)
and [`docs/SELF_HOSTING.md`](../../../docs/SELF_HOSTING.md).

---

## How to work

- **Interview before you generate.** The most common failure on this
  engine is a rich world bible over generic lessons. If the story or model
  isn't ready, keep interviewing — that *is* the work.
- **Content is data, not code.** Author through the schema and validator;
  never hand-edit generated artifacts like `public/lessons.json`.
- **Match the codebase's voice** where the fiction touches the interface
  (operators, missions, briefings, dossiers) — the fiction is part of the
  UX. For a *different* world, re-theme deliberately; don't leave this
  world's terms as unexplained defaults.
- **Never trade away the non-negotiables** in `CLAUDE.md` for convenience:
  sovereignty, the learner's exit (export/reset/self-host), no dark
  patterns, licenses intact, RLS on every table, verify before shipping.

## When this is not the skill

- Pure app/engine bug-fixing or feature work unrelated to authoring a
  course — work the codebase directly.
- Someone who only wants to *understand* the governance idea and read the
  essay — stay in Layer 1; you don't need the build pipeline.
