# Roadmap

NeuroVerse OS is two things in one repo: a **reusable course engine** and a **flagship world** (*How to Save the World*) that proves it. The through-line of this roadmap is making the first cleanly forkable without slowing the second.

This is a direction document, not a dated commitment. Items move between sections as work lands. Contributions against anything here are welcome — see [CONTRIBUTING.md](../CONTRIBUTING.md).

## Now — shipped / stable

- **Eight-Box Kernel** — stage-gated prompt assembly with a server-side visibility wall; verified in CI by `npm run probe:kernel`.
- **The flagship world** — all 96 missions (Design 30 · Build 36 · Lead 30), Echelon, archetypes, Field Guide, and Work Modes, playable at [howtosavetheworld.info](https://howtosavetheworld.info).
- **Sovereignty layer** — local-first state, bring-your-own AI key, bring-your-own Supabase backend (Settings → Data Sovereignty).
- **Builder pipeline** — the Model/Story/Course/Assessment builder prompts and the Governed Course Builder Claude skill.

## Next — actively wanted

- **Demo assets in the README** — screenshots of the core mission stages and a short walkthrough video, so newcomers "get it" before they clone.
- **Cleaner engine/world seam** — continue extracting reusable kernel code from world-specific content so a fork starts from a truly blank world (tracked in [ARCHITECTURE_SEPARATION.md](./ARCHITECTURE_SEPARATION.md)).
- **A minimal starter world** — a tiny 3–5 mission example course a builder can copy as a skeleton, separate from the full flagship curriculum.
- **Docs pass on mission-count and stage naming** — one canonical vocabulary across every doc.

## Later — on the horizon

- **Engine as its own package** — an eventual physical split so builders can depend on the NeuroVerse OS kernel without vendoring the whole flagship repo.
- **Cohorts & shared worlds** — optional, sovereignty-preserving multi-learner features for creators running a class.
- **More reference worlds** — additional flagship-quality curricula that stress different corners of the engine.

## Exploring — not committed

- Alternative local-model presets for fully offline operation.
- A gallery of community-built worlds.

---

*Have something you want to see here? Open an issue or a discussion. Sovereignty, abundance-not-dark-patterns, and the learner's ownership of the exit are non-negotiable for anything that lands — see [CLAUDE.md](../CLAUDE.md).*
