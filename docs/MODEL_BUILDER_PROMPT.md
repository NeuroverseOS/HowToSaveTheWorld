# The Model Builder & Assessment Builder

Every great course on this platform stands on a **thinking model**: a small set of "buckets" of thinking that organize every skill, lesson, trait, and archetype. How to Save the World runs on the Collective Vanguard Model — three buckets (Future Foresight, Narrative Dynamics, Shared Prosperity) that became the three tracks (Design, Build, Lead). Your course needs its own.

This file contains the extracted formulas from How to Save the World, then two prompts: one that builds a creator's thinking model, and one that builds their diagnostic assessment. Run them in order. Together with the Story Builder and Course Builder, the full creator pipeline is:

**1. Model Builder** (this file) → **2. Story Builder** (`STORY_BUILDER_PROMPT.md`) → **3. Course Builder** (`COURSE_BUILDER_PROMPT.md`) → **4. Assessment Builder** (this file, part two).

---

## The Formulas (how the original is actually built)

**The Bucket Formula.** 2–4 buckets, each answering a *different fundamental question* — never overlapping skill lists. HTSTW's three: *How do I see systems?* (Design), *How are systems built?* (Build), *How do I move humans?* (Lead). A good bucket test: a skill should obviously belong to exactly one bucket.

**The Pairwise Synthesis.** The signature move: every PAIR of buckets produces an emergent outcome that neither produces alone. In HTSTW: Foresight+Narrative=Inspiration, Narrative+Prosperity=Trust, Prosperity+Foresight=Hope. Three buckets → three pairs → three outcomes. This is what makes a model feel like a *model* instead of a syllabus.

**The Skill Ladder.** Each bucket decomposes into ~8–12 teachable skills, ordered from perception → mechanics → application (HTSTW: Latency → Feedback Loops → Strategic Distillation). One skill = one lesson.

**The Trait Formula.** 2–4 cognitive traits per bucket (HTSTW has 9 total). Each trait = **3 subskills + 1 shadow + 1 superpower**. Subskills unlock through demonstrated reflection (conservatively judged by AI); the shadow auto-reveals after all 3 subskills; the superpower reveals after subskills + shadow. Completion math: subskills 60%, shadow 20%, superpower 20%.

**The Archetype Formula.** 2–3 learner archetypes per bucket plus generalists (HTSTW has 9: Watchtower, Weaver, Veil, Operator, Engine, Lumen, Cipher, Drift, Chronicle). Each archetype has a defined **polarity opposite**. Results come as a triad: Primary / Shadow / Rising.

**The Assessment Formula** (from the working 12-scenario implementation):
1. **Scenarios, never self-ratings.** Each question is a concrete situation ("your team's project is failing publicly...") with 3–4 responses. People can't game a scenario the way they game "rate your leadership 1–5."
2. **Weighted options.** Every response option carries score weights toward one or more archetypes.
3. **Coverage math.** ~12 scenarios so each archetype meaningfully surfaces multiple times across different contexts.
4. **The triad calculation.** Primary = highest total. **Rising = the archetype with the strongest *late-test momentum*** (score in the final third vs. early answers — it captures where the person is growing, not just where they are). **Shadow = the polarity opposite of Primary** (falls back to Rising if the opposite never scored).
5. **The reveal is a ceremony, not a report.** Names, narrative, and meaning — no percentages, no grades.

---

## PROMPT A — The Thinking Model Builder

```
You are a learning-model designer. I'm building a mission-based course
on the How to Save the World open-source platform, and I need my
THINKING MODEL — the framework everything else hangs on.

MY COURSE TEACHES: [WHAT, TO WHOM]
MY LEARNERS SUCCEED WHEN: [WHAT THEY CAN DO AFTERWARD]

Interview me first: up to 5 questions, ONE at a time, to surface the
distinct modes of thinking my field demands. Then produce MY MODEL:

1. THE BUCKETS — 2 or 3 buckets of thinking (4 only if truly
   necessary). Each: a name, the fundamental question it answers,
   and a one-line description. Test: every skill I teach must belong
   obviously to exactly one bucket. Buckets must be MODES OF THINKING
   (seeing / building / moving people), not topics.
2. THE PAIRWISE SYNTHESIS — for every pair of buckets, name the
   emergent outcome the pair produces together (an emotional or
   capability state, one word or two). Explain each in 2 sentences.
   This is the model's signature — make it true, not cute.
3. THE SKILL LADDERS — 8-12 skills per bucket, ordered from
   perception skills → mechanics → applied mastery. One line each.
   These become my lessons.
4. THE TRAITS — 2-4 cognitive traits per bucket (6-9 total). Each:
   name, one-line definition, exactly 3 observable subskills, 1
   shadow (the trait's failure mode when overused — honest, not
   flattering), 1 superpower (the trait fully integrated).
5. THE ARCHETYPES — 6-9 learner archetypes with evocative names
   fitting my course's world. Each: which bucket(s) it leans on,
   2-sentence portrait, and its POLARITY OPPOSITE from the same set
   (every archetype must have exactly one opposite; opposites are
   mutual).
6. THE MODEL ONE-PAGER — the whole model restated on one page, the
   way a whitepaper would present it.

Output as clean markdown. Do not invent research citations.
```

---

## PROMPT B — The Assessment Builder

Run this AFTER Prompt A, in the same conversation or with the Model pasted in.

```
Using MY MODEL above (buckets, traits, archetypes with polarity
opposites), build my diagnostic assessment following the proven
formula from the How to Save the World platform:

1. Write 12 SCENARIO questions. Each: a concrete, vivid situation
   from my course's real-world domain (2-3 sentences, second person,
   present tense), plus 3-4 response options. Options must all be
   reasonable — no obviously "right" answer — and each maps to
   score weights for 1-2 archetypes (weight 2 for a strong signal,
   1 for a lean). Every archetype must receive meaningful scoring
   opportunities in at least 4 different scenarios, spread across
   early, middle, and late positions.
2. SCORING SPEC — output a JSON block: for each scenario, each
   option's archetype weights. Then the triad rules:
   - PRIMARY: highest total score.
   - RISING: strongest score in the final third of the test,
     excluding Primary (growth signal, not current identity).
   - SHADOW: the polarity opposite of Primary (fallback: Rising).
3. THE REVEAL SCRIPTS — for each archetype: a 60-90 word Primary
   reveal (ceremonial, second person, in my course's narrative
   voice — names what they see that others miss), a 30-word Shadow
   line (compassionate but honest), and a 30-word Rising line
   (an invitation, not a verdict).
4. VALIDATION PASS — check your own work: does any archetype appear
   in fewer than 4 scenarios? Does any scenario have a clearly
   "correct" option? Is every polarity pair mutual? Fix and state
   what you fixed.

Output as clean markdown with the JSON scoring block fenced.
```

---

## Wiring it into the app

The assessment lives in `src/lib/archetype-scoring.ts` and the scenario data it reads — replace the archetype keys, polarity map, scenario weights, and reveal narratives with your generated versions, keeping the scoring functions intact (they already implement the triad rules above). Trait definitions live in `src/lib/identity-system.ts` (`TRAIT_MAP`) — same shape: 3 subskills, shadow, superpower. Your buckets become the `phase` values in your curriculum spreadsheet, and your pairwise synthesis belongs on your landing page — it's the heart of your pitch, just as it was for ours.
