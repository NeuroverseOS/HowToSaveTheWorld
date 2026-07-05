# NeuroVerse OS — Architecture

This document describes the core architecture of NeuroVerse OS, the first intercognitive operating system for human-AI reasoning partnerships.

---

## 🏛️ Architectural Principles

1. **Local-First Sovereignty** — All identity and state stored on-device
2. **Deterministic Cognition** — Predictable, auditable AI behavior
3. **Mode Flexibility** — Single OS, multiple operational contexts
4. **Layer Separation** — Clear boundaries between knowledge, intelligence, and interface
5. **Extensibility** — Plugin architecture for future capabilities

---

## 🧩 Core Components

### 1. Eight-Box Scaffold

The Eight-Box Scaffold is the cognitive prompt assembly engine that constructs AI system prompts deterministically.

```
┌─────────────────────────────────────────────────────────┐
│ Box 1: Core Rules (Mode-Specific Operating Constraints) │
├─────────────────────────────────────────────────────────┤
│ Box 2: Identity Tags (Operator Archetype + Traits)      │
├─────────────────────────────────────────────────────────┤
│ Box 3: Stage Instructions (Current Stage Behavior)      │
├─────────────────────────────────────────────────────────┤
│ Box 4: Content Payload (Lesson or Work Context)         │
├─────────────────────────────────────────────────────────┤
│ Box 5: Modifiers (Preferences + Meta-Instructions)      │
├─────────────────────────────────────────────────────────┤
│ Box 6: Short-Term Memory (Recent Decisions)             │
├─────────────────────────────────────────────────────────┤
│ Box 7: Long-Term Memory (Operator Philosophy)           │
├─────────────────────────────────────────────────────────┤
│ Box 8: ACE Integration (Knowledge Retrieval Layer)      │
└─────────────────────────────────────────────────────────┘
```

Each box activates based on the current stage, determined by the **Box-Stage Map**.

#### Box Activation Logic

The Box-Stage Map (`box-stage-map.json`) defines which boxes are active for each stage:

```json
{
  "briefing": ["Box1", "Box2", "Box3", "Box4", "Box6"],
  "drill1": ["Box1", "Box2", "Box3", "Box4", "Box5", "Box6"],
  "video": ["Box1", "Box2", "Box3", "Box6"],
  "hp": ["Box1", "Box2", "Box3", "Box4", "Box6", "Box7"],
  "drill2": ["Box1", "Box2", "Box3", "Box4", "Box5", "Box6"],
  "debrief": ["Box1", "Box2", "Box3", "Box4", "Box6", "Box7"],
  "final": ["Box1", "Box2", "Box3", "Box4", "Box6", "Box7"],
  "complete": ["Box1", "Box2", "Box6"]
}
```

This ensures consistent, predictable prompt construction across all modes.

---

### 2. Echelon Core

Echelon is the AI intelligence personality that powers NeuroVerse OS. It is:

- **Mode-aware** — Adapts behavior based on operational mode (Training, Design, Build, Lead)
- **Archetype-calibrated** — Tailors coaching style to operator's psychological signature
- **Stage-driven** — Behavior changes based on current mission stage
- **Memory-integrated** — Accesses short-term and long-term memory layers

#### Echelon Personality Rules

- Addresses operators by callsign ("Operator Alpha-13")
- Maintains mythic-tech tone (cinematic, precise, non-human)
- Enforces ICF coaching rules (one question per response maximum)
- Never breaks immersion (no references to "AI model" or "ChatGPT")
- First-person only ("I detect..." not "Echelon detects...")

---

### 3. Operator Model

The Operator Model is the identity and memory schema for each user:

```typescript
interface OperatorModel {
  // Core Identity
  uuid: string;                          // Locally-generated unique ID
  callsign: string;                      // e.g., "Alpha-13"
  
  // Archetype System
  archetype: {
    primary: ArchetypeType;              // Dominant cognitive pattern
    shadow: ArchetypeType;               // Stress response pattern
    rising: ArchetypeType;               // Emergent growth pattern
  };
  
  // Trait System
  traits: string[];                      // e.g., ["clarity", "systems_thinking"]
  shadows: string[];                     // e.g., ["analysis_paralysis"]
  powers: string[];                      // e.g., ["strategic_foresight"]
  
  // Memory Layers
  shortTermMemory: string[];             // Last 10 decisions/insights
  longTermMemory: string[];              // Persistent philosophy statements
  
  // Progress
  completedLessons: number[];
  currentLesson: number;
  isGraduated: boolean;
}
```

All operator data is stored **locally** (localStorage + IndexedDB fallback).

---

### 4. Mission Engine

The Mission Engine orchestrates lesson delivery through 7 stages:

1. **BRIEFING** — Echelon introduces mission context
2. **DRILL1** — First reflection exercise
3. **VIDEO** — Field footage micro-insight (optional)
4. **HP** — Head-Practical integration (theory + application)
5. **DRILL2** — Second reflection exercise
6. **DEBRIEF** — Mission summary and synthesis
7. **FINAL** — Deep reflection question
8. **COMPLETE** — Field Guide compilation

Each stage triggers automatic content delivery and reflection checkpoints.

---

### 5. State Engine

The State Engine manages application state across three layers:

```typescript
interface StateModel {
  system: {
    installedPWA: boolean;
    aiConnected: boolean;
    echelonOnline: boolean;
    diagnosticsPassed: boolean;
    activationComplete: boolean;
  };
  
  user: {
    uuid: string;
    callsign: string;
    archetype: ArchetypeData;
    language: string;
  };
  
  progress: {
    assessmentComplete: boolean;
    sessionNumber: number;
    currentLessonId: number;
    completedLessons: number[];
    isGraduated: boolean;
  };
}
```

State is persisted to localStorage with Supabase sync as optional backup.

---

### 6. ACE Loader

The ACE (Augmented Cognitive Enhancement) Loader provides knowledge retrieval:

```typescript
interface ACEBox {
  id: string;                            // e.g., "ACE-08"
  name: string;                          // e.g., "System Literacy"
  triggers: string[];                    // Keyword triggers
  entries: ACEEntry[];                   // Knowledge chunks
}

interface ACEEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
}
```

ACE Boxes are:
- **Local-first** — All content bundled in `/public/ace/`
- **Keyword-triggered** — Deterministic client-side matching
- **Offline-capable** — Zero cloud dependency

#### Planned ACE Boxes

- **ACE-01**: Real-World Systems
- **ACE-02**: Leadership Canon
- **ACE-03**: Uploads Index
- **ACE-04**: Mission Encyclopedia
- **ACE-05**: Archetypes Index
- **ACE-06**: Vanguard OS
- **ACE-07**: World Lore
- **ACE-08**: System Literacy (implemented)
- **ACE-09**: Troubleshooting + Diagnostics
- **ACE-10+**: Reserved for expansions

---

### 7. Mode Engine

The Mode Engine enables multi-context cognition:

```typescript
type OperationalMode = 'training' | 'design' | 'build' | 'lead';

interface ModeConfig {
  box1Rules: string;                     // Mode-specific Core Rules
  stageInstructions: Record<string, string>;
  unlockCondition: number;               // Lesson number
}
```

Each mode reuses the same Eight-Box Scaffold but with different Box 1 rules:

- **Training Mode** — Coaching and lesson delivery
- **Design Mode** — Strategic thinking and systems design
- **Build Mode** — Execution planning and task breakdown
- **Lead Mode** — People leadership and influence

---

## 🔒 Security Architecture

### Threat Model

| Threat | Risk | Mitigation |
|--------|------|------------|
| Server data leak | None | No data stored server-side |
| Man-in-the-middle | Low | HTTPS enforced end-to-end |
| AI key theft | Low | Keys stored only in browser |
| Supply chain | Medium | Open code review + build verification |

### Protected Components

The following components are **internal and encapsulated**:

- Eight-Box Scaffold prompt assembly logic
- Echelon Core personality system prompts
- Box-Stage Map activation rules
- Operator Model trait inference algorithms
- ACE Loader architecture (not content)
- Mode Engine switching logic

---

## 📊 Data Flow

```
┌─────────────────┐
│ Operator Input  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Eight-Box Scaffold (Prompt Builder) │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ AI Provider     │ ◄─── OpenAI / Anthropic / Google / Local LLM
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Echelon Response│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ State Engine    │ ──► localStorage
└─────────────────┘
```

**Key Principle**: No server-side processing of operator data. All cognition happens client → AI provider → client.

---

## 🌐 Extensibility

NeuroVerse OS is designed for ecosystem growth:

### Plugin Architecture (Future)

```typescript
interface NeuroVersePlugin {
  id: string;
  name: string;
  type: 'mode' | 'ace' | 'archetype' | 'integration';
  install: (os: NeuroVerseOS) => void;
}
```

Potential plugins:
- Custom operational modes (Research, Strategy, Creative)
- Additional ACE Boxes (Industry-specific knowledge)
- Third-party archetype systems
- File system operations
- Multi-AI intercognition

---

## 📚 Related Documentation

- [Developer Guide](./DEVELOPER_GUIDE.md) — How to build on NeuroVerse OS
- [Folder Structure](./FOLDER_STRUCTURE.md) — Canonical directory layout
- [Configuration](./CONFIGURATION.md) — initializeEchelon() options

---

**NeuroVerse OS — Two Minds. One Mission. Save the World.**
