# Build Your Own Course

How to Save the World is not just a course — it is a **course engine**. The curriculum you experienced (96 missions, Echelon, ranks, dossiers) is one payload running on an open platform. You can load your own.

The recipe: **your curriculum + your learners' own AI + your declared rules = a self-running academy that costs you nearly nothing to operate.**

The full creator pipeline, each step powered by a canned prompt you run with Claude:
**Model Builder** ([`MODEL_BUILDER_PROMPT.md`](./MODEL_BUILDER_PROMPT.md), your buckets of thinking, traits, and archetypes) → **Story Builder** ([`STORY_BUILDER_PROMPT.md`](./STORY_BUILDER_PROMPT.md), your world) → **Course Builder** ([`COURSE_BUILDER_PROMPT.md`](./COURSE_BUILDER_PROMPT.md), your lessons) → **Assessment Builder** (part two of the Model Builder file, your diagnostic).

## What you'll end up with

- Your own installable web app teaching your material, mission by mission
- An AI instructor (your fork of Echelon) that every learner powers with *their own* AI key or a local model — you pay for no tokens
- Learner data that stays with learners (browser-first, or a database they own)
- A written constitution governing what your AI instructor may see and do — enforced, not vibes

## Step 1 — Fork the repo

Fork this repository on GitHub. Everything below happens in your fork.

## Step 2 — Write your curriculum into the template

Your entire course is one spreadsheet, one row per lesson. The template with every column explained:

- **Template**: [`public/curriculum-template.csv`](../public/curriculum-template.csv)
- **Column reference**: the import schema at [`src/lib/lesson-import-schema.ts`](../src/lib/lesson-import-schema.ts) is the source of truth

The five required fields per lesson: `phase`, `section_id`, `section_name`, `lesson_number`, `lesson_title`, plus `read_block` (the story/content of the lesson). Everything else is optional but powerful — the mission-stage fields (`briefing`, `drill1_prompt`, `video_url`, `head`, `practical`, `drill2_prompt`, `debrief`, `final_question`) drive the staged mission experience.

### Don't have it in that format? Let Claude build it

This is the shortcut: take your existing curriculum in ANY form — a syllabus, a Google Doc, a pile of workshop notes — open Claude (or Claude Code pointed at your fork), and use the canned prompt in [`docs/COURSE_BUILDER_PROMPT.md`](./COURSE_BUILDER_PROMPT.md). It converts raw curriculum into valid lesson rows, writes the narrative fields in a consistent instructor voice you choose, and outputs `lessons.json` directly.

## Step 3 — Load the lessons

Two paths:

- **Simplest**: replace `public/lessons.json` in your fork with your generated lessons. The app is local-first — this alone makes your course fully playable.
- **With a database** (enables cross-device sync, trait mirroring, cohorts): follow [`docs/SELF_HOSTING.md`](./SELF_HOSTING.md) to create a free Supabase project, push the schema, then `npm run seed` loads whatever is in `public/lessons.json`.

## Step 4 — Make the instructor yours

- **Voice**: the instructor's core voice rules live in `supabase/functions/echelon-chat/index.ts` (Box 1) — rewrite the persona, keep the structure (one question at a time, stage boundaries, first person).
- **Canon**: the `neuroverse/canon/` directory holds the world rules — your ceremony, your instructor identity, your protocol names. Rewrite these documents for your world; they are the design contract your app implements.
- **Stage visibility**: `supabase/functions/_shared/visibility-rules.ts` controls exactly what the AI sees at each lesson stage. This is the platform's built-in governance layer — adjust the matrix, don't delete it.

## Step 5 — Govern your instructor (do not skip this)

An AI instructor without declared rules is just a chatbot with a costume. This platform pairs with [**NeuroVerse Governance**](https://github.com/NeuroverseOS/Neuroverseos-governance) (`@neuroverseos/governance` on npm) — a behavioral governance engine where the rules you declare become a constitution enforced at runtime.

For a course, declare at minimum:

1. **What the instructor may see** — per-stage content visibility (this repo's visibility matrix is your in-app enforcement).
2. **What the instructor may do** — teach only confirmed material, one question at a time, never diagnose/therapize, never save raw chat, never persuade during reflection stages.
3. **What belongs to the learner** — confirmed reflections are the learner's property; the instructor references them only where visibility rules allow; export must always be available.

Start from the governance repo's `policies/` examples, write your instructor's constitution as a rules file in your fork (e.g. `governance/instructor-rules.md`), and wire the guard engine into your edge function if you want hard runtime enforcement. For cohort programs, the governance package's **Radiant** layer can read activity across your community's GitHub/Discord/Notion and measure whether the program is living its declared intent.

Publishing your constitution in the repo — visible to every learner — is the point. Learners should be able to read exactly what their instructor is allowed to do before they connect their AI to it.

## Step 6 — Keep the credit flowing

If your lessons link to other people's videos or writing, fill in `public/video-credits.json` so every teacher gets named and linked. The `/credits` page renders it. This platform's position is simple: pointing to great teachers is a feature — credit them loudly.

## Step 7 — Deploy

Any static host works. With Vercel: import your fork, framework preset **Vite**, defaults for everything else (`vercel.json` already handles SPA routing). Free tier is fine to start. Your only recurring cost is a domain.

## The World Map — where every piece of the story lives

When you build your own world with the [Story Builder](./STORY_BUILDER_PROMPT.md), here is exactly what swaps in from data versus what you re-skin in code. Hand this table plus your story bible to an AI coding assistant and it can re-theme every surface in one pass.

**Swaps automatically (pure data — no code changes):**

| Surface | File |
| --- | --- |
| All missions/lessons (titles, briefings, drills, videos, debriefs) | `public/lessons.json` |
| System Literacy archive (the in-app "how this works" the AI can teach from) | `public/ace/*.json` |
| Foxhole/bonding ceremony script | `src/data/foxholeProtocol.json` |
| Work Mode definitions | `src/data/work_modes.json` |
| Video/teacher credits | `public/video-credits.json` |

**Re-skin in code (your story bible tells you what to write):**

| Surface | File |
| --- | --- |
| Classified lore page (the Vanguard Dossier / origin story) | `src/pages/VanguardLore.tsx` |
| Instructor voice & persona (Box 1) | `supabase/functions/echelon-chat/index.ts` |
| Archetype names, scoring, and assessment scenarios | `src/lib/archetype-scoring.ts`, `src/lib/archetype-interpretations.ts`, `src/components/neuroverse/ArchetypeAssessment.tsx` |
| Rank ladder names and thresholds | `src/lib/state-engine.ts` |
| Landing-page narrative | `src/pages/Index.tsx` |
| Recruitment/share copy | `src/components/neuroverse/TransmissionModal.tsx` |

Everything else — the kernel, stage engine, visibility rules, dossier mechanics, Field Guide, graduations, referral links — is world-agnostic machinery. Your learners get all of it for free the moment your content is in place: their own callsigns, their own dossier, their own classified page telling *your* origin story, their own transmissions recruiting into *your* world.

## License notes

The platform code is MIT — build freely. The How to Save the World curriculum content and NeuroVerse OS narrative universe have their own content license (see `CONTENT_LICENSE.md`) — replace the curriculum and narrative with your own rather than reselling ours.
