# The Worked Example — a Complete Course, One Spreadsheet

This folder contains the **actual How to Save the World curriculum**: all 96
missions, exactly as the creator authors them. The blank template
(`public/curriculum-template.csv`) shows you the columns; this shows you what
a finished course looks like *in* them — real briefings, drills, story beats,
video descriptions, fog levels, the lot.

- `how-to-save-the-world-lessons.xlsx` — the master file, as edited in
  Excel / Google Sheets
- `how-to-save-the-world-lessons.csv` — the same data as CSV, easier for AI
  tools to read and for humans to diff

## How to use it (human or AI)

If you're building your own course on this engine, don't study the schema —
study a row. Pick a mission (row 2 is Mission 1: Latency) and read it left to
right: the summary teaches, the briefing sets the story, the drills ask for
the learner's own work, the story beat advances the campaign, the video
description grounds the footage in fact. That pattern, 96 times, is the whole
course.

If you're an AI builder: this file is your reference for tone, length, and
how the per-lesson story weave (STORY_GUIDE.md §9–12) looks when it's done
well. Match the *shape*, never the content.

The columns that the engine actually consumes are defined by the import
contract in `src/lib/lesson-import-schema.ts` — author through it, never
around it. Extra columns in the sheet are the creator's working notes; the
importer ignores what it doesn't know.

## Companion documents

- [`STORY_GUIDE.md`](../STORY_GUIDE.md) — the eight world questions and the
  per-lesson weave rules every mission here follows
- [`COURSE_BUILDER_PROMPT.md`](../COURSE_BUILDER_PROMPT.md) — the prompt that
  turns your raw material into rows like these
- [`KERNEL_CHECKLIST.md`](../KERNEL_CHECKLIST.md) — the audit to run before
  you ship
- New to all of this? The site's **Educators Start Here** page
  (`/educators`) walks you in from zero.

## License

The engine is MIT. **This curriculum content is CC BY-NC-SA 4.0** — it's here
as a worked example to learn the shape from. Build your own course with your
own content; don't commercialize this one without permission. See the
repository license files.
