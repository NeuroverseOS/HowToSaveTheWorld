# Documentation

Everything written down about **How to Save the World** and the **NeuroVerse OS**
engine it runs on. New here? Start with the [main README](../README.md), then
follow the trail below.

Each doc is grouped by what you're trying to do. You don't need to read them in
order — jump to the section that matches your goal.

---

## 🚀 Start here — run it locally

| Doc | What it covers |
| --- | --- |
| [INSTALLATION.md](./INSTALLATION.md) | Clone, install, and run the app on your machine. |
| [CONFIGURATION.md](./CONFIGURATION.md) | Environment variables and app settings. |
| [SELF_HOSTING.md](./SELF_HOSTING.md) | Point the app at your own Supabase project — a sovereign backend you control. |
| [SUPPORT.md](./SUPPORT.md) | Where to get help and how to ask. |

## 🧠 Understand the platform

| Doc | What it covers |
| --- | --- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | What How to Save the World provides vs. what NeuroVerse OS provides. |
| [HOW_ECHELON_WORKS.md](./HOW_ECHELON_WORKS.md) | The AI teacher: BYOK relay, the prompt system, and why it stays on mission. |
| [KERNEL_ESSAY.md](./KERNEL_ESSAY.md) | The essay — hold an AI tutor to the standards of a great human facilitator, made structural via the Eight-Box Kernel. |
| [WHITEPAPER.md](./WHITEPAPER.md) | The leadership framework and the thesis behind the whole project. |
| [GOVERNANCE.md](./GOVERNANCE.md) | How the project is governed and how decisions get made. |
| [INTEROPERABILITY.md](./INTEROPERABILITY.md) | How the engine talks to other systems and standards. |

## 🛠️ Build a course or world on the engine

The heart of the promise: hand the engine your material and it builds you an
academy. Read the guides first, then use the builder prompts to generate.

| Doc | What it covers |
| --- | --- |
| [BUILD_YOUR_OWN_COURSE.md](./BUILD_YOUR_OWN_COURSE.md) | The end-to-end path from your material to a running course. |
| [STORY_GUIDE.md](./STORY_GUIDE.md) | Every world needs a story before it needs content — the eight questions. |
| [WORLD_DESIGN.md](./WORLD_DESIGN.md) | "The Slide" — designing your world and its consequences. |
| [KERNEL_CHECKLIST.md](./KERNEL_CHECKLIST.md) | Audit checklist — verify a new world is wired into the engine correctly. |
| [STORY_BUILDER_PROMPT.md](./STORY_BUILDER_PROMPT.md) | Prompt to design your world's story. |
| [COURSE_BUILDER_PROMPT.md](./COURSE_BUILDER_PROMPT.md) | Prompt to generate the course curriculum. |
| [MODEL_BUILDER_PROMPT.md](./MODEL_BUILDER_PROMPT.md) | Prompt to build the operator model and assessment. |
| [example-curriculum/](./example-curriculum/) | The worked example — all 96 missions, exactly what the AI is told. |

> Prefer a guided build? The [Governed Course Builder](../.claude/skills/governed-course-builder/SKILL.md)
> Claude skill loads automatically when you use Claude Code in this repo.

## 📐 Engine internals & specifications

For contributors working on the engine itself.

| Doc | What it covers |
| --- | --- |
| [STAGE_ENGINE_SPEC.md](./STAGE_ENGINE_SPEC.md) | The stage flow contract (BRIEFING → … → COMPLETE). |
| [IDENTITY_UNLOCK_ENGINE_SPEC.md](./IDENTITY_UNLOCK_ENGINE_SPEC.md) | How archetype/trait unlocks are computed and revealed. |
| [PROMPT_THROTTLE_MATRIX.md](./PROMPT_THROTTLE_MATRIX.md) | Prompt budgeting and throttle rules across stages. |
| [ARCHITECTURE_SEPARATION.md](./ARCHITECTURE_SEPARATION.md) | How the engine and the Foxhole Protocol are kept separate. |
| [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) | Repository layout, folder by folder. |

## 🔧 Operating & maintaining

| Doc | What it covers |
| --- | --- |
| [ADMIN_SETUP.md](./ADMIN_SETUP.md) | Setting up an admin. |
| [ADMIN_2FA_SETUP.md](./ADMIN_2FA_SETUP.md) | Enabling two-factor auth for admins. |
| [MAINTAINERS.md](./MAINTAINERS.md) | Who maintains the project and how. |
| [RELEASE_NOTES.md](./RELEASE_NOTES.md) | What changed, release by release. |
| [VANGUARD_ONBOARDING_TEST.md](./VANGUARD_ONBOARDING_TEST.md) | Manual test guide for the onboarding flow. |

## 🧩 NeuroVerse OS — engine documentation

The cognitive engine ships in this repo. The [`neuroverse-os/`](./neuroverse-os/)
subfolder holds the engine's own documentation set — architecture, developer
guide, installation, and licensing — written for anyone building **on** NeuroVerse
OS rather than on this specific course. Start with
[neuroverse-os/README.md](./neuroverse-os/README.md).

---

## Repository-root documents

A few standard files live at the repository root, not in `docs/`:

- [README.md](../README.md) — project overview and quick start
- [CONTRIBUTING.md](../CONTRIBUTING.md) — how to contribute
- [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) — community expectations
- [SECURITY.md](../SECURITY.md) — security model and responsible disclosure
- [LICENSE](../LICENSE) — MIT, for all code
- [CONTENT_LICENSE.md](../CONTENT_LICENSE.md) — CC BY-NC-SA 4.0, for curriculum content
- [CHANGELOG.md](../CHANGELOG.md) — notable changes
