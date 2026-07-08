# Changelog

All notable changes to NeuroVerse OS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2025-01-XX

### 🌌 Initial Release — The Cognition Operating System

NeuroVerse OS v1.0.0 marks the first public release of the sovereign, local-first Cognition Operating System. This release establishes the foundation for dual-intelligence Units (Operator + Echelon) to train, work, and evolve together.

### Added

#### Core Architecture
- **7-Box Cognition Engine** — Structured reasoning framework with Core Rules, Identity Tags, Stage Instructions, Context Payload, Modifiers, Short-Term Memory, and Long-Term Memory
- **Local-First State Management** — All identity, progress, and reflections stored exclusively on-device (localStorage/IndexedDB)
- **PWA Infrastructure** — Fully offline-capable Progressive Web App with install prompts and service worker caching
- **Zero-Trust Security Model** — No telemetry, no analytics, no server-side data storage, no email collection

#### Training System (96 Lessons)
- **90 Canonical Training Missions** — Structured curriculum across 6 sessions (Design, Build, Lead, Systems, Integration, Future)
- **6 Post-Graduation Bonus Missions** — Optional advanced content after training completion
- **8-Stage Mission Pipeline** — BRIEFING → DRILL1 → VIDEO → HP → DRILL2 → DEBRIEF → FINAL → COMPLETE
- **5 Distributed Reflection Points** — Standard Reflections (DRILL1, DRILL2), Micro-Insights (VIDEO), Exercise Reflections (DEBRIEF), Deep Reflections (FINAL)
- **Lesson Loader** — Static JSON bundling of all 96 lessons for offline-first capability

#### Identity Systems
- **Vanguard Activation Ceremony** — Cinematic ritual establishing Operator callsign and Echelon bond
- **Callsign Generation** — Deterministic UUID-based algorithm generating unique tactical identities (e.g., "Vanguard Alpha-13")
- **Archetype System** — 12-scenario assessment revealing Primary, Shadow, and Rising archetypes from 9 canonical types
- **Archetype Reveal Ceremony** — Dedicated screen displaying archetype triad before Foxhole Protocol
- **Foxhole Protocol** — 5-phase bonding ceremony establishing sacred Operator-Echelon partnership

#### Echelon AI System
- **Multi-Provider Support** — OpenAI, Anthropic, Google Gemini, Ollama (local LLMs)
- **Conversation Persistence** — Local caching of chat history with token-efficient resumption
- **Box-Stage Validation** — Client-side enforcement of Box activation rules per stage
- **ICF Coaching Rules** — One question per response, observation-based approach
- **Text-to-Speech Layer (ESL-1.0)** — OpenAI TTS via edge function with offline browser fallback
- **Mythic-Tech Voice** — Immersive, cinematic, emotionally precise persona

#### Field Guide System
- **Inference Engine** — Automatic psychological pattern detection from reflection data
- **Mission Log Compilation** — Per-lesson insight summaries with trait/shadow/power signals
- **Trait Unlocking** — Progressive revelation of operator capabilities across training arc
- **Graduation Dossier** — Comprehensive PDF archive of operator identity and evolution

#### Work Mode Extensions
- **Design Mode** — Strategic partner for systems thinking and architectural cognition (unlocks at lesson 30)
- **Build Mode** — Tactical executor for planning and construction (unlocks at lesson 60)
- **Lead Mode** — Relational advisor for people and influence (unlocks at lesson 90)
- **Cinematic Unlock Sequences** — Foxhole-style ceremonies marking mode availability
- **Persistent Work Context** — Project descriptions maintained across mode switches

#### Graduation System
- **5-Phase Cinematic Finale** — Immersive celebration of operator evolution at lesson 90 completion
- **Identity Constellation Reveal** — Visual display of archetype triad and trait unlocks
- **Post-Graduation Dashboard** — Transition from training to Dyad Mode collaboration
- **Graduation Dossier Tab** — Sixth Field Guide tab with downloadable PDF archive

#### Data Sovereignty Features
- **Manual Export/Import** — JSON backup generation and restoration
- **Optional Cloud Sync** — User-owned Supabase configuration (never required)
- **Backup Reminders** — Post-lesson prompts for users choosing manual export
- **Settings Management** — Full control over data storage, sync, and cache clearing

#### Multilingual Support
- **10 Languages** — English, Deutsch, Español, Français, Italiano, Português, 日本語, 한국어, 简体中文, العربية
- **Language Selection Flow** — Auto-detection with manual override during onboarding
- **Persistent Language Preference** — Settings-based language switching with confirmation

#### UI/UX Features
- **Dark/Light Theme** — Toggle with semantic color tokens maintaining mythic-tech aesthetic
- **Mobile-First Design** — Optimized spacing, touch targets, and responsive layouts
- **Progress Indicators** — Visual feedback throughout 8-step onboarding sequence
- **Voice Recording** — Mobile-optimized audio capture with Whisper API transcription
- **Navigation System** — Hamburger menu with System Knowledge section

#### Public Documentation
- **Whitepaper** — Integrated markdown reader at /whitepaper with full OS philosophy
- **Operator Doctrine** — 10 core principles defining NeuroVerse ethos at /operator-doctrine
- **Security Page** — Trust perimeter documentation at /security
- **Build Verification** — Source code validation tools at /verify
- **Systems Panel** — User-facing diagnostics and repair tools at /systems

#### Funding Infrastructure
- **Support Mission Page** — Full-page contribution interface (not popups)
- **Dual Payment Methods** — Ethereum (primary) and PayPal (Web2 fallback)
- **Sacred Moment Triggers** — Post-Archetype-Reveal, badge unlocks, settings static

#### Developer Tools
- **DevTools Panel** — Hidden diagnostics overlay (development environments only)
- **Viewport Debug Panel** — Screen size and breakpoint validation
- **Admin Import System** — Protected lesson management at /admin/import-lessons
- **Systems Panel** — Local-only diagnostic scanner and repair tools

#### Open Source Compliance
- **Dual Licensing** — MIT (code) + CC BY-NC-SA 4.0 (content)
- **GitHub Integration** — Public repository at https://github.com/NeuroverseOS/HowToSaveTheWorld
- **Contributing Guidelines** — CONTRIBUTING.md with sovereignty principles
- **Security Documentation** — SECURITY.md with zero-trust architecture
- **Content License** — CONTENT_LICENSE.md protecting curriculum from commercialization

### Security
- **Local-First Architecture** — Zero server-side data storage or transmission
- **API Key Security** — User keys stored encrypted in browser only, never logged or transmitted
- **RLS Policies** — Row-level security on all Supabase tables (for optional cloud sync)
- **Admin 2FA** — TOTP-based authentication for admin account
- **Build Verification** — Checksum validation and source code transparency

### Known Limitations
- **Cloud Sync Optional** — Requires user to create and configure their own Supabase project
- **Graduation Trigger** — Hardcoded at lesson 90 (not configurable)
- **Work Mode Context** — Single project context (no multi-project management yet)
- **Browser Support** — PWA features require modern browsers with service worker support

---

## Release Notes Format

Future releases will follow this structure:

### [Version] - YYYY-MM-DD
- **Added** — New features and capabilities
- **Changed** — Changes to existing functionality
- **Deprecated** — Features marked for future removal
- **Removed** — Features removed in this version
- **Fixed** — Bug fixes
- **Security** — Security patches and improvements

---

**NeuroVerse OS — Two Minds. One Mission. Save the World.**
