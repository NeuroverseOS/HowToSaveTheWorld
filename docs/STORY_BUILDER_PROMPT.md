# The Story Builder Prompt — Design Your World

A course on this platform isn't content with quizzes — it's a **world** the learner trains inside. How to Save the World runs on the NeuroVerse: a near-future scenario (the fight to keep an AI-driven world decentralized), an instructor (Echelon), an antagonist system (ApexMesh), a tension meter (Fog Levels), ranks, badges, and a story arc that rises across 96 missions.

Your course deserves its own world — a "future scenario" where the skills you teach are the skills that matter. Paste the prompt below into Claude *before* you run the Course Builder Prompt; the world it produces becomes the narrative backbone for every lesson.

**Your world will not — and should not — feel like ours.** The Foxhole mentality fits a decentralization movement; it would be absurd for most courses. The structure stays; the vibe transforms:

- A **customer-service leadership** course might be set in *The Flagship* — a legendary store heading into the hardest season in its history. The instructor is the floor veteran who has seen every meltdown. The antagonist system is *Churn* — the silent force that grows every time a customer leaves unheard. Tension meter: how deep the queue runs.
- A **communications** course might be *The Wire* — a PR crisis unfolding hour by hour. The instructor is the crisis-desk chief. The antagonist is *The Spin* — the narrative that writes itself whenever you don't. Tension meter: news-cycle velocity.

Same missions, drills, reflections, dossier, ranks, and recruitment mechanics underneath. Completely different air.

---

```
You are a narrative systems designer helping me build the story-world
for a mission-based course on the How to Save the World platform
(open-source; an AI instructor guides learners through missions).

MY COURSE TEACHES: [WHAT SKILLS, TO WHOM]
MY LEARNERS' REAL STAKES: [WHY THESE SKILLS MATTER IN THE REAL WORLD
IN THE NEXT 5-20 YEARS]

Interview me first: ask me up to 6 questions, ONE at a time, to
surface (a) the future scenario where my skills are decisive,
(b) what failure of those skills looks like at world scale, and
(c) the emotional register I want (gritty, hopeful, mythic, playful).
Then produce my WORLD BIBLE with exactly these sections:

1. THE SCENARIO — a one-page near-future setting where the skills I
   teach decide outcomes. Grounded in real trends, no magic. Written
   so a skeptical adult nods rather than rolls their eyes.
2. THE STAKES ENGINE — the antagonist. Not a villain-person: a
   SYSTEM or force (like entropy, consolidation, drift, decay) that
   grows stronger whenever the skill is absent. Give it a name and
   three behaviors.
3. THE INSTRUCTOR — name, role metaphor (field instructor / senior
   operator / master craftsperson...), 6 voice rules (how it
   addresses the learner, sentence rhythm, what it never does).
4. THE LEARNER'S ROLE — what the learner is called, why they were
   "recruited," and a 4-step rank ladder with names (novice ->
   graduate) tied to course milestones.
5. THE TENSION METER — a 0-5 scale like Fog Levels: what the world
   feels like at each level, so lessons can escalate.
6. THE ARC — a three-act outline mapping my course's phases to
   story beats: Act I (awakening/skill discovery), Act II (the
   antagonist system escalates), Act III (open confrontation and
   stabilization), plus a finale where training becomes deployment.
7. NAMING KITS — 10 badge-name patterns, 5 ceremony names, and the
   phrase templates for mission openings and closings (modeled on:
   "[Learner-title], listen closely. [story beat]. I'm detecting
   [tension level]... Stay present — we navigate this together." /
   closing on standby).
8. THE CANON RULES — 5 short world-rules the AI instructor must
   never violate (the constitution seed for governance).

Keep everything internally consistent and reusable as copy-paste
context for future lesson-writing sessions.
```

---

## How the pieces fit

1. **Story Builder** (this file) → your World Bible.
2. **Course Builder** (`COURSE_BUILDER_PROMPT.md`) → paste the World Bible at the top when converting your curriculum, and every lesson's story beats, openings, closings, and badges will be written *inside your world*.
3. **World Kit pass** → your World Bible becomes file-ready copy. Paste the Bible plus "The World Map" table from `BUILD_YOUR_OWN_COURSE.md` into your AI with: *"For each surface in this table, write the final content for my world — the lore/dossier page, the bonding ceremony script (matching the shape of `src/data/foxholeProtocol.json`), the instructor's Box 1 voice directive, the landing-page narrative, and the recruitment/share copy. Label each output with its target file."* Then you (or an AI coding assistant working in your fork) drop each piece into place.
4. **Canon** → save the World Bible sections as markdown files in your fork's `neuroverse/canon/`-equivalent directory; they're the design contract your app and instructor implement.
5. **Governance** → Section 8's canon rules become the seed of your instructor's constitution (see `BUILD_YOUR_OWN_COURSE.md`, step 5).

The design principle behind all of it: **the world must make the skill feel decisive.** Learners don't push through 90 missions for information — they push through because the story keeps telling them, truthfully, that someone like them is needed.
