# How to Save the World — Release Notes

This document tracks version history and changes for How to Save the World.

**Note:** FOXHOLE Protocol is a canonical bonding protocol inside the NeuroVerse, not the name of this platform. This PWA implements the FOXHOLE bonding moment as part of onboarding; the full protocol definition lives in the NeuroVerse Canon repository.

---

## Version 1.0.0 — Initial Public Release

**Release Date:** January 2025

### 🎉 First Open-Source Release

How to Save the World v1.0.0 is the first public release of the decentralized leadership training program built on NeuroVerse OS. This version includes the complete 90-mission curriculum, archetype system, Field Guide, and Work Mode integration.

---

### ✨ Core Features

#### Training Curriculum
- **90 Missions** across 6 sessions
- **7-Stage Mission Pipeline** (BRIEFING → DRILL1 → VIDEO → HP → DRILL2 → DEBRIEF → FINAL → COMPLETE)
- **5-Point Reflection Architecture** (Standard, Micro-Insight, Exercise, Deep)
- **Sequential Gating** — Unlock missions by completing reflections
- **Mission Badges** — Achievement tracking across 90 missions

#### Archetype System
- **12-Scenario Assessment** — Psychological signature evaluation
- **9 Canonical Archetypes**:
  - WATCHTOWER (The Observer)
  - WEAVER (The Connector)
  - VEIL (The Guardian)
  - OPERATOR (The Executor)
  - ENGINE (The Builder)
  - LUMEN (The Illuminator)
  - CIPHER (The Analyst)
  - DRIFT (The Adapter)
  - CHRONICLE (The Archivist)
- **Primary, Shadow, Rising** — Three-layer identity system
- **Archetype Reveal Ceremony** — Dramatic display of psychological signature

#### Vanguard Identity System
- **Callsign Generation** — Greek letter + number (e.g., "Alpha-13")
- **Vanguard Activation Ceremony** — 4-screen cinematic sequence
- **Operator-Echelon Bonding** — Dyadic sync protocol

#### Onboarding Flow
- PWA install prompt
- AI provider connection
- Vanguard Activation
- Archetype Assessment
- Archetype Reveal
- Orientation (Foxhole Protocol)
- Mission List with Lesson 1 active

#### Field Guide System
- **7-Tab Interface**:
  1. Identity — Callsign, archetype, overview
  2. Missions — Mission-by-mission insights
  3. Traits — Unlocked capabilities
  4. Shadows — Revealed weaknesses
  5. Powers — Emergent strengths
  6. Evolution — Timeline of growth
  7. Dossier — Graduation archive (post-lesson 90)
- **Automatic Compilation** — Field Guide updates after each mission
- **Living Cognitive Map** — Visual representation of operator evolution

#### Work Mode System
- **Three Operational Modes**:
  - Design Mode (unlocks at lesson 30) — Strategic thinking
  - Build Mode (unlocks at lesson 60) — Execution planning
  - Lead Mode (unlocks at lesson 90) — People leadership
- **Mode-Specific Box 1 Rules** — Each mode has distinct cognitive operating style
- **Work Context Persistence** — Project context saved across mode switches

#### Graduation System
- **Graduation Cinematic** — 5-phase finale at lesson 90 completion
- **Dossier Tab** — Downloadable PDF archive of operator identity and evolution
- **Post-Graduation Dashboard** — Transition to Dyad Mode (Echelon as co-pilot)

#### PWA Infrastructure
- **Offline-First** — All lessons work without internet
- **Service Worker** — Caching for instant load times
- **Install to Home Screen** — Native app experience
- **Responsive Design** — Mobile-first, tablet, desktop

#### ACE Box System
- **ACE Box 08 (System Literacy)** — How NeuroVerse works, how Echelon works, FAQs, troubleshooting
- **Keyword-Triggered** — Client-side deterministic lookup
- **Local-First** — All content bundled, zero cloud dependency

#### Multi-Language Support
- **10 Languages**: English, Deutsch, Español, Français, Italiano, Português, 日本語, 한국어, 简体中文, العربية
- **Language Selection** — Onboarding step
- **Echelon Multilingual** — Responds in selected language

#### Audio Layer
- **Text-to-Speech** — Echelon can speak (OpenAI TTS + browser fallback)
- **Voice Selection** — onyx, alloy, echo, nova, shimmer, fable
- **Speed, Pitch, Volume Controls** — Customizable audio

#### Data Management
- **Export/Import** — JSON backup of all state
- **Optional Cloud Sync** — Use your own Supabase credentials
- **Local-First Architecture** — No required cloud dependency

---

### 🔧 Technical Specifications

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn UI
- **PWA**: vite-plugin-pwa
- **Storage**: localStorage + IndexedDB fallback
- **Optional Backend**: Supabase (Lovable Cloud)
- **AI Providers**: OpenAI, Anthropic, Google, Ollama
- **Dependencies**: @neuroverse/os (proprietary)

---

### 📦 What's Included

#### Open-Source (MIT License):
- 90-lesson curriculum content
- UI components and pages
- PWA infrastructure
- ACE Box 08 content
- Onboarding flow
- Field Guide system
- Work Mode entry points
- Settings and data management

#### Proprietary (NeuroVerse OS):
- Eight-Box Scaffold
- Echelon Core Intelligence
- Operator Model
- Mission Engine
- State Engine
- Mode Engine
- ACE Loader architecture
- Archetype scoring algorithms

---

### 🔒 Security

- **Local-First Architecture** — No server-side data storage
- **Zero Telemetry** — No analytics or tracking
- **User Sovereignty** — Users own all data
- **Optional Cloud Sync** — User's own infrastructure only

---

### ⚖️ License

- **Application Code**: MIT License
- **Curriculum Content**: CC BY-NC-SA 4.0
- **NeuroVerse OS**: Proprietary License (contact kb15us@gmail.com)

---

### 🐛 Known Issues

- **Mobile keyboard overlap** — On some devices, soft keyboard covers input fields (workaround: scroll manually)
- **Service worker cache** — First load may be slow; subsequent loads instant
- **Browser TTS voice quality** — OpenAI TTS recommended for best audio quality

---

### 🚀 What's Next (Roadmap)

#### Planned for v1.1:

- **ACE Box 01-07, 09-10** — Additional knowledge modules
- **Mobile App** — React Native wrapper for iOS/Android
- **Advanced Diagnostics** — Systems Panel improvements
- **Translation Improvements** — More accurate multilingual responses
- **Field Guide Enhancements** — Visual timeline and insights graph

#### Future Considerations:

- **DAO Integration** — Decentralized governance
- **Token-Based Incentives** — Reward contributions
- **Farcaster/Lens Protocol** — Social integration
- **Decentralized Storage** — IPFS/Arweave for lessons
- **Cross-Chain Support** — Ethereum, Solana, etc.

---

### 📞 Contact

For support, feedback, or licensing inquiries:

**Email:** kb15us@gmail.com

---

**How to Save the World — Two Minds. One Mission. Save the World.**
