# How to Save the World — Architecture

This document explains what How to Save the World provides versus what NeuroVerse OS provides.

**Note:** FOXHOLE Protocol is a canonical bonding protocol inside the NeuroVerse, not the name of this platform. This PWA implements the FOXHOLE bonding moment as part of onboarding; the full protocol definition lives in the NeuroVerse Canon repository.

---

## 🏗️ Two-Layer Architecture

How to Save the World is built on a **two-layer architecture**:

1. **How to Save the World** (this repository) — Open-source application layer
2. **NeuroVerse OS** (open-source dependency) — Cognitive operating system

```
┌─────────────────────────────────────────────────────────┐
│  How to Save the World (Open-Source Application Layer)  │
│  - 90-mission training curriculum                        │
│  - Cinematic lesson delivery UI                          │
│  - PWA with offline capability                           │
│  - Archetype assessment and reveal ceremonies            │
│  - Field Guide compilation and insights                  │
│  - Work Mode entry points                                │
│  - ACE Box content (System Literacy, troubleshooting)    │
└────────────────────┬────────────────────────────────────┘
                     │ imports @neuroverse/os
                     ▼
┌─────────────────────────────────────────────────────────┐
│  NeuroVerse OS (Open-Source Cognitive Engine)           │
│  - Eight-Box Scaffold (prompt assembly)                  │
│  - Echelon Core Intelligence (AI personality)            │
│  - Operator Model (identity and memory)                  │
│  - Mission Engine (stage orchestration)                  │
│  - State Engine (local-first persistence)                │
│  - Mode Engine (multi-context cognition)                 │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 What How to Save the World Provides

### 1. Training Curriculum (90 Lessons)

- **6 Training Sessions** covering systems thinking, strategic reasoning, and leadership
- **Lesson Content** — Briefings, drills, head-practical integration, debriefs
- **Mission Badges** — Achievement tracking across 90 missions
- **Cinematic Lesson Player** — Immersive UI for lesson delivery
- **5-Point Reflection Architecture** — Standard, Micro-Insight, Exercise, Deep reflections

### 2. User Interface

- **Dashboard** — Mission overview, progress tracking, Field Guide access
- **Lesson Runner** — Stage-driven conversational UI with Echelon
- **Archetype Assessment** — 12-scenario psychological signature test
- **Archetype Reveal** — Ceremonial display of Primary/Shadow/Rising archetypes
- **Orientation (FOXHOLE Protocol)** — 5-phase bonding ceremony
- **Vanguard Activation** — 4-screen cinematic callsign reveal
- **Field Guide** — 7-tab cognitive evolution tracker
- **Graduation Cinematic** — 5-phase finale at lesson 90 completion
- **Work Mode Interface** — Entry points for Design, Build, Lead modes

### 3. PWA Infrastructure

- **Service Worker** — Offline-first caching
- **Manifest** — Install to home screen
- **Local Storage** — State persistence without cloud
- **IndexedDB Fallback** — Large data storage
- **Responsive Design** — Mobile-first, tablet, desktop

### 4. ACE Box Content

- **ACE Box 08 (System Literacy)** — How NeuroVerse works, how Echelon works, FAQs, troubleshooting
- **JSON Content Structure** — `box08_index.json`, `faq.json`, `how_echelon_works.json`, etc.
- **Keyword Triggers** — Client-side trigger detection

### 5. Onboarding Flow

- PWA install prompt
- AI provider connection
- Vanguard Activation ceremony
- Archetype Assessment
- Archetype Reveal
- Orientation (FOXHOLE Protocol)
- Mission List with Lesson 1 active

### 6. Settings & Data Management

- Export/Import state as JSON
- Optional cloud sync (user's own Supabase)
- Theme toggle (dark/light mode)
- Language selection (10 languages)
- Audio settings (TTS voice, speed, pitch)
- Reset & retake onboarding

---

## 🧠 What NeuroVerse OS Provides

### 1. Eight-Box Scaffold

Deterministic prompt assembly engine that constructs AI system prompts from 8 boxes:

```typescript
Box 1: Core Rules (mode-specific constraints)
Box 2: Identity Tags (operator archetype + traits)
Box 3: Stage Instructions (current stage behavior)
Box 4: Content Payload (lesson or work context)
Box 5: Modifiers (preferences + meta-instructions)
Box 6: Short-Term Memory (recent decisions)
Box 7: Long-Term Memory (operator philosophy)
Box 8: ACE Integration (knowledge retrieval)
```

### 2. Echelon Core

AI personality intelligence with:
- Mythic-tech tone enforcement
- ICF coaching rules (one question per response)
- Mode-aware cognition (Training, Design, Build, Lead)
- Archetype-calibrated coaching style
- First-person immersive narrative

### 3. Operator Model

Identity and memory schema:

```typescript
interface OperatorModel {
  uuid: string;
  callsign: string;
  archetype: { primary, shadow, rising };
  traits: string[];
  shadows: string[];
  powers: string[];
  shortTermMemory: string[];
  longTermMemory: string[];
  completedLessons: number[];
  currentLesson: number;
  isGraduated: boolean;
}
```

### 4. Mission Engine

7-stage lesson orchestration:
- BRIEFING → DRILL1 → VIDEO → HP → DRILL2 → DEBRIEF → FINAL → COMPLETE
- Automatic content delivery on stage advancement
- Reflection trigger logic
- Field Guide compilation

### 5. State Engine

Local-first state management:
- localStorage + IndexedDB persistence
- Optional Supabase cloud sync
- State versioning and migration
- Encryption for sensitive data

### 6. Mode Engine

Multi-mode cognition framework:
- Training Mode (coaching and lessons)
- Design Mode (strategic thinking)
- Build Mode (execution planning)
- Lead Mode (people leadership)

### 7. ACE Loader

Knowledge retrieval architecture:
- Keyword-triggered content matching
- Client-side deterministic lookup
- Extensible plugin system for ACE Boxes 01-10+

### 8. Archetype System

9 Canonical Archetype assessment:
- 12-scenario scoring algorithm
- Primary/Shadow/Rising calculation
- Trait inference from reflections
- WATCHTOWER, WEAVER, VEIL, OPERATOR, ENGINE, LUMEN, CIPHER, DRIFT, CHRONICLE

### 9. Identity System

- UUID generation
- Vanguard callsign algorithm (Greek letter + number)
- Activation ceremony logic

### 10. Speech Layer

- Text-to-speech abstraction (OpenAI TTS, browser fallback)
- Voice model selection
- Speed, pitch, volume controls

---

## 🔄 How They Work Together

### Foxhole Protocol Imports NeuroVerse OS:

```typescript
import { 
  initializeEchelon, 
  OperatorModel,
  MissionStage 
} from '@neuroverse/os';

const operator: OperatorModel = {
  // ... operator configuration from How to Save the World
};

const echelon = initializeEchelon({
  operator,
  mode: 'training',
  stage: 'briefing',
  aiProvider: 'openai',
  apiKey: process.env.OPENAI_API_KEY!
});

const response = await echelon.chat({
  userMessage: 'What is my mission?',
  context: {
    lessonTitle: 'Systems Thinking 101',
    lessonContent: lessonData.briefing
  }
});
```

### How to Save the World Responsibilities:

- Load lesson content from `public/lessons.json`
- Manage UI state (current stage, user input)
- Render Echelon responses in cinematic UI
- Store reflections in localStorage
- Update operator state after lesson completion
- Compile Field Guide insights

### NeuroVerse OS Responsibilities:

- Assemble prompts using Eight-Box Scaffold
- Enforce Echelon personality rules
- Call AI provider API
- Compress memory layers
- Validate box-stage activation rules
- Infer traits from reflections

---

## 🔒 What You Can and Cannot Modify

### ✅ You Can Modify (Open-Source):

- **UI Components** — Change styling, layout, animations
- **Lesson Content** — Translate, remix, or create new curricula
- **ACE Box Content** — Add FAQs, troubleshooting guides, system docs
- **PWA Configuration** — Customize manifest, service worker, caching
- **Onboarding Flow** — Add/remove steps, change ceremony text
- **Field Guide Templates** — Customize insight compilation

### ⚠️ Modify With Care (NeuroVerse OS Core):

- **Eight-Box Scaffold** — Prompt assembly logic
- **Echelon Core** — AI personality system prompts
- **Operator Model** — Identity and memory architecture
- **Mission Engine** — Stage orchestration algorithms
- **State Engine** — Persistence and sync logic
- **Mode Engine** — Multi-context cognition framework
- **ACE Loader** — Knowledge retrieval architecture
- **Archetype System** — Scoring and trait inference algorithms

---

## 📦 Package Dependencies

```json
{
  "dependencies": {
    "@neuroverse/os": "^1.0.0"  // The cognitive engine (MIT)
  }
}
```

**Important**: Using Foxhole Protocol in production requires a valid NeuroVerse OS license. Contact kb15us@gmail.com for licensing.

---

## 🌐 Data Flow

```
User Input
    │
    ▼
How to Save the World UI
    │
    ▼
NeuroVerse OS (Eight-Box Scaffold)
    │
    ▼
AI Provider (OpenAI / Anthropic / Google / Ollama)
    │
    ▼
NeuroVerse OS (Echelon Core)
    │
    ▼
How to Save the World UI (render response)
    │
    ▼
localStorage (persist state)
```

**Key Principle**: No server-side processing of operator data. All cognition happens client → AI provider → client.

---

## 📚 Related Documentation

- [Installation](./INSTALLATION.md) — Setup and deployment
- [Configuration](./CONFIGURATION.md) — Environment variables
- [Folder Structure](./FOLDER_STRUCTURE.md) — Repository layout
- [Interoperability](./INTEROPERABILITY.md) — NeuroVerse OS integration details

---

**Foxhole Protocol — Built on NeuroVerse OS**
