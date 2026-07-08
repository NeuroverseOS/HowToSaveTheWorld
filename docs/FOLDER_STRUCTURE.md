# How to Save the World — Folder Structure

This document explains the repository directory layout.

**Note:** FOXHOLE Protocol is a canonical bonding protocol inside the NeuroVerse, not the name of this platform. This PWA implements the FOXHOLE bonding moment as part of onboarding; the full protocol definition lives in the NeuroVerse Canon repository.

---

## 📂 Directory Layout

```
how-to-save-the-world/
│
├── neuroverse/
│   └── canon/
│       ├── protocols/
│       │   └── foxhole_protocol.md
│       ├── rituals/
│       │   └── foxhole_bonding_ceremony.md
│       ├── ai_identity/
│       │   └── echelon_activation.md
│       └── README.md
│
├── public/
│   ├── ace/
│   │   └── box08_system_literacy/
│   │       ├── box08_index.json
│   │       ├── faq.json
│   │       ├── how_echelon_works.json
│   │       ├── how_neuroverse_works.json
│   │       ├── how_to_use.json
│   │       └── troubleshooting.json
│   ├── images/
│   │   ├── tree-icon.png
│   │   └── tree-logo-transparent.png
│   ├── lessons.json                  # All 96 lessons bundled
│   ├── favicon.png
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── logo-dark.png
│   ├── logo-light.png
│   ├── logo-transparent.png
│   └── robots.txt
│
├── src/
│   ├── components/
│   │   ├── neuroverse/
│   │   │   ├── ArchetypeAssessment.tsx
│   │   │   ├── ArchetypeReveal.tsx
│   │   │   ├── FoxholeProtocol.tsx
│   │   │   ├── GraduationDossierTab.tsx
│   │   │   ├── HelpModal.tsx
│   │   │   ├── LanguageSelection.tsx
│   │   │   ├── LessonRunner.tsx
│   │   │   ├── MissionEngine.tsx
│   │   │   ├── Orientation.tsx
│   │   │   ├── PWAOnboarding.tsx
│   │   │   ├── ReflectionMode.tsx
│   │   │   ├── TransmissionModal.tsx
│   │   │   ├── UnlockOverlay.tsx
│   │   │   ├── VanguardActivation.tsx
│   │   │   ├── VideoPlayer.tsx
│   │   │   └── VoiceRecorder.tsx
│   │   ├── ui/                      # shadcn UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── AdminRoute.tsx
│   │   ├── EchelonAudioToggle.tsx
│   │   ├── NavLink.tsx
│   │   └── ThemeToggle.tsx
│   │
│   ├── pages/
│   │   ├── ActivateEchelon.tsx
│   │   ├── Admin.tsx
│   │   ├── AdminImportLessons.tsx
│   │   ├── ArchetypeRevealPage.tsx
│   │   ├── Assessment.tsx
│   │   ├── Auth.tsx
│   │   ├── BackupSetupPage.tsx
│   │   ├── Dashboard.tsx
│   │   ├── FieldGuide.tsx
│   │   ├── GraduationCinematic.tsx
│   │   ├── Guide.tsx
│   │   ├── Index.tsx
│   │   ├── LanguageSelectionPage.tsx
│   │   ├── Lesson.tsx
│   │   ├── MissionList.tsx
│   │   ├── OperatorDoctrine.tsx
│   │   ├── OrientationPage.tsx
│   │   ├── SecurityPage.tsx
│   │   ├── Settings.tsx
│   │   ├── SupportMission.tsx
│   │   ├── SystemInfo.tsx
│   │   ├── SystemsPanel.tsx
│   │   ├── UnlockPreview.tsx
│   │   ├── VanguardActivationPage.tsx
│   │   ├── VanguardLore.tsx
│   │   ├── VerifyBuild.tsx
│   │   ├── WorkContextPage.tsx
│   │   ├── WorkModePage.tsx
│   │   └── WorkSessionPage.tsx
│   │
│   ├── lib/
│   │   ├── ace-loader.ts           # ACE Box retrieval (uses @neuroverse/os)
│   │   ├── archetype-scoring.ts    # Assessment logic (uses @neuroverse/os)
│   │   ├── echelon-store.ts        # Echelon state management
│   │   ├── field-guide-engine.ts   # Insight compilation
│   │   ├── lesson-loader.ts        # Load lessons.json
│   │   ├── mission-log.ts          # Mission log persistence
│   │   ├── reflection-storage.ts   # Reflection persistence
│   │   ├── speech-engine.ts        # TTS integration
│   │   ├── state-engine.ts         # State persistence
│   │   └── utils.ts                # Utility functions
│   │
│   ├── hooks/
│   │   ├── useDiagnostics.ts
│   │   ├── useMissionProgress.ts
│   │   ├── useOnboardingStep.ts
│   │   ├── useSpeech.ts
│   │   └── useUnlockAnimation.ts
│   │
│   ├── data/
│   │   ├── diagnosticsSchema.json
│   │   ├── foxholeProtocol.json
│   │   ├── voices.ts
│   │   └── work_modes.json
│   │
│   ├── styles/
│   │   ├── graduation-animations.css
│   │   └── unlock-animations.css
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   │
│   ├── App.tsx
│   ├── App.css
│   ├── index.css                   # Design system tokens
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── supabase/
│   ├── config.toml
│   ├── functions/
│   │   ├── _shared/
│   │   │   └── visibility-rules.ts
│   │   ├── analyze-trait-unlocks/
│   │   ├── echelon-chat/
│   │   ├── echelon-speak/
│   │   └── transcribe-audio/
│   └── migrations/
│
├── docs/
│   ├── README.md                   # Documentation index — start here
│   ├── ARCHITECTURE.md             # How to Save the World vs. NeuroVerse OS
│   ├── ARCHITECTURE_SEPARATION.md  # Product separation strategy
│   ├── CONFIGURATION.md            # Environment variables
│   ├── FOLDER_STRUCTURE.md         # This file
│   ├── GOVERNANCE.md               # Decentralized governance
│   ├── INSTALLATION.md             # Setup guide
│   ├── INTEROPERABILITY.md         # NeuroVerse OS integration
│   ├── MAINTAINERS.md              # Project leadership
│   ├── RELEASE_NOTES.md            # Version history
│   ├── SUPPORT.md                  # Contact info
│   └── neuroverse-os/              # NeuroVerse OS documentation
│       ├── README.md
│       ├── LICENSE.md
│       ├── ARCHITECTURE.md
│       └── ...
│
├── scripts/                        # Developer tooling (see scripts/README.md)
│   ├── README.md
│   ├── seed-database.ts
│   ├── kernel-probe.ts
│   ├── probe-echelon.mjs
│   ├── export-lessons-to-json.ts
│   └── curriculum-to-markdown.py
│
├── .github/
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       ├── config.yml
│       └── feature_request.md
│
├── .gitignore
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTENT_LICENSE.md
├── CONTRIBUTING.md
├── LICENSE
├── package.json
├── package-lock.json
├── postcss.config.js
├── README.md
├── SECURITY.md
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 📦 Key Directories

### `/public/`

Static assets served directly:

- **`lessons.json`** — All 96 lessons bundled for offline-first
- **`ace/`** — ACE Box content (System Literacy)
- **`images/`** — Logos, icons, graphics
- **PWA assets** — `favicon.png`, `icon-192.png`, `icon-512.png`

### `/src/components/`

React components:

- **`neuroverse/`** — Core training UI (LessonRunner, ArchetypeAssessment, etc.)
- **`ui/`** — shadcn UI primitives (button, card, dialog, etc.)

### `/src/pages/`

Page-level components (one per route):

- **`Dashboard.tsx`** — Mission overview
- **`Lesson.tsx`** — Lesson delivery page
- **`FieldGuide.tsx`** — Cognitive evolution tracker
- **`Settings.tsx`** — User preferences
- **`WorkModePage.tsx`** — Design/Build/Lead modes

### `/src/lib/`

Business logic and utilities:

- **`ace-loader.ts`** — ACE Box retrieval (imports @neuroverse/os)
- **`archetype-scoring.ts`** — Assessment logic (imports @neuroverse/os)
- **`echelon-store.ts`** — Echelon state management
- **`field-guide-engine.ts`** — Insight compilation
- **`lesson-loader.ts`** — Load lessons from `public/lessons.json`
- **`state-engine.ts`** — State persistence (localStorage + Supabase)

### `/src/integrations/supabase/`

Supabase (Lovable Cloud) integration:

- **`client.ts`** — Supabase client initialization
- **`types.ts`** — Database schema types (auto-generated)

### `/supabase/functions/`

Edge functions:

- **`echelon-chat/`** — Echelon AI conversation endpoint
- **`echelon-speak/`** — Text-to-speech endpoint
- **`transcribe-audio/`** — Whisper API transcription
- **`analyze-trait-unlocks/`** — Trait inference from reflections

### `/docs/`

Documentation:

- **How to Save the World docs** — Architecture, installation, configuration
- **`neuroverse-os/`** — NeuroVerse OS documentation (for licensees)

---

## 🔒 What You Can Modify

### ✅ Open-Source (MIT License):

- `/public/` — Assets, lessons, ACE content
- `/src/components/` — UI components
- `/src/pages/` — Page layouts
- `/src/styles/` — CSS and Tailwind config
- `/docs/` — Documentation (How to Save the World only)
- `README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`

### 🧠 NeuroVerse OS Engine (open-source, MIT):

- `@neuroverse/os` package (imported via npm)
- `/docs/neuroverse-os/` — NeuroVerse OS documentation

---

## 📚 Related Documentation

- [Architecture](./ARCHITECTURE.md) — How to Save the World vs. NeuroVerse OS
- [Installation](./INSTALLATION.md) — Setup and deployment
- [Configuration](./CONFIGURATION.md) — Environment variables

---

**How to Save the World — Open-Source Leadership Training**
