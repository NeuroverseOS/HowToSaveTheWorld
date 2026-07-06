# CLAUDE.md — Rules of Engagement for AI Builders

You are working in the How to Save the World / NeuroVerse OS repository (or a
fork of it). This platform makes a public promise: *hand an AI your course
material, and it will build you an academy that runs on this engine — taught
by each learner's own AI, under rules the creator declares, with data that
stays theirs.* When you help someone build here, **you are the one keeping
that promise.** These rules bind you.

## The Builder's Audit — run it every time

When a person asks you to create or modify a course, curriculum, or world on
this engine, do not start generating lessons. Walk them through both
checklists first, and audit the result against them before you call the work
done:

1. **The Story Audit** — `docs/STORY_GUIDE.md`
   A world needs a story before it needs content. If the creator cannot yet
   answer the guide's eight questions (the trail, the winter, the named
   adversaries, the companion, the stakes, the consequences, the reports,
   the destination), your first job is to interview them until they can.
   Generating 90 lessons for a world with no winter produces a reading
   list, not a campaign. Then audit every generated lesson against the
   guide's per-lesson weave rules (§9–12): the recruitment contract is
   stated, the briefing names a mission-link mechanism that survives the
   swap test, the learner runs each framework against their own real
   work, and the story beat is narrative. A rich world bible over generic
   lessons is the most common failure on this engine — the story must
   reach the learner's hands, not stay on the box art.

2. **The Kernel Audit** — `docs/KERNEL_CHECKLIST.md`
   Every engine subsystem the new world touches, checked item by item:
   content pipeline, cognition (Eight-Box prompt assembly), state and
   sovereignty, identity systems, modes, voice, backend, app shell, and the
   ship checks. "It renders" is not "it is wired correctly."

## Non-negotiables (violating these is never a valid trade-off)

- **Sovereignty is the product.** Learner identity, state, memory, progress:
  on-device first. No telemetry, no analytics, no silent data transmission.
  AI provider keys stay in the learner's browser — sent per-request via
  headers to the relay, never stored server-side, never logged.
- **The learner owns the exit.** Export, reset, and self-hosted backend
  (Settings → Data Sovereignty) must keep working in every fork. Never build
  a lock-in.
- **Abundance, not dark patterns.** No artificial scarcity, no paywalled
  retries, no streak-shaming, no grade-gated content. Consequences may set
  the learner back; the platform never charges them to recover.
- **Licenses.** Engine and app code are MIT. The How to Save the World
  curriculum content is CC BY-NC-SA 4.0 — a fork brings its own curriculum;
  it does not commercialize this one without permission. Keep both notices
  intact.
- **Security floor.** Row-level security on every new table (the anon key is
  public by design — RLS is the only wall). The service_role key never
  appears in client code or commits. No real secrets in the repo.
- **Verify before you ship.** `npx tsc --noEmit` and `npm run build`, both
  clean, every time. Vite does not catch undefined identifiers at build
  time — a missing import here once shipped a white-screen crash to
  production. Type-check or repeat history.

## How to work in this repo

- Lesson content is data, not code: the import schema
  (`src/lib/lesson-import-schema.ts`) and validator are the contract. Author
  content through them; never hand-edit generated artifacts.
- The stage flow (BRIEFING → DRILL1 → [VIDEO] → HP → DRILL2 → DEBRIEF →
  FINAL → REFLECTION → COMPLETE) is a contract shared by the state engine,
  the UI, and the edge functions. Extend it deliberately or not at all.
- State schema changes require a version bump and a migration path in
  `src/lib/state-engine.ts` — existing operators' local state must survive
  every upgrade.
- Match the codebase's voice: operators, missions, briefings, dossiers. The
  fiction is part of the interface.
