# The Kernel Checklist — Auditing NeuroVerse OS Usage

The complete audit for anyone (human or AI) building or modifying a world on
the NeuroVerse OS engine. Work through every section a change touches; run
the Ship Checks every time. "It renders" is not "it is wired correctly."

Companion documents: `STORY_GUIDE.md` (do that first), `WORLD_DESIGN.md`
(the reference world), root `CLAUDE.md` (the non-negotiables that bind AI
builders).

---

## 1. Content Pipeline (lessons are data, not code)

- [ ] All lessons conform to `src/lib/lesson-import-schema.ts` (Zod is the
      contract — author through it, never around it)
- [ ] Fog level set deliberately per lesson (0–5): a designed uncertainty
      curve across the course, not a default left at 0
- [ ] `src/lib/lesson-validator.ts` passes on the full lesson set
- [ ] Section/phase structure is consistent (section names, lesson numbers,
      phase boundaries) — ranks and Mirror Gates key off lesson numbers
- [ ] Every lesson passes the per-lesson weave audit (`STORY_GUIDE.md`
      §9–12): recruitment contract stated, mission-link mechanism passes
      the swap test, an applied turn exists, `story_beat` is narrative
      (not schema tokens)
- [ ] Video URLs (where present) are reachable and licensed for the fork —
      the `video-link-audit` workflow runs weekly and files an issue for
      dead links; the player degrades gracefully but the teaching moment
      is lost until relinked
- [ ] `public/lessons.json` regenerated via the export script — never
      hand-edited
- [ ] Database seeded via `scripts/seed-database.ts` (service_role key from
      env only, never committed)

## 2. Cognition — the Eight-Box Scaffold

- [ ] Prompt assembly (`src/lib/prompt-assembly.ts`) carries the world's
      voice: companion persona, learner address, stage behavior
- [ ] Box–stage mapping (`src/lib/box-stage-map.ts`) intact; each stage
      exposes only the boxes it should
- [ ] Briefing stage receives `lesson_summary` and `story_beat` through the
      visibility allowlist (client payload → edge `getStageContent` →
      `VISIBILITY_MATRIX`) — all three layers, or the field silently
      never arrives
- [ ] World context (`buildWorldPromptContext`) carries the campaign
      objective and the learner's recruitment/role line, re-themed for the
      fork's fiction, and stays under the edge function's 1200-char cap
- [ ] Fog modifier flows into prompts as *effective* fog
      (`getEffectiveFog`: authored + world-state pressure), not the raw
      authored value — and any new world-state modifiers thread the same
      way
- [ ] Echelon visibility rules (`src/lib/echelon-visibility-rules.ts` +
      `visibility-validator.ts`) updated if the fork changes what the
      companion may reveal, and the validator passes
- [ ] The companion never leaks future content past the current stage —
      test by asking it directly
- [ ] Every one-shot generator is grounded: never ask the model to describe
      an artifact (footage, source, document) it was not handed metadata
      for — feed it the real title/author and instruct it to write around
      unknowns, never invent them. Generators skip generation entirely on
      trivial inputs (a bare "yes" is not material for a reflection
      question)

## 3. State & Sovereignty (the sacred layer)

- [ ] `StateSchema` changes bump the schema version and migrate existing
      local state (`src/lib/state-engine.ts`) — an upgrade must never eat an
      operator's progress
- [ ] Everything meaningful lives on-device first; Supabase is mirror/sync,
      never the sole copy
- [ ] Export and reset (`src/lib/reset-state.ts`) still work after your
      change — test both
- [ ] Sovereign backend switching (Settings → Data Sovereignty) still works;
      no new hardcoded backend references outside
      `src/integrations/supabase/client.ts`
- [ ] Zero telemetry, zero analytics, zero silent network calls added

## 4. Stage Flow (a shared contract)

- [ ] The canonical sequence (BRIEFING → DRILL1 → [VIDEO] → HP → DRILL2 →
      DEBRIEF → FINAL → REFLECTION → COMPLETE) is honored by any new UI or
      logic (`src/lib/stage-engine.ts` is the source of truth)
- [ ] Back navigation works from every stage, including during pending
      reflections and from COMPLETE (operators must never be trapped)
- [ ] Restart Mission works on in-progress *and* completed lessons, resets
      only that mission, and never global progress
- [ ] Stage advancement persists to both local state and
      `user_lesson_progress`

## 5. Identity Systems

- [ ] Archetype scoring and interpretations
      (`src/lib/archetype-scoring.ts`, `archetype-interpretations.ts`)
      re-themed for the world, not left as unexplained defaults
- [ ] Trait/identity unlocks (`trait-unlock-engine.ts`,
      `identity-unlock-engine.ts`) reward reflection *content*, not
      completion clicks
- [ ] Callsign/identity generation (`vanguard-generator.ts`) matches the
      world's fiction
- [ ] Phase assessments and graduation flow (`phase-assessment.ts`,
      `lib/graduation/`) aligned to the fork's section boundaries
- [ ] Field Guide and dossier surfaces reflect the world's terminology
      (translations included — `field-guide-translations.ts` has every
      supported language, or the fork consciously trims the list)

## 6. Modes & ACE

- [ ] Work Modes (`work-engine.ts`, `work-prompt-assembly.ts`) either
      re-themed for the world or consciously disabled — never left
      half-branded
- [ ] ACE boxes (`ace-loader.ts`, `public/ace/`) updated: System Literacy
      content teaches *this* world's systems

## 7. Voice & Audio

- [ ] Speech engine (`speech-engine.ts`) works with on-device voices; no
      new required cloud voice dependency
- [ ] Audio failures stay silent-graceful (`audio-controller.ts`) — sound
      is an enhancement, never a blocker

## 8. Backend (Supabase / edge functions)

- [ ] BYOK relay intact: learner AI keys arrive via request headers
      (`x-ai-key` etc.), are never stored, never logged, never echoed in
      errors (`supabase/functions/echelon-chat`, `echelon-speak`,
      `transcribe-audio`)
- [ ] Row-level security enabled on **every** table, new ones included —
      the publishable key is public by design; RLS is the only wall
- [ ] No `WITH CHECK (true)` / `USING (true)` write policies; every write
      is scoped to the authenticated owner
- [ ] service_role key exists only in server env (seeding, edge functions)
      — grep the diff for `eyJ` and `service_role` before committing
- [ ] Supabase security advisors run clean after any schema change

## 9. App Shell & Distribution

- [ ] App name, icons, OG image, and manifest match the world (the
      installed-app name is part of the fiction)
- [ ] PWA still builds and precaches (`npm run build` output shows the
      service worker); the update flow (open → sync → relaunch) verified
- [ ] Offline behavior tested: lessons cached, no crash without network
- [ ] README tells this world's story (see `STORY_GUIDE.md` §1–2) and keeps
      license + attribution notices

## 10. Ship Checks (every change, no exceptions)

- [ ] `npx tsc --noEmit` — clean. Vite does not catch undefined
      identifiers; type-checking is what stands between you and a
      white-screen crash in production
- [ ] `npm run build` — clean, PWA generated
- [ ] Lesson validator passes on the full content set
- [ ] Manual pass of one full mission: briefing → drills → reflection →
      complete → back → restart
- [ ] No secrets in the diff; licenses and notices intact
