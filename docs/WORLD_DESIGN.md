# THE SLIDE — World & Consequence Design

**Status:** Design proposal (v1) — no code yet. React, argue, cut, approve.
**Author:** Kirsten Bischoff, with Claude
**Purpose:** Give How to Save the World its Oregon Trail teeth — scarcity, events,
trade-offs, and a world that remembers what you did — without gamifying the
pedagogy into a points farm.

---

## 1. The Premise: Entropy Pulls Toward Centralization

The Oregon Trail had winter. We have **The Slide**.

The Slide is the drift toward a centralized digital future: a world where
nobody has autonomy or privacy and power pools in the hands of a few. The
core thesis of the game world — and the core lesson of the curriculum — is:

> **Centralization is the default. It happens when nobody fights it.
> Decentralization must be actively maintained, mission after mission.**

Mechanically: the world has a meter, and if the operator does nothing, it
moves in the wrong direction on its own. Every mission is a chance to push
back. That single rule turns 90 lessons from a reading list into a campaign.

The philosophical axis underneath every mechanic is **scarcity vs. abundance
thinking**. Every antagonist in this world runs on scarcity logic: *"there
isn't enough safety / trust / compute / competence to go around — let us
hold it for you."* Every operator victory is an act of abundance: opening,
sharing, forking, teaching, self-custody. The game must reward abundance
moves structurally, not just narratively — see §5 and §6.

---

## 2. The World State

Two numbers, one derived. All stored in the existing local-first State Engine
(`src/lib/state-engine.ts`) — sovereign, on-device, exportable, like
everything else.

### 2.1 The Slide (world meter, 0–100)

- Global centralization index. **Rises passively** by a small amount per
  mission (entropy tick). Rises sharply when the operator takes convenience
  bargains (§4). **Falls** when missions are completed with strong
  reflections, when anomaly events are resolved the hard way, and at phase
  gates.
- Bands, used everywhere in narration and UI:
  - **0–25 · Open Sky** — the decentralized web is winning
  - **26–50 · Overcast** — consolidation is normalizing
  - **51–75 · The Slide** — exit costs rising, alternatives disappearing
  - **76–100 · Locktown** — the centralized future, functionally irreversible
- The Slide is the campaign clock: *reach the end of the trail before winter.*

### 2.2 Signal (personal resource)

- The operator's clarity, energy, and autonomy — the food-and-oxen analog,
  with one abundance-thinking twist: **Signal is not zero-sum.** It is spent
  by rushing, skipping reflection, and taking convenience bargains; it is
  **generated** by reflection, teaching-back (debrief quality), and honest
  drills. You can always make more — by doing the work. Scarcity of Signal
  is always self-inflicted; the game never sells it back to you.
- Low Signal has consequences: higher effective fog, Echelon's guidance gets
  shorter and harder to parse (in-fiction: your link is degrading), and some
  event choices lock.

### 2.3 Fog becomes derived

Fog Level already exists end-to-end (authored per lesson 0–5, stored in
`state.fog`, injected into Echelon's prompt assembly). It stays — but its
*effective* value becomes:

```
effective_fog = lesson.fog_level (authored base)
              + slide_modifier   (world is darkening)
              + signal_modifier  (your own link is degrading)
```

The world state thereby becomes something the operator *feels* in every
conversation, because Echelon literally behaves differently. No new AI
plumbing needed — `prompt-assembly.ts` already accepts fog as a modifier.

---

## 3. The Antagonists: Name the Enemy

Fictional institutions, each personifying one real centralization vector and
one flavor of scarcity logic. Echelon can quote them, warn about them, and
voice them during events. They never appear as cartoon villains — they appear
as *reasonable offers*.

| Name | Vector | Scarcity pitch | Voice |
|---|---|---|---|
| **Meridian Trust** | Identity & custody | "Keys get lost. Let us hold everything, forever." | Warm, fiduciary, immaculate |
| **The Ministry of Convenience** | Exit costs & defaults | "You have better things to do than manage your own systems." | Cheerful, frictionless, always one-click |
| **Aperture** | Surveillance & data | "Visibility is safety. What do you have to hide?" | Calm, clinical, omnipresent |
| **The Custodians** | AI & compute access | "Intelligence this powerful is too dangerous for individuals to run." | Solemn, credentialed, 'for your own good' |

Design rule: **every antagonist offer must be genuinely tempting** — a real
short-term gain with a real long-term cost. The player who never feels the
pull isn't learning anything. (The ferry was genuinely safer. It just cost
five dollars you needed for the mountains.)

---

## 4. Anomaly Events: The Broken Axle

Mid-mission events that interrupt the stage flow and demand a decision.
The Oregon Trail moment.

- **Trigger:** rolled at stage transitions (LessonRunner's `advanceStage` is
  the natural hook) with probability scaled by the current Slide band —
  a darker world is a more eventful one. Never during a pending reflection;
  never twice in one mission; never in missions 1–3 (let the bond form first).
- **Anatomy of an event:** an antagonist (or the commons) presents a
  situation with 2–3 choices, each a real trade-off across *now vs. later*
  and *me vs. world*:

  > **MERIDIAN TRUST — "Continuity Offer"**
  > Your Field Guide sync is failing (in-fiction). Meridian offers free,
  > permanent, effortless custody of your dossier.
  > **[Accept]** +Signal now (relief, convenience) · +Slide later · a Field
  > Guide section shows the Meridian watermark until you reclaim it
  > **[Decline & repair]** −Signal now (the hard way) · world holds ·
  > unlocks the *Self-Custodian* trait thread
  > **[Ask Echelon]** costs nothing but time — Echelon teaches the actual
  > concept (custody, single point of failure) and then you still choose

- **Delayed consequences:** every choice writes a `decision` record with
  optional `deferred_effects` that fire missions later — the game
  remembers, and Echelon *references it*: "Operator, the terms you accepted
  in Sector 12 just changed. They always do." That echo is the whole lesson
  about exit costs, delivered by lived experience.
- **Authoring:** events live in a content file (`public/anomalies.json`),
  same pattern as lessons — so new events are written, not programmed.
  Each event is tagged with the concept it teaches (custody, SPOF, censorship
  resistance, data sovereignty, exit cost, abundance vs. scarcity).

---

## 5. Consequences Without Cruelty: Capture, Not Dysentery

Oregon Trail's randomness is part of the design — the world *should* be able
to surprise you mid-mission. But random **death** teaches nothing real, and
we are teaching real things. So the dice decide what *happens to* you, never
whether your learning ends. The failure state is **capture**.

- **Capture, not game over:** when a bad outcome lands hard enough, an
  antagonist takes the operator into custody — a mission-length detention
  in Meridian's Continuity Center, Aperture's Observation Wing, the
  Custodians' Alignment Facility ("the robot prison" — each antagonist's
  prison is their scarcity pitch made architectural). You **always come
  back**. Escape/release is itself a playable beat that teaches the concept
  that got you caught.
- **Scars, not corpses:** coming back has two layers —
  - a **temporary mechanical handicap**: elevated fog for the next N
    missions, a trait suppressed, Signal regeneration slowed — the lesson
    made felt, then lifted;
  - a **permanent narrative memory**: the capture is written to the decision
    log, and Echelon references it forever after — *"Steady, Operator. I
    remember the Observation Wing too. We read the terms first now."* The
    scar is free to keep and priceless to have: it's the game's version of
    every Gen X kid remembering exactly who died at the river crossing.
- **Setbacks below capture:** lesser bad outcomes force a **detour** — a
  re-run of a mission stage at higher fog, a Field Guide section
  watermarked/held by an antagonist until a recovery action. Always
  recoverable, and the recovery *is* the lesson.
- **The abundance rule:** recovery actions are always available and always
  free of real-world cost. The game never charges money, never manufactures
  artificial scarcity of attempts, never dark-patterns. Scarcity is the
  *enemy's* logic; the game itself must run on abundance or the medium
  contradicts the message.
- **World memory:** the Slide history and decision log feed prompt assembly
  as light context, so Echelon's narration carries continuity: the operator
  is living in a world their choices shaped.

---

## 6. The Grade: Commander's Reports & the Operator Rating

The Slide measures the world. The **Operator Rating** measures *you* — and it
is a grade of **judgment, not activity**. Nothing in it can be farmed.

### 6.1 What the rating is computed from

Under the hood, a running score built from the decision log and the systems
we already have:

- **Trade-off quality** — which antagonist bargains you took, declined, or
  asked Echelon about first (the "ask" path is scored *up*: knowing what you
  don't know is command judgment)
- **Recovery record** — captures and setbacks are not deductions by
  themselves; *unrecovered* ones are. A scar you learned from scores higher
  than a mission that never went wrong. (Abundance thinking, applied to
  failure.)
- **Reflection depth** — the trait-unlock engine already analyzes what the
  operator actually writes; the rating reads the same signal
- **Slide contribution** — your personal delta against entropy: did the
  world hold because of you, or despite you?

Explicitly **not** scored: speed, message volume, streaks, completion
percentage. Grinding must be worthless.

### 6.2 How it is delivered: the Commander's Report

The number stays under the hood. The fiction leads. At each **section
boundary** (every ~15 missions, matching the six sections) and at each
Mirror Gate, the operator receives a **Commander's Report** — an in-fiction
performance review, generated from the decision log with receipts:

> **COMMAND ASSESSMENT — SECTION 2 · OPERATOR CHI-06**
> Field rating: **STEADY COMMAND**
> Cited: declined Meridian continuity terms under pressure (M-17).
> Cited: Observation Wing detention (M-21) — intel recovered, protocol
> revised. Scar honored.
> Commendation: taught the custody principle back in debrief M-24 —
> abundance conduct noted.
> The Slide held at Overcast this section. It held because of you.

Rating bands, in ascending order: **PROVISIONAL → STEADY → TRUSTED →
EXEMPLARY COMMAND**. Captures are cited as *intel gained* when recovered —
the report is where the robot prison becomes a story you're proud of.

Who is Command? Never shown, only signed. (Late-campaign lore hook,
deliberately unresolved in v1 — options include the graduated Vanguard
network, or the operator's own future self. Decide when it matters.)

### 6.3 Where it lives

- **Identity Dossier** (existing Field Guide tab) gains a **Command Record**
  section: archived reports, scars, commendations, current band
- **Graduation Dossier** (existing) closes with the final rating and the
  full decision receipts — your grade, in your own choices' words
- Guardrail: the rating **never gates content**. No lesson is locked behind
  a grade (abundance rule). It shapes narration, the reports, and the
  texture of the ending ceremony — reputation, not paywall.

---

## 7. Endgame: The World You Graduate Into

At mission 90, the ending is read off the final Slide band:

- **Open Sky** — the full graduation ceremony; the world made it. Rare, earned.
- **Overcast** — graduation with a charge: the fight continues, and now
  you're trained for it. (Expected common ending; honest about the real world.)
- **The Slide** — a harder ceremony: Echelon is candid about what was traded
  away, mission by mission, decision by decision. Receipts shown.
- **Locktown** — the dark ending. Echelon's sign-off under surveillance
  constraints is the most powerful piece of writing in the game if we do it
  right. And then: *"Run it again, Operator. The trail is still there."*

Multiple endings give the 90-mission campaign replay value and give the
operator a reason to care about the meter from mission 4 onward.

---

## 8. Technical Mapping (all local-first, no new services)

| Piece | Where | Change |
|---|---|---|
| World state | `src/lib/state-engine.ts` | Add `world: { slide, band, history[] }`, `operator.signal`, `decisions[]` to `StateSchema` (versioned migration, like prior schema bumps) |
| Event engine | `src/lib/anomaly-engine.ts` (new) | Event table load, trigger roll, resolution, deferred-effect scheduler |
| Event content | `public/anomalies.json` (new) | Authored events, tagged by concept and antagonist |
| Stage hook | `LessonRunner.advanceStage` | Roll for event before advancing; render event card UI |
| Echelon integration | `src/lib/prompt-assembly.ts` | Extend modifiers: effective fog, slide band, recent decision echoes |
| UI | Dashboard + LessonRunner header | Slide band indicator (subtle, atmospheric — the existing fog overlay CSS can key off it), Signal meter |
| Persistence | localStorage (existing state engine) + optional Supabase mirror | Same sovereignty model as everything else |

Explicitly **not** needed: server-side game logic, new database tables for
MVP, any change to the mission/stage flow contract, any change to lesson
content format.

## 9. Phasing

1. **MVP (one PR):** Slide meter + entropy tick + Signal + 3 authored events
   (one per band transition) + effective-fog wiring + dashboard indicator.
   Ship it, feel it, tune it.
2. **Phase 2:** full antagonist event decks, deferred effects, setback/
   recovery loops, Echelon decision echoes.
3. **Phase 3:** endings, replay ("New Trail+"), event authoring guide for
   community contributions (they're MIT/CC now — the community can write
   anomalies).

## 10. Design Guardrails (the non-negotiables)

1. Every mechanic teaches a real decentralization concept, or it's cut.
2. Antagonist offers must be genuinely tempting; strawmen teach nothing.
3. Failure always converts into learning; recovery is the lesson.
4. The game itself runs on abundance — no artificial scarcity, no dark
   patterns, no paywalled attempts. The medium must not contradict the message.
5. Local-first sovereignty applies to the world state too: the operator can
   export, inspect, and reset their world. It's their trail.
