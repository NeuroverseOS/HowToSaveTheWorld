# Contributing to How to Save the World

Thank you for your interest in contributing to How to Save the World — a decentralized leadership training program built on NeuroVerse OS.

**Note:** FOXHOLE Protocol is a canonical bonding protocol inside the NeuroVerse, not the name of this platform. This PWA implements the FOXHOLE bonding moment as part of onboarding; the full protocol definition lives in the NeuroVerse Canon repository.

---

## 🧠 Project Philosophy

Before contributing, please understand the **core principles** that guide How to Save the World:

### 1. **Built on NeuroVerse OS**
- How to Save the World is **fully open source** (MIT License) — the application AND the NeuroVerse OS engine it runs on
- You can contribute to the UI, content, PWA features, and application logic
- Changes to NeuroVerse OS core (Eight-Box Engine, Echelon Core, Mission Engine) are welcome but held to a higher review bar — they are the cognitive heart of the system and require maintainer approval

### 2. **Sovereignty First**
- All user data, state, and identity remain **on-device** (localStorage/IndexedDB)
- No telemetry, no analytics, no server-side tracking
- Users control their own AI provider keys
- Cloud sync is **optional** and uses user's own infrastructure

### 3. **Zero-Trust Architecture**
- No email collection, no required authentication
- Open-source code is the trust layer
- Security through architecture, not obfuscation
- All critical operations happen client-side

### 4. **Local-First, Offline-Capable**
- Lessons bundled as static JSON (`/public/lessons.json`)
- PWA works fully offline after initial load
- No runtime Supabase dependency for core functionality
- Optional cloud sync for backup only

### 5. **Immersion Over Convenience**
- Echelon's voice is **mythic-tech, cinematic, precise**
- No slang, no emojis in narrative (unless specified)
- No "chatification" or casual tone
- The training is immersive, not gamified

### 6. **Canonical Architecture**
- 90-mission training curriculum is fixed (lessons 1-90)
- 6 post-graduation bonus missions (lessons 91-96)
- Archetype system (9 canonical archetypes) is non-negotiable
- Stage progression (BRIEFING → DRILL1 → HP → DRILL2 → DEBRIEF → FINAL → COMPLETE) is mandatory
- FOXHOLE Protocol (bonding protocol) is canonical and non-configurable

---

## 🛡️ Non-Negotiable Constraints

The following **CANNOT** be changed without fundamentally breaking the project:

❌ Adding server-side data collection or telemetry  
❌ Requiring authentication for core functionality  
❌ Making cloud sync mandatory  
❌ Altering Echelon's voice or coaching rules  
❌ Modifying NeuroVerse OS internals (Eight-Box Engine, Echelon Core, Mission Engine)  
❌ Changing the canonical 9 archetypes  
❌ Breaking offline-first capability  
❌ Introducing surveillance or tracking mechanisms  
❌ Removing attribution to NeuroVerse OS or violating its license

---

## ✅ What We Welcome

### Code Contributions
- Performance optimizations
- Bug fixes (especially mobile/PWA edge cases)
- Accessibility improvements (ARIA, keyboard navigation, screen readers)
- UI/UX polish (respecting the mythic-tech aesthetic)
- New AI provider integrations (keeping sovereignty intact)
- Internationalization improvements (beyond current 10 languages)
- Developer tooling (testing, diagnostics, build optimizations)
- ACE Box content expansions (new knowledge modules)
- Additional Work Modes (e.g., Research Mode, Strategy Mode)

### Documentation
- Technical architecture documentation
- Self-hosting guides and tutorials
- Security audits and vulnerability reports
- Translation improvements for existing languages
- Community guides (how to use Foxhole Protocol effectively)
- Integration guides for Web3/DAO tooling

### Content Contributions
⚠️ **Curriculum content** (90 training missions, archetypes, Echelon dialogue) is covered by **CC BY-NC-SA 4.0** license (see `CONTENT_LICENSE.md`). Curriculum changes require project maintainer approval to preserve psychological integrity and narrative coherence. FOXHOLE Protocol ceremony text is canonical and cannot be modified.

### Engine Contributions
⚠️ **NeuroVerse OS modifications** — The underlying cognitive operating system (Eight-Box Scaffold, Echelon Core, Mission Engine, ACE Loader architecture) is open source like everything else, but it is the cognitive heart of the platform: changes here require explicit maintainer approval and a clear rationale. See `docs/neuroverse-os/` for OS documentation.

---

## 🚀 How to Contribute

### 1. Fork & Clone
```bash
git clone https://github.com/NeuroverseOS/HowToSaveTheWorld.git
cd HowToSaveTheWorld
npm install
npm run dev
```

⚠️ **Note**: To run How to Save the World locally, you'll need a NeuroVerse OS license. See `docs/INSTALLATION.md` for details.

### 2. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 3. Make Your Changes
- Follow existing code style (TypeScript, React functional components, Tailwind CSS)
- Test locally (especially PWA functionality, offline mode, localStorage behavior)
- Ensure mobile responsiveness (NeuroVerse is mobile-first)
- Preserve the mythic-tech aesthetic (dark theme, grid effects, cinematic animations)

### 4. Test Thoroughly
- Test PWA installation
- Test offline functionality
- Test localStorage persistence
- Test across browsers (Chrome, Firefox, Safari, mobile browsers)
- Verify no console errors or warnings

### 5. Submit a Pull Request
- Provide a clear description of what changed and why
- Reference any related issues
- Explain how you tested the changes
- Ensure your PR respects the **Non-Negotiable Constraints** above

---

## 🐛 Bug Reports

When reporting bugs, please include:
- Browser and OS version
- Steps to reproduce
- Expected vs. actual behavior
- Console errors (if any)
- Screenshots or screen recordings (if relevant)
- Whether you're running locally or accessing the deployed PWA

---

## 🔐 Security Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

See `SECURITY.md` for responsible disclosure procedures.

---

## 📜 Code Style Guidelines

- **TypeScript** for all logic
- **React functional components** with hooks (no class components)
- **Tailwind CSS** for styling (use semantic tokens from `index.css`)
- **No inline styles** (use Tailwind utilities)
- **Mobile-first** responsive design
- **Accessible** (proper ARIA labels, keyboard navigation)
- **Concise** (avoid over-engineering, keep it simple)

---

## 🧪 Testing Principles

- **Local-first testing**: Verify functionality works offline
- **State persistence**: Ensure localStorage survives page refresh
- **PWA compliance**: Test installation, offline mode, service worker
- **Cross-device**: Test on mobile (iOS Safari, Android Chrome)
- **Sovereignty verification**: Confirm no unintended network calls

---

## 🌐 License

By contributing to How to Save the World, you agree that:

- Your **code contributions** to How to Save the World (application and NeuroVerse OS engine alike) will be licensed under the **MIT License**
- Any **curriculum content contributions** will be licensed under **CC BY-NC-SA 4.0** (see `CONTENT_LICENSE.md`)
- Your contributions will maintain proper attribution as required by the licenses

---

## 🙏 Questions?

Open a GitHub Discussion or review existing issues before starting work on major changes.

**GitHub Repository:** https://github.com/NeuroverseOS/HowToSaveTheWorld

---

**How to Save the World — Decentralized Leadership Training**  
**Built on NeuroVerse OS — Two Minds. One Mission. Save the World.**
