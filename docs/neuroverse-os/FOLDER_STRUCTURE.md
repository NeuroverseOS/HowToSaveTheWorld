# NeuroVerse OS — Folder Structure

This document defines the canonical directory layout for NeuroVerse OS.

---

## 📂 Directory Layout

```
neuroverse-os/
│
├── src/
│   ├── core/
│   │   ├── echelon.ts              # Echelon Core Intelligence
│   │   ├── prompt-assembly.ts      # Eight-Box Scaffold
│   │   ├── box-stage-map.ts        # Box activation rules
│   │   └── mode-engine.ts          # Multi-mode cognition
│   │
│   ├── models/
│   │   ├── operator-model.ts       # Operator identity schema
│   │   ├── state-model.ts          # Application state schema
│   │   └── ace-model.ts            # ACE Box schema
│   │
│   ├── engines/
│   │   ├── mission-engine.ts       # Lesson orchestration
│   │   ├── state-engine.ts         # State management
│   │   ├── stage-engine.ts         # Stage progression
│   │   ├── field-guide-engine.ts   # Insight compilation
│   │   └── trait-unlock-engine.ts  # Trait inference
│   │
│   ├── ace/
│   │   ├── ace-loader.ts           # ACE retrieval logic
│   │   ├── keyword-triggers.ts     # Trigger detection
│   │   └── ace-index.ts            # Box registry
│   │
│   ├── archetype/
│   │   ├── archetype-scoring.ts    # Assessment engine
│   │   ├── archetype-interpretations.ts  # Trait mappings
│   │   └── archetype-system.ts     # 9 canonical archetypes
│   │
│   ├── identity/
│   │   ├── callsign-generator.ts   # Vanguard callsign logic
│   │   ├── identity-system.ts      # UUID + callsign binding
│   │   └── vanguard-generator.ts   # Activation ceremony
│   │
│   ├── memory/
│   │   ├── short-term-memory.ts    # Last 10 decisions
│   │   ├── long-term-memory.ts     # Philosophy statements
│   │   └── reflection-storage.ts   # Reflection persistence
│   │
│   ├── speech/
│   │   ├── speech-engine.ts        # TTS provider abstraction
│   │   ├── audio-controller.ts     # Voice settings
│   │   └── voices.ts               # Voice model registry
│   │
│   ├── utils/
│   │   ├── encryption.ts           # Operator data encryption
│   │   ├── validation.ts           # Schema validation
│   │   └── error-handling.ts       # Error boundaries
│   │
│   └── index.ts                    # Public API exports
│
├── data/
│   ├── box-stage-map.json          # Box activation rules
│   ├── archetypes.json             # 9 canonical archetypes
│   ├── traits.json                 # TRAIT_MAP registry
│   └── voices.json                 # TTS voice models
│
├── docs/
│   ├── README.md                   # OS overview
│   ├── LICENSE.md                  # MIT license
│   ├── ARCHITECTURE.md             # Eight-Box architecture
│   ├── DEVELOPER_GUIDE.md          # How to build on OS
│   ├── FOLDER_STRUCTURE.md         # This file
│   ├── INSTALLATION.md             # npm install guide
│   ├── CONFIGURATION.md            # initializeEchelon() options
│   ├── SECURITY.md                 # Protected components
│   ├── CONTRIBUTING.md             # Private repo policy
│   ├── CODE_OF_CONDUCT.md          # Professional standards
│   ├── SUPPORT.md                  # Contact info
│   ├── MAINTAINERS.md              # Project leadership
│   └── RELEASE_NOTES.md            # Version history
│
├── tests/
│   ├── core/
│   │   ├── echelon.test.ts
│   │   ├── prompt-assembly.test.ts
│   │   └── mode-engine.test.ts
│   ├── engines/
│   │   ├── mission-engine.test.ts
│   │   └── state-engine.test.ts
│   └── ace/
│       └── ace-loader.test.ts
│
├── package.json                    # npm package config
├── tsconfig.json                   # TypeScript config
├── .npmignore                      # npm publish exclusions
└── README.md                       # npm package README

```

---

## 📦 Core Modules

### `/src/core/`

Contains the Eight-Box Scaffold and Echelon Core Intelligence:

- **echelon.ts** — Main Echelon class, chat interface, mode switching
- **prompt-assembly.ts** — Eight-Box prompt construction logic
- **box-stage-map.ts** — Deterministic box activation rules
- **mode-engine.ts** — Multi-mode cognition (Training, Design, Build, Lead)

### `/src/models/`

TypeScript interfaces and schemas:

- **operator-model.ts** — OperatorModel interface (identity, traits, memory)
- **state-model.ts** — StateModel interface (system, user, progress)
- **ace-model.ts** — ACEBox, ACEEntry interfaces

### `/src/engines/`

Orchestration and state management:

- **mission-engine.ts** — 7-stage lesson delivery
- **state-engine.ts** — localStorage + Supabase sync
- **stage-engine.ts** — Stage progression logic
- **field-guide-engine.ts** — Reflection → Insight compilation
- **trait-unlock-engine.ts** — Trait inference from reflections

### `/src/ace/`

Knowledge retrieval layer:

- **ace-loader.ts** — Load ACE Boxes from local JSON
- **keyword-triggers.ts** — Client-side trigger detection
- **ace-index.ts** — Registry of available ACE Boxes

### `/src/archetype/`

9 Canonical Archetype System:

- **archetype-scoring.ts** — 12-scenario assessment scoring
- **archetype-interpretations.ts** — Primary/Shadow/Rising trait mappings
- **archetype-system.ts** — WATCHTOWER, WEAVER, VEIL, OPERATOR, ENGINE, LUMEN, CIPHER, DRIFT, CHRONICLE

### `/src/identity/`

Operator identity generation:

- **callsign-generator.ts** — Greek letter + number callsign (e.g., "Alpha-13")
- **identity-system.ts** — UUID + callsign binding
- **vanguard-generator.ts** — Activation ceremony logic

### `/src/memory/`

Memory persistence:

- **short-term-memory.ts** — Last 10 decisions/insights
- **long-term-memory.ts** — Operator philosophy statements
- **reflection-storage.ts** — 5-point reflection persistence

### `/src/speech/`

Text-to-speech layer:

- **speech-engine.ts** — TTS provider abstraction (OpenAI, browser)
- **audio-controller.ts** — Voice, speed, pitch, volume settings
- **voices.ts** — Voice model registry (onyx, alloy, echo, etc.)

---

## 📊 Data Files

### `/data/box-stage-map.json`

Defines which boxes are active for each stage:

```json
{
  "briefing": ["Box1", "Box2", "Box3", "Box4", "Box6"],
  "drill1": ["Box1", "Box2", "Box3", "Box4", "Box5", "Box6"]
}
```

### `/data/archetypes.json`

9 canonical archetypes with gifts, challenges, and trait mappings.

### `/data/traits.json`

TRAIT_MAP registry linking reflections → trait signals.

### `/data/voices.json`

TTS voice models and their characteristics.

---

## 📚 Documentation

All documentation lives in `/docs/`:

- **README.md** — OS overview and npm package info
- **LICENSE.md** — MIT license
- **ARCHITECTURE.md** — Eight-Box Scaffold, Echelon Core, engines
- **DEVELOPER_GUIDE.md** — How to build applications on NeuroVerse OS
- **FOLDER_STRUCTURE.md** — This file
- **INSTALLATION.md** — npm install and licensing
- **CONFIGURATION.md** — initializeEchelon() options
- **SECURITY.md** — Protected components and vulnerability reporting
- **CONTRIBUTING.md** — Private repo policy (no external contributions)
- **CODE_OF_CONDUCT.md** — Professional conduct standards
- **SUPPORT.md** — Contact kb15us@gmail.com
- **MAINTAINERS.md** — Project leadership
- **RELEASE_NOTES.md** — Version history

---

## 🧪 Testing

All tests live in `/tests/` mirroring the `/src/` structure:

- **core/** — Echelon, prompt assembly, mode engine tests
- **engines/** — Mission, state, field guide engine tests
- **ace/** — ACE loader and trigger detection tests

---

## 📦 npm Package Structure

When published to npm, the package includes:

```
@neuroverse/os/
├── dist/                   # Compiled JavaScript
├── types/                  # TypeScript declarations
├── data/                   # JSON data files
├── README.md               # Package README
└── LICENSE.md              # MIT license
```

Excluded from npm package:
- `/docs/` (available in GitHub repo only)
- `/tests/`
- `/src/` (source code is private)

---

## 🔒 Protected Components

The following directories contain the **engine core**, published under MIT:

- `/src/core/` — Eight-Box Scaffold and Echelon Core
- `/src/engines/` — Mission, State, Field Guide engines
- `/src/ace/` — ACE Loader architecture
- `/src/archetype/` — Archetype scoring algorithms

Only compiled `/dist/` and type definitions are included in the npm package.

---

## 📞 Support

For questions about folder structure or missing files:

**Email**: kb15us@gmail.com

---

**NeuroVerse OS — Two Minds. One Mission. Save the World.**
