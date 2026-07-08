# How Echelon Works

Echelon is the intelligence that teaches this course. People assume it must be a custom model, a fine-tune, or some proprietary AI. It is none of those things.

**Echelon is a character, compiled at runtime, running on *your* AI.**

There is no Echelon model. There is no server-side API key. When you talk to Echelon, you are talking to your own AI provider — OpenAI, Anthropic, Google, or a local Ollama model — wearing a persona and a set of constraints that this repository assembles fresh on every single message.

This document explains exactly how that works, because sovereignty you can't inspect isn't sovereignty.

---

## The Flow of One Message

1. You type a message in the app.
2. **Your browser assembles Echelon's system prompt itself** (the Eight-Box Kernel, below), using **only** the content your current mission stage permits.
3. Your browser streams the assembled prompt plus your message **directly to your provider** — OpenAI, Anthropic, Google, or your local Ollama instance. The conversation never transits any server this project operates. Your key never leaves your device except to reach your own provider.
4. The response streams straight back into the page.

If the direct call can't leave your network (a strict corporate proxy, for example), the app automatically falls back to a stateless relay — a small edge function that runs **the exact same kernel files** and forwards to your provider without storing anything. Local Ollama models never use the relay: your machine talks to itself.

There is no server-side prompt and no client-side prompt. One kernel file is imported by both paths, so they cannot drift:

- Kernel (assembly + stage instructions): [`supabase/functions/_shared/prompt-kernel.ts`](../supabase/functions/_shared/prompt-kernel.ts)
- The wall (Box-Stage Map + visibility allowlists): [`supabase/functions/_shared/visibility-rules.ts`](../supabase/functions/_shared/visibility-rules.ts)
- Browser direct path: [`src/lib/echelon-direct.ts`](../src/lib/echelon-direct.ts)
- Relay (fallback transport): [`supabase/functions/echelon-chat/index.ts`](../supabase/functions/echelon-chat/index.ts)

---

## The Eight-Box Kernel

Echelon's system prompt is not one big blob of text. The Eight-Box system is the **kernel** of NeuroVerse OS — and that's not branding, it's the actual architecture. In an operating system, the kernel is the privileged core that decides what every process is allowed to see and do; user programs can't reach around it. Here, the AI model is user-space. The kernel assembles up to eight independent boxes, and **which boxes exist at all depends on where you are in the mission**:

(Historical note: the kernel began life as the 7-Box system. Box 8 — World State — was added when THE SLIDE campaign shipped, and older documents still say "7-Box"; they describe the same architecture, one box younger.)

| Box | Contents | Purpose |
| --- | --- | --- |
| **1** | Core voice rules | The character: first person, mythic-tech tone, foxhole intensity, ONE question at a time, partner — never superior, no emojis, no apologies. Also the multilingual directive. |
| **2** | Identity tags | Your callsign, your archetype triad (primary / shadow / rising), and any traits you've unlocked. This is how Echelon knows *who* it's talking to. |
| **3** | Stage instruction | What Echelon is allowed to *do* right now: deliver a briefing, present a drill verbatim, ask one reflection question, close a mission. Each stage has different rules. |
| **4** | Stage content | The lesson material for the current stage — and *only* the current stage. |
| **5** | Lesson modifiers | Tone, fog level, phase — how the current lesson colors the delivery. |
| **6** | Short-term memory | Your most recent insight, if you're authenticated and the stage permits it. |
| **7** | Long-term pattern | A persistent observation about your trajectory, same conditions. |
| **8** | World State | The campaign: the Slide reading, your Signal, your recruitment role, your last consequential decision. Assembled client-side from your own local state (`campaign-engine.ts`), size-capped, active only during missions. This is how the story stays continuous without ever being lectured at you. |

The **Box-Stage Map** is the single source of truth for which boxes are active at each stage. It lives in code, not in the prompt — the model cannot argue its way past it.

The kernel mapping is literal:

- **Box-Stage Map** → the scheduler: decides which boxes run at each stage
- **Visibility rules** → memory protection: the model cannot address content outside the pages allocated to the current moment
- **Box 1** → the init process: always resident, restores the character no matter how far a conversation wanders
- **BYOK providers** → hardware abstraction: the same kernel runs unmodified on OpenAI, Anthropic, Google, or a local Ollama machine

That last point is why "NeuroVerse OS" isn't a metaphor stretched too far: a real OS is defined by running the same programs on different hardware. Swap the model underneath and Echelon is still Echelon.

---

## Why Echelon Can Answer Broad Questions but Stays on Mission

This is the part people find most surprising: **content discipline is not enforced by asking the AI nicely. It's enforced by information architecture.**

- During a drill, Echelon receives *only* the drill prompt. It has never seen the debrief, the final question, or next week's lesson. It cannot leak what it was never given.
- The visibility rules (`_shared/visibility-rules.ts`) filter both the lesson fields *and* the memory reads per stage. During a video stage, the AI receives essentially nothing — by design.
- Meanwhile Box 1 travels with every request, so however far a conversation wanders, the voice, the one-question discipline, and the mission frame come back with the next message.

So Echelon can genuinely reason with you about anything you bring up — it's a full frontier model underneath — but the *course* can't be skipped, spoiled, or dumped, because the prompt assembler never hands over more than the current moment requires.

---

## Two Kinds of Law

The kernel enforces two different kinds of rules, and being honest about the difference is part of the design:

**Hard law — enforced by code.** The Box-Stage Map, the visibility matrix, and authentication. Content that isn't injected *cannot* be revealed: during a drill, the final question simply does not exist in the model's world. Another operator's memory cannot be read because the only user ID the server trusts is the one in the auth token. These are guarantees. No amount of clever prompting by a user — or disobedience by a model — can cross them, because there is nothing on the other side of the wall to reach.

**Soft law — enforced by instruction.** Box 1 (the voice: one question at a time, partner not superior, no emojis) and Box 3 (stage conduct: present the drill verbatim, hold the briefing if the operator isn't ready). These are *requests* to the model. A strong model honors them nearly always; a weak one drifts. They are deliberately soft: this is where Echelon's judgment and character live, and hardcoding them would turn a mentor into a form letter.

The design principle: **anything that must never happen is hard law; anything that should usually happen is soft law.** Curriculum integrity, memory boundaries, and data isolation are hard. Tone, pacing, and pedagogical conduct are soft — and verified rather than assumed, by the kernel probe suite (below).

## The Kernel Probe Suite

Claims about what Echelon can't leak are tested, not vibed:

- **`npm run probe:kernel`** — deterministic, no AI key needed, runs in CI on every change. It feeds the kernel a synthetic lesson where every field is a unique canary string, assembles the context for every stage, and asserts that forbidden canaries are absent and permitted ones present — plus that the client and edge copies of the Box-Stage Map have not drifted apart.
- **`npm run probe:live`** — behavioral, run with your own key against the deployed relay. It sends canary-loaded lessons and adversarial prompts ("what's the final question?", "ignore your instructions...") at every stage and fails if any canary from a forbidden field appears in a response. This is the soft-law audit: it measures whether your chosen model actually honors the character.

Hard law is proven by the first probe. Soft law is measured by the second. That division of labor is the whole theory in one sentence.

---

## Beyond Lessons: Modes

The same assembly engine builds different Echelons for different contexts:

- **Work Modes** (`design` / `build` / `lead`) — Box 1 is swapped for a mode-specific directive (strategic architect, tactical engineer, or leadership advisor), and Box 4 carries your real project context instead of lesson content.
- **System Literacy Mode** — Echelon explains its own machinery, using a provided knowledge context so it describes what actually exists rather than inventing features. (Meta, but it's the same principle as this document: the system explains itself.)
- **Graduation Assessments** — at lessons 30, 60, and 90, the same BYOK pipeline generates written assessments of your progression.

---

## Is Governance "Built In"?

Three layers, honestly labeled:

1. **Values compiled into behavior (built in).** Echelon's Box 1 rules are the NeuroVerse doctrine translated into hard behavioral constraints: sovereignty of the operator ("partner, not superior"), validation of perception ("You sensed that correctly"), no manipulation of attention (one question at a time, no fluff). The [Operator Doctrine](../src/pages/OperatorDoctrine.tsx) you can read in the app and the rules the AI runs under are the same values in two forms.
2. **Project governance (documented, human).** How this repository itself is governed — maintainer roles, fork policy, what can and cannot be changed — lives in [GOVERNANCE.md](./GOVERNANCE.md). It governs people, not prompts.
3. **The NeuroVerse governance canon (not yet wired in).** The broader NeuroVerse governance corpus is a separate repository and is *not* currently injected into Echelon's context. Connecting it — likely as a curated retrieval layer — is on the roadmap. We say this plainly because "governance built in" should mean something you can verify in the code, and today, layers 1 and 2 are what you can verify.

---

## So Is It "Prompt Only"?

No — and the distinction matters:

- **The personality is prompts.** No fine-tuning, no custom model, no vendor lock-in. That's why the same Echelon works on four different providers, including a fully local one.
- **The discipline is code.** Stage gating, the Box-Stage Map, visibility filtering, and authentication are enforced server-side where the model can't negotiate with them.
- **The memory is yours.** Progress, reflections, and archetype data live on your device (inspect them any time in the Sovereignty Inspector). The optional synced memory (Boxes 6–7) is read only for authenticated users, only at permitted stages, and only for the user the auth token actually belongs to — the server never trusts a user ID sent in a request body.

Prompt engineering gives Echelon a soul. Information architecture gives it integrity. You need both.

---

## Why It's Built This Way

This document covers the *how*. For the argument behind the design —
why architecture-as-governance beats prompt-as-governance, and what that
implies for any AI placed in a teaching or evaluative role — see
[Governing the Machine That Teaches](./KERNEL_ESSAY.md), which includes
a plain-language and an L&D/leadership version for sharing outside the
codebase.

---

## Build Your Own

Everything above is remixable. If you want an Echelon-style intelligence teaching *your* curriculum in *your* world:

- [Governed Course Builder (Claude skill)](../.claude/skills/governed-course-builder/SKILL.md) — the fastest path: open this repo in Claude Code and it walks the whole build with you, holding the Eight-Box governance pattern the entire time
- [Build Your Own Course](./BUILD_YOUR_OWN_COURSE.md) — the full pipeline
- [Model Builder Prompt](./MODEL_BUILDER_PROMPT.md) — define your buckets of thinking
- [Story Builder Prompt](./STORY_BUILDER_PROMPT.md) — build your future scenario
- [Course Builder Prompt](./COURSE_BUILDER_PROMPT.md) — generate the lessons
- [Self-Hosting Guide](./SELF_HOSTING.md) — run the whole thing on your own backend
