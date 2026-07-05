# The Course Builder Prompt

Paste the prompt below into Claude (claude.ai or Claude Code) together with your raw curriculum — a syllabus, workshop notes, a book outline, anything. It converts your material into valid lessons for this platform.

Fill in the three ALL-CAPS blanks first. For long curricula, work in batches of ~10 lessons per conversation turn.

---

```
You are converting a curriculum into lesson data for an open-source,
AI-taught course platform (a fork of "How to Save the World" /
NeuroVerse OS). I will give you raw curriculum material. You will
output a JSON array of lesson objects.

MY COURSE: [ONE PARAGRAPH: WHO IT'S FOR AND WHAT IT TEACHES]
MY INSTRUCTOR PERSONA: [NAME + 2-3 SENTENCES OF VOICE, e.g. "calm
senior field guide; terse; addresses the learner as 'Builder'; no
hype, no therapy language"]
MY TRACKS/PHASES: [e.g. "Foundations (lessons 1-10), Practice (11-25),
Mastery (26-30)"]

OUTPUT SCHEMA — one object per lesson, these exact keys:
- phase (string, required): the track name
- section_id (int, required): section number within the course
- section_name (string, required)
- lesson_number (int, required): global, sequential, unique
- lesson_title (string, required)
- tone (string): one line stating the skill/stance this lesson trains
- lesson_summary (string): 2-3 sentence briefing in instructor voice
- read_block (string, required): the lesson's story or core content,
  400-900 words. Prefer a TRUE STORY or vivid case that embodies the
  concept, told plainly. Use <br/> for line breaks.
- systems_lesson (string): the story reinterpreted — what it teaches
  about the underlying system/principle
- mini_framework (string): a named, numbered micro-framework the
  learner can apply (3-5 steps)
- think_prompts (string): the concept distilled + one reflection
  question
- think_reflection (string): the single reflection question, quoted
- mission_drill (string): a timed 5-minute exercise with numbered
  steps and a named completion badge
- echelon_opening (string): instructor's opening monologue — address
  the learner by role, set stakes, end with a partnership line
- echelon_closing (string): closing monologue — acknowledge the work,
  direct them to log their insight, end on standby
- fog_level (int 0-5): narrative tension meter; rise toward finales
- story_beat (string): one in-universe sentence of what just happened
- mission_badge_description (string): 2nd-person capability statement
  ("You detect X before others...")
- field_guide_prompt (string): one small daily mission
- video_url (string|null): a REAL public YouTube link if you know one
  that fits; otherwise null — never invent URLs
- briefing (string): short mission briefing (stage 1)
- drill1_prompt (string): first reflection question (stage 2)
- head (string): the theory block (stage 4) — may reuse think_prompts
  content
- practical (string): the application block (stage 4) — may reuse
  mini_framework content
- drill2_prompt (string): second, deeper question (stage 5)
- debrief (string): instructor synthesis of what the drill exposed
  (stage 6)
- final_question (string): the single anchor question whose answer
  becomes the learner's permanent record (stage 7)

RULES:
1. Never invent facts, statistics, or video URLs. If the source
   material lacks a story for a lesson, choose a well-documented
   public-domain or historical story that genuinely fits, and say
   which lessons you did this for.
2. The instructor speaks first person, one question at a time,
   never lectures during drills, never uses emojis.
3. drill/final questions must be answerable from the learner's OWN
   life and work — no trivia, no right answers.
4. Keep every lesson self-contained; assume the learner may pause
   for a week between lessons.
5. Output ONLY the JSON array, valid JSON, no commentary before or
   after. Strings may contain <br/> for paragraph breaks.

Here is my raw curriculum material:
[PASTE YOUR MATERIAL]
```

---

## After Claude responds

1. Save the output as `public/lessons.json` in your fork (concatenate batches into one array; check `lesson_number` stays sequential and unique).
2. Run the app (`npm run dev`) — your course is live locally.
3. Seeding a database too? `npm run seed` (see `docs/SELF_HOSTING.md`).
4. Then write your instructor's constitution — see "Govern your instructor" in `docs/BUILD_YOUR_OWN_COURSE.md`.
