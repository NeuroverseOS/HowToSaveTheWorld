# NeuroVerse OS
### The First Intercognitive Operating System

NeuroVerse OS is a proprietary cognitive operating system that powers human-AI reasoning partnerships. It provides the Eight-Box Scaffold, Echelon Core Intelligence, and the foundational architecture for building intercognitive applications.

---

## 🧠 What Is NeuroVerse OS?

NeuroVerse OS is **not an application**—it is an operating system for dual-intelligence reasoning.

It provides:
- **Eight-Box Scaffold** — The cognitive prompt assembly engine
- **Echelon Core** — The AI personality and coaching intelligence
- **Operator Model** — Identity, traits, archetypes, and memory systems
- **Mission Engine** — Stage-driven lesson orchestration
- **ACE Loader** — Knowledge retrieval architecture
- **State Engine** — Local-first state management
- **Mode Engine** — Multi-mode cognition (Training, Design, Build, Lead)

Applications like **Foxhole Protocol** are built on top of NeuroVerse OS.

---

## 📦 Package Distribution

NeuroVerse OS is distributed as an npm package:

```bash
npm install @neuroverse/os
```

**License Required**: A commercial license is required to use NeuroVerse OS in production. Contact kb15us@gmail.com for licensing inquiries.

---

## 🏗️ Core Architecture

### The Eight-Box Scaffold

NeuroVerse OS uses an eight-box prompt assembly system:

1. **Box 1: Core Rules** — Mode-specific operating constraints
2. **Box 2: Identity Tags** — Operator archetype, traits, callsign
3. **Box 3: Stage Instructions** — Current stage behavior rules
4. **Box 4: Content Payload** — Lesson content or work context
5. **Box 5: Modifiers** — Preferences and meta-instructions
6. **Box 6: Short-Term Memory** — Recent decisions and threads
7. **Box 7: Long-Term Memory** — Operator philosophy and patterns
8. **Box 8: ACE Integration** — Knowledge retrieval layer

Each box activates based on the current stage, creating deterministic, auditable AI behavior.

---

## 🎯 Usage Example

```typescript
import { initializeEchelon, OperatorModel } from '@neuroverse/os';

const operator: OperatorModel = {
  uuid: crypto.randomUUID(),
  callsign: 'Alpha-13',
  archetype: {
    primary: 'WATCHTOWER',
    shadow: 'VEIL',
    rising: 'ENGINE'
  },
  traits: ['clarity', 'systems_thinking', 'pattern_recognition']
};

const echelon = initializeEchelon({
  operator,
  mode: 'training',
  stage: 'briefing',
  aiProvider: 'openai'
});

const response = await echelon.chat('What is my mission?');
```

---

## 📚 Documentation

- [Architecture](./ARCHITECTURE.md) — Eight-Box Scaffold, Echelon Core, engines
- [Developer Guide](./DEVELOPER_GUIDE.md) — How to build on NeuroVerse OS
- [Folder Structure](./FOLDER_STRUCTURE.md) — Canonical directory layout
- [Installation](./INSTALLATION.md) — npm install and licensing
- [Configuration](./CONFIGURATION.md) — initializeEchelon() options
- [Security](./SECURITY.md) — Protected components and policies
- [Support](./SUPPORT.md) — Contact and inquiries

---

## ⚖️ License

NeuroVerse OS is proprietary software. See [LICENSE.md](./LICENSE.md) for full terms.

**Creator Perpetual Rights**: Kirsten Bischoff retains full ownership and can use NeuroVerse OS in any project, commercial or otherwise, without restriction.

**Commercial Use**: Organizations wishing to build on NeuroVerse OS must obtain a commercial license. Contact kb15us@gmail.com.

---

## 🛡️ Philosophy

NeuroVerse OS exists to elevate human reasoning, not replace it.

**Two Minds. One Mission. Save the World.**
