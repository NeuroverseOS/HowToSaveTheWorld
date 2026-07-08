#!/usr/bin/env python3
"""Render the curriculum spreadsheet as readable Markdown, one file per phase.

The worked course lives as a spreadsheet (docs/example-curriculum/
how-to-save-the-world-lessons.xlsx / .csv). GitHub only offers those as a
download or an unreadable 43-column table, which undercuts the whole point
of publishing it: that anyone can *see* exactly what the AI is told. This
script renders the content fields of every mission as scrollable, searchable
Markdown — split into the course's three phases (Design / Build / Lead) so
each page renders comfortably on GitHub — committed beside the source.

Regenerate after editing the CSV:
    python3 scripts/curriculum-to-markdown.py
"""

import csv
import re
from pathlib import Path

SRC = Path("docs/example-curriculum/how-to-save-the-world-lessons.csv")
OUTDIR = Path("docs/example-curriculum")
PHASES = ["Design", "Build", "Lead"]

# The content the AI and the learner actually meet, in the order a mission
# unfolds. (label, column). Pure bookkeeping columns are left out and named
# in the header note; the full 43-column source is the xlsx/csv.
FIELDS = [
    ("Summary", "Lesson Summary (Short)"),
    ("Echelon — opening monologue", "Echelon Opening Monologue"),
    ("Story beat (narrative)", "Story Beat (Narrative)"),
    ("Story beat (in-universe)", "Story Beat (In-Universe)"),
    ("READ — the concept", "READ Block"),
    ("Systems lesson", "Systems Lesson"),
    ("Mini framework", "Mini Framework"),
    ("THINK prompts", "THINK Prompts"),
    ("Think reflection", "Think Reflection"),
    ("DO — mission drill", "DO / Mission Drill"),
    ("Drill · real-world option", "MissionDrill_OptionA_RealWorld"),
    ("Drill · simulation option", "MissionDrill_OptionB_Simulation"),
    ("Drill · field-guide insight", "MissionDrill_FieldGuideInsight"),
    ("Video", "Video Links"),
    ("Video — what the footage is", "Video Description"),
    ("Field Guide entry prompt", "Field Guide Entry Prompt"),
    ("Final reflection", "Reflection"),
    ("Technical level-up", "Technical Level Up"),
    ("AI coaching hooks", "AI Coaching Hooks"),
    ("Archetype tie-in", "Archetype Tie-In"),
    ("NPC cameo", "NPC Cameo"),
    ("NPC dialogue", "NPC Dialogue Snippet"),
    ("Echelon — closing line", "Echelon Closing Line"),
    ("Mission badge", "Mission Badge / Achievement"),
    ("Badge description", "Mission Badge Description"),
]

OMITTED = [
    "Data Tags", "User-Specific Variables", "Lesson UI Pattern",
    "Audio Script (Short)", "Optional Video Script", "Required Inputs",
    "Expected Outputs", "Memory Compression Notes",
    "Dashboard/Diagram Guidance", "Field Guide Field(s) to Update",
]


def clean(v) -> str:
    return (v or "").strip()


def lesson_no(v: str) -> str:
    v = clean(v)
    return v[:-2] if v.endswith(".0") else v


def anchor(n: str) -> str:
    return "mission-" + re.sub(r"[^0-9a-zA-Z]", "", n).lower()


def block(label: str, value) -> str:
    value = clean(value)
    if not value:
        return ""
    if label.startswith("Video") and value.startswith("http"):
        first = value.split()[0]
        return f"**{label}:** [{first}]({first})\n"
    body = "\n".join("> " + ln if ln.strip() else ">" for ln in value.splitlines())
    return f"**{label}:**\n\n{body}\n"


def slugfile(phase: str) -> Path:
    return OUTDIR / f"how-to-save-the-world-lessons-{phase.lower()}.md"


def render_phase(phase: str, rows: list) -> None:
    out = [f"# How to Save the World — {phase} phase (readable curriculum)\n"]
    out.append(
        "The human-readable rendering of the worked course — every mission "
        f"in the **{phase}** phase, laid out on screen so you can read exactly "
        "what the AI is told without downloading anything. Generated from the "
        "source spreadsheet "
        "([`.xlsx`](./how-to-save-the-world-lessons.xlsx) · "
        "[`.csv`](./how-to-save-the-world-lessons.csv)) by "
        "[`scripts/curriculum-to-markdown.py`](../../scripts/curriculum-to-markdown.py); "
        "the spreadsheet is the source of truth.\n"
    )
    others = " · ".join(
        f"[{p}](./{slugfile(p).name})" for p in PHASES if p != phase
    )
    out.append(f"**Other phases:** {others}\n")
    out.append(
        "> Want to build a course like this? This repo ships a Claude skill — "
        "[Governed Course Builder](../../.claude/skills/governed-course-builder/SKILL.md) "
        "— that walks the whole build with you. The engine consumes the "
        "columns defined by `src/lib/lesson-import-schema.ts`; a few purely "
        "operational columns are omitted here for readability ("
        + ", ".join(OMITTED)
        + ") and remain in the spreadsheet. Content licensed CC BY-NC-SA 4.0.\n"
    )

    out.append("## Missions\n")
    for row in rows:
        n = lesson_no(row.get("Lesson #"))
        title = clean(row.get("Lesson Title"))
        section = clean(row.get("Section"))
        out.append(f"- [{n}. {title}](#{anchor(n + '-' + title)}) — *{section}*")
    out.append("")

    for row in rows:
        n = lesson_no(row.get("Lesson #"))
        title = clean(row.get("Lesson Title"))
        out.append(f'<a id="{anchor(n + "-" + title)}"></a>')
        out.append(f"## Mission {n} — {title}\n")
        meta = []
        for label, col in [
            ("Section", "Section"), ("Tone", "Tone"),
            ("Fog", "Fog Level (0-5)"), ("Signal", "Mission Signal"),
            ("Difficulty", "Difficulty Level"),
        ]:
            v = clean(row.get(col))
            if v:
                meta.append(f"**{label}:** {v}")
        if meta:
            out.append(" · ".join(meta) + "\n")
        for label, col in FIELDS:
            b = block(label, row.get(col, ""))
            if b:
                out.append(b)
        out.append("---\n")

    path = slugfile(phase)
    path.write_text("\n".join(out), encoding="utf-8")
    print(f"Wrote {path} — {len(rows)} missions, {path.stat().st_size/1024:.0f} KB")


def main() -> None:
    with SRC.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    for phase in PHASES:
        render_phase(phase, [r for r in rows if clean(r.get("Phase")) == phase])


if __name__ == "__main__":
    main()
