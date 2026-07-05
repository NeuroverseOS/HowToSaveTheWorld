# NeuroVerse OS + Foxhole Protocol — Architecture Separation Document

**Version:** 1.0.0  
**Last Updated:** 2025-01-26  
**Purpose:** Define clear architectural boundaries between NeuroVerse OS (proprietary cognitive engine) and Foxhole Protocol (open-source application)

---

## Executive Summary

This document establishes the canonical separation between two distinct products that currently exist in a single codebase:

1. **NeuroVerse OS** — Proprietary cognitive operating system (the engine)
2. **Foxhole Protocol** — Open-source leadership training application (the app)

This separation enables:
- ✅ Foxhole Protocol to be fully open-source and Web3-aligned
- ✅ NeuroVerse OS to remain proprietary intellectual property
- ✅ Clean licensing model for both products
- ✅ Future extensibility for additional apps built on the OS
- ✅ Enterprise licensing opportunities for the OS platform

---

## Product Definitions

### NeuroVerse OS (Proprietary Platform)

**What it is:**
A cognitive operating system that structures human-AI reasoning through a deterministic seven-box scaffold, identity continuity, mode-based constraints, and governed memory.

**What it does:**
- Assembles AI prompts using the 7-Box Cognition Engine
- Manages operator identity (Vanguard callsign, archetype, traits)
- Controls conversation stages and progression
- Enforces mode-specific reasoning constraints
- Infers psychological patterns from reflections
- Maintains short-term and long-term memory
- Provides ACE Box architecture (knowledge retrieval system)

**Core value:**
Ensures AI behaves consistently, maintains identity continuity, and adapts to the operator's cognitive structure — not just for Foxhole, but for any application.

**License:**
Commercial license (proprietary). Licensed to Kirsten Bischoff for use in all her products. Available for enterprise licensing.

---

### Foxhole Protocol (Open-Source Application)

**What it is:**
A decentralized leadership training program built on the NeuroVerse OS, delivered as a Progressive Web App (PWA).

**What it does:**
- Delivers 96 canonical training missions
- Provides onboarding flow (Vanguard activation, assessment, orientation)
- Manages lesson content (JSON files)
- Implements UI/UX for missions and reflections
- Provides Field Guide visualization
- Stores operator progress locally (localStorage)
- Enables mission replay and progress tracking

**Core value:**
A free, transparent, human-first AI training system that teaches leadership and systems thinking without surveillance or corporate control.

**License:**
Open-source (MIT or Apache 2.0). Fully forkable by DAOs, collectives, and Web3 communities.

---

## Architecture Map

### NeuroVerse OS Components (Private/Licensed)

All components that power the cognitive engine and identity system belong in the NeuroVerse OS repository.

#### Core Modules

**Prompt Assembly & 7-Box Engine**
- `src/lib/prompt-assembly.ts` — Assembles AI prompts using the seven-box scaffold
- `src/lib/box-stage-map.ts` — Deterministic map of which boxes are active per stage
- `src/lib/stage-engine.ts` — Controls mission stage progression and validation

**Identity & Operator Model**
- `src/lib/identity-system.ts` — Defines operator traits, archetypes, and identity tags
- `src/lib/archetype-scoring.ts` — Canonical archetype calculation engine (9 archetypes)
- `src/lib/identity-unlock-engine.ts` — Trait unlock mechanics and progression
- `src/lib/trait-unlock-engine.ts` — Manages trait visibility and unlock conditions

**State Management**
- `src/lib/state-engine.ts` — Defines StateSchema and state persistence logic
- State schema includes: user identity, progress, archetypes, traits, reflections, badges, fog, drift

**Field Guide Engine**
- `src/lib/field-guide-engine.ts` — Inference layer that processes reflections into psychological insights
- `src/lib/mission-log.ts` — Compiles mission-by-mission cognitive summaries
- `src/lib/field-guide-translations.ts` — Multilingual Field Guide content

**Reflection System**
- `src/lib/reflection-storage.ts` — Unified reflection storage schema (5 reflection modes)
- Reflection modes: standard, micro-insight, exercise, deep

**Work Mode System**
- `src/lib/work-engine.ts` — Work Mode cognition framework (Design, Build, Lead)
- `src/lib/work-prompt-assembly.ts` — Work Mode-specific prompt assembly
- `src/data/work_modes.json` — Mode definitions and Box 1 rules per mode

**ACE Box Architecture**
- `src/lib/ace-loader.ts` — Local-first knowledge retrieval system
- Provides: deterministic keyword matching, JSON caching, offline-first content access
- NOTE: ACE Box CONTENT belongs to Foxhole; ACE Box ARCHITECTURE belongs to NeuroVerse OS

**Echelon Core Logic (Edge Function)**
- `supabase/functions/echelon-chat/index.ts` — Core AI integration and prompt execution
- `supabase/functions/echelon-speak/index.ts` — Text-to-speech rendering layer
- `supabase/functions/transcribe-audio/index.ts` — Audio transcription (Whisper API)

**Visibility & Constraints**
- `src/lib/echelon-visibility-rules.ts` — Controls what content Echelon can see per stage
- `src/lib/visibility-validator.ts` — Validates visibility compliance
- `supabase/functions/_shared/visibility-rules.ts` — Shared visibility enforcement

**Speech & Audio**
- `src/lib/speech-engine.ts` — Text-to-speech interface (OpenAI TTS + browser fallback)
- `src/lib/audio-controller.ts` — Audio settings and voice selection
- `src/data/voices.ts` — Supported voice models

**Lesson System**
- `src/lib/lesson-validator.ts` — Validates lesson schema and integrity
- `src/lib/lesson-loader.ts` — Loads lessons from static JSON
- `src/lib/lesson-queries.ts` — Lesson retrieval and filtering logic

**Schemas & Types**
- `src/lib/lesson-import-schema.ts` — Lesson data validation schema
- All TypeScript interfaces defining core OS structures

---

### Foxhole Protocol Components (Public/Open Source)

All components that deliver the training experience and content belong in the Foxhole Protocol repository.

#### Content & Curriculum

**Lesson Database**
- `public/lessons.json` — Complete 96-lesson curriculum (canonical training missions)
- All lesson content: titles, summaries, briefings, drills, exercises, reflections, Field Guide prompts

**ACE Box Content**
- `public/ace/box08_system_literacy/` — All JSON content files for ACE Box 08
- `public/ace/box08_system_literacy/box08_index.json` — Knowledge index
- Files: `faq.json`, `how_echelon_works.json`, `how_neuroverse_works.json`, `how_to_use.json`, `troubleshooting.json`

**Onboarding Data**
- `src/data/foxholeProtocol.json` — Canonical Foxhole Protocol bonding ceremony (5 phases)
- `src/data/diagnosticsSchema.json` — System diagnostic definitions

#### User Interface (React Components)

**Pages**
- `src/pages/Index.tsx` — Homepage (landing page)
- `src/pages/Dashboard.tsx` — Main operator dashboard
- `src/pages/Lesson.tsx` — Mission runner page
- `src/pages/MissionList.tsx` — Mission list with replay access
- `src/pages/FieldGuide.tsx` — Field Guide visualization (7 tabs)
- `src/pages/Assessment.tsx` — Archetype assessment
- `src/pages/ArchetypeRevealPage.tsx` — Archetype reveal ceremony
- `src/pages/OrientationPage.tsx` — Foxhole Protocol bonding
- `src/pages/VanguardActivationPage.tsx` — Vanguard callsign generation
- `src/pages/ActivateEchelon.tsx` — AI connection setup
- `src/pages/LanguageSelectionPage.tsx` — Language selection
- `src/pages/BackupSetupPage.tsx` — Backup method selection
- `src/pages/Settings.tsx` — Settings and data management
- `src/pages/SupportMission.tsx` — Funding/contribution page
- `src/pages/OperatorDoctrine.tsx` — Operator ethos (10 principles)
- `src/pages/SecurityPage.tsx` — Security and transparency documentation
- `src/pages/VerifyBuild.tsx` — Build verification and checksums
- `src/pages/SystemInfo.tsx` — ACE Box 08 system literacy interface
- `src/pages/SystemsPanel.tsx` — Diagnostic and repair tools
- `src/pages/GraduationCinematic.tsx` — Graduation finale experience
- `src/pages/WorkModePage.tsx` — Work Mode entry point
- `src/pages/WorkContextPage.tsx` — Work context setup
- `src/pages/WorkSessionPage.tsx` — Work session interface

**NeuroVerse Components**
- `src/components/neuroverse/LessonRunner.tsx` — Core lesson runner component (uses NeuroVerse OS)
- `src/components/neuroverse/ReflectionMode.tsx` — Reflection interface (5 modes)
- `src/components/neuroverse/ArchetypeAssessment.tsx` — 12-scenario assessment
- `src/components/neuroverse/ArchetypeReveal.tsx` — Archetype reveal UI
- `src/components/neuroverse/Orientation.tsx` — Foxhole Protocol ceremony UI
- `src/components/neuroverse/VanguardActivation.tsx` — Vanguard activation ceremony
- `src/components/neuroverse/MissionEngine.tsx` — Mission progression UI
- `src/components/neuroverse/OnboardingProgress.tsx` — Onboarding step indicator
- `src/components/neuroverse/BackupSetup.tsx` — Backup setup UI
- `src/components/neuroverse/FoxholeProtocol.tsx` — Foxhole ceremony renderer
- `src/components/neuroverse/TransmissionModal.tsx` — Recruitment transmission modal
- `src/components/neuroverse/HelpModal.tsx` — Help and support modal
- `src/components/neuroverse/GraduationDossierTab.tsx` — Graduation dossier PDF generator
- `src/components/neuroverse/UnlockAnimationProvider.tsx` — Unlock animation system
- `src/components/neuroverse/UnlockOverlay.tsx` — Unlock overlay UI
- `src/components/neuroverse/LanguageSelection.tsx` — Language selection UI
- `src/components/neuroverse/VoiceRecorder.tsx` — Voice recording (mobile)
- `src/components/neuroverse/VideoPlayer.tsx` — Video player component
- `src/components/neuroverse/reflection/` — Reflection mode sub-components

**UI Components (shadcn)**
- `src/components/ui/` — All shadcn UI components (buttons, cards, dialogs, etc.)
- `src/components/ThemeToggle.tsx` — Light/dark mode toggle
- `src/components/NavLink.tsx` — Navigation link component
- `src/components/EchelonAudioToggle.tsx` — Audio enable/disable toggle

**Debug Tools**
- `src/components/debug/DevToolsPanel.tsx` — Developer tools panel (Lovable-only)
- `src/components/debug/ViewportDebugPanel.tsx` — Viewport debug overlay (Lovable-only)

#### Progressive Web App (PWA)

**PWA Infrastructure**
- `public/manifest.json` — PWA manifest
- `public/robots.txt` — Search engine directives
- `public/favicon.png` — Favicon
- `public/icon-192.png` — PWA icon (192x192)
- `public/icon-512.png` — PWA icon (512x512)
- `public/logo-transparent.png` — Logo (transparent background)
- `public/logo-dark.png` — Logo (dark mode)
- `public/logo-light.png` — Logo (light mode)
- `public/images/` — Static image assets
- `vite.config.ts` — Vite + PWA configuration
- `vite-plugin-pwa` — PWA plugin configuration

#### Styling & Design System

**Design System**
- `src/index.css` — Global CSS and design tokens (semantic colors, typography, animations)
- `tailwind.config.ts` — Tailwind configuration (custom colors, theme extensions)
- `src/styles/graduation-animations.css` — Graduation cinematic animations
- `src/styles/unlock-animations.css` — Trait unlock animations

#### Application Core

**App Shell**
- `src/App.tsx` — Main app component and routing
- `src/main.tsx` — React app entry point
- `index.html` — HTML shell

**Hooks**
- `src/hooks/use-mobile.tsx` — Mobile device detection
- `src/hooks/use-theme.tsx` — Theme management
- `src/hooks/use-toast.ts` — Toast notification system
- `src/hooks/useDiagnostics.ts` — System diagnostics
- `src/hooks/useMissionProgress.ts` — Mission progress tracking
- `src/hooks/useOnboardingStep.ts` — Onboarding step management
- `src/hooks/useSpeech.ts` — Speech synthesis hook
- `src/hooks/useUnlockAnimation.ts` — Unlock animation control

#### Utilities

**Local-First Logic**
- `src/lib/reset-state.ts` — State reset utilities
- `src/lib/language-utils.ts` — Language utilities and translations
- All localStorage interaction logic in Foxhole-specific pages

---

## Shared Interfaces

### How Foxhole Imports NeuroVerse OS

Foxhole Protocol will import the NeuroVerse OS as an npm dependency:

```json
{
  "dependencies": {
    "@neuroverse/os": "1.0.0"
  }
}
```

### Key Import Points

Foxhole components that currently use OS modules:

```typescript
// Example: LessonRunner.tsx
import { assemblePrompt, getActiveBoxesForStage } from "@neuroverse/os/prompt-assembly";
import { advanceStage, validateStageTransition } from "@neuroverse/os/stage-engine";
import { StateSchema, saveState, loadState } from "@neuroverse/os/state-engine";
import { generateFieldGuideEntry } from "@neuroverse/os/field-guide-engine";

// Example: ArchetypeAssessment.tsx
import { calculateArchetypes } from "@neuroverse/os/archetype-scoring";

// Example: FieldGuide.tsx
import { TRAIT_MAP, getTraitDefinition } from "@neuroverse/os/identity-system";
import { getEvolutionTimeline, getTraitCompletion } from "@neuroverse/os/identity-unlock-engine";
```

### Interface Contracts

NeuroVerse OS exports well-defined TypeScript interfaces that Foxhole consumes:

- `StateSchema` — Operator state structure
- `Lesson` — Lesson data structure
- `MissionStage` — Mission stage enum
- `TraitDefinition` — Trait metadata
- `ArchetypeResult` — Archetype calculation result
- `ReflectionEntry` — Reflection storage schema
- `MissionLogEntry` — Field Guide mission log
- `ACEEntry` — ACE Box content entry

---

## Licensing Strategy

### NeuroVerse OS License

**Type:** Commercial License (Custom)

**Key Terms:**
- Kirsten Bischoff retains full ownership and all rights
- Kirsten Bischoff is granted perpetual, royalty-free, worldwide license to use, modify, and distribute the OS for any purpose, including commercial products
- Organizations can license the OS for:
  - Enterprise training programs
  - Leadership development platforms
  - Coaching applications
  - Custom cognitive engines
  - Internal tools and systems
- Licensees cannot fork, open-source, or redistribute the OS itself
- Licensees CAN build and distribute applications on top of the OS

**Comparable Examples:**
- Unreal Engine (Epic Games)
- Unity Engine
- Posemesh (Auki Labs)
- Stripe Connect

### Foxhole Protocol License

**Type:** Open Source (MIT or Apache 2.0)

**Key Terms:**
- Fully open-source and forkable
- Anyone can remix, modify, and redistribute
- DAOs, collectives, and Web3 communities can build on it
- No commercial restrictions
- Attribution required (standard MIT/Apache terms)

**Comparable Examples:**
- Ethereum protocol
- Filecoin client
- Open-source React apps
- Public governance frameworks

---

## Future GitHub Repository Structure

### Repository #1: `neuroverse-os` (Private)

```
neuroverse-os/
  README.md                      # OS platform documentation
  LICENSE                        # Commercial license
  package.json                   # OS SDK package definition
  /src/
    /prompt-assembly/            # 7-Box Cognition Engine
    /identity-system/            # Operator Model
    /stage-engine/               # Stage progression
    /field-guide-engine/         # Inference layer
    /work-engine/                # Work Mode framework
    /ace-architecture/           # ACE Box system
    /schemas/                    # TypeScript interfaces
  /docs/
    architecture_overview.md     # OS architecture
    prompt_assembly_spec.md      # 7-Box scaffold documentation
    identity_system_spec.md      # Operator Model documentation
    ace_box_spec.md              # ACE Box architecture
  /examples/
    minimal_integration.ts       # Example: basic OS usage
    work_mode_integration.ts     # Example: Work Mode usage
```

### Repository #2: `foxhole-protocol` (Public)

```
foxhole-protocol/
  README.md                      # Foxhole Protocol documentation
  LICENSE                        # MIT or Apache 2.0
  CONTRIBUTING.md                # Contribution guidelines
  package.json                   # Lists @neuroverse/os as dependency
  /public/
    /lessons.json                # 96 canonical missions
    /ace/                        # ACE Box 08 content
  /src/
    /pages/                      # All Foxhole pages
    /components/                 # All Foxhole UI components
    /hooks/                      # Foxhole-specific hooks
    /styles/                     # Design system
  /pwa/
    manifest.json                # PWA manifest
  /docs/
    how_it_works.md              # Foxhole system explanation
    build_your_own.md            # Fork and customize guide
    decentralization.md          # Web3 ethos and sovereignty
```

---

## Implementation Roadmap

### Phase 1: Documentation (Complete)
✅ Architecture Separation Document created  
✅ Component mapping finalized  
✅ Licensing strategy defined

### Phase 2: Pre-Separation Preparation
- [ ] Create comprehensive integration tests for Foxhole → OS interface
- [ ] Document all OS function signatures and exports
- [ ] Identify hardcoded dependencies that need abstraction
- [ ] Create TypeScript interface definitions for all OS exports

### Phase 3: NeuroVerse OS SDK Creation
- [ ] Create `neuroverse-os` repository
- [ ] Move all OS components to new repo
- [ ] Configure as npm package (`@neuroverse/os`)
- [ ] Write OS README and developer documentation
- [ ] Generate API reference documentation
- [ ] Apply Commercial License

### Phase 4: Foxhole Protocol Extraction
- [ ] Create `foxhole-protocol` repository
- [ ] Move all Foxhole components to new repo
- [ ] Update imports to use `@neuroverse/os` package
- [ ] Configure PWA for standalone deployment
- [ ] Write Foxhole README and contribution guidelines
- [ ] Apply MIT/Apache License

### Phase 5: Integration Testing
- [ ] Test Foxhole runs correctly with packaged OS
- [ ] Verify all 96 lessons work end-to-end
- [ ] Validate onboarding flow
- [ ] Test Work Mode functionality
- [ ] Verify Field Guide inference engine
- [ ] Test offline-first capabilities

### Phase 6: Public Release
- [ ] Publish Foxhole Protocol to GitHub (public)
- [ ] Create NeuroVerseOS.com website
- [ ] Launch licensing program for NeuroVerse OS
- [ ] Publish Foxhole Protocol announcement
- [ ] Create demo videos and documentation
- [ ] Establish contributor guidelines

---

## Key Design Principles

### 1. Separation of Concerns
- **NeuroVerse OS:** "How to think" (reasoning engine)
- **Foxhole Protocol:** "What to learn" (content and curriculum)

### 2. Clean Dependency Model
- Foxhole depends on NeuroVerse OS
- NeuroVerse OS does NOT depend on Foxhole
- OS is content-agnostic and reusable

### 3. Licensing Clarity
- OS = proprietary (commercial licensing model)
- Foxhole = open-source (Web3-aligned transparency)
- No license conflicts or confusion

### 4. Future Extensibility
- New apps can be built on the OS (MeMenu, enterprise tools, etc.)
- Foxhole can be forked by communities
- OS maintains single source of truth

### 5. Sovereignty Preserved
- Foxhole remains local-first, offline-capable, censorship-resistant
- OS architecture supports this philosophy
- No cloud dependencies required for either product

---

## FAQ

### Q: Why separate now?
**A:** The codebase has matured to the point where clear architectural boundaries enable future growth. Keeping them entangled forces NeuroVerse OS to be open-source, which prevents commercial licensing opportunities and limits scalability.

### Q: Will Foxhole still work the same way?
**A:** Yes. Foxhole will import the OS as a package dependency. Users will experience zero functional difference. The separation is architectural, not experiential.

### Q: Can others build on the NeuroVerse OS?
**A:** Yes, through commercial licensing. Organizations can license the OS to build their own cognitive training programs, leadership platforms, or custom applications. They cannot fork or open-source the OS itself.

### Q: Can DAOs fork Foxhole Protocol?
**A:** Yes! Foxhole Protocol is fully open-source and forkable. Web3 communities can remix, customize, and redistribute it freely. The OS underneath is licensed to those forks as well, but remains proprietary.

### Q: What happens to existing users?
**A:** Nothing changes for users. The PWA continues to work exactly as before. The separation is internal infrastructure, not user-facing functionality.

### Q: How is this different from other platforms?
**A:** Most platforms are either fully open-source (no moat) or fully proprietary (no transparency). NeuroVerse + Foxhole achieves both: a proprietary cognitive engine with an open, transparent application layer. This is the same model Unity, Unreal, and Posemesh use.

---

## Conclusion

This document establishes the canonical architecture for separating NeuroVerse OS (proprietary cognitive engine) from Foxhole Protocol (open-source training application). The separation enables:

- ✅ Foxhole to be fully transparent and Web3-aligned
- ✅ NeuroVerse OS to be commercially licensed
- ✅ Future extensibility for new apps and modes
- ✅ Clean intellectual property boundaries
- ✅ Enterprise viability for the OS platform

This is the foundation for the next evolution of NeuroVerse: from a single training app to a cognitive operating system powering multiple applications, communities, and ecosystems.

---

**Document Owner:** Kirsten Bischoff  
**Technical Contact:** Little Sis (implementation lead)  
**Status:** Approved for Implementation  
**Next Steps:** Phase 2 (Pre-Separation Preparation)
