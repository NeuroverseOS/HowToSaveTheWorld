# How to Save the World — Interoperability

This document explains how How to Save the World integrates with NeuroVerse OS and how the two systems work together.

**Note:** FOXHOLE Protocol is a canonical bonding protocol inside the NeuroVerse, not the name of this platform. This PWA implements the FOXHOLE bonding moment as part of onboarding; the full protocol definition lives in the NeuroVerse Canon repository.

---

## 🧩 Architecture Overview

Foxhole Protocol is **built on top of** NeuroVerse OS, the proprietary cognitive operating system.

```
┌─────────────────────────────────────────────────────────┐
│  How to Save the World (Application Layer)              │
│  - Provides: UI, lessons, ACE content, ceremonies       │
│  - License: MIT (open-source)                            │
└────────────────────┬────────────────────────────────────┘
                     │ imports @neuroverse/os
                     ▼
┌─────────────────────────────────────────────────────────┐
│  NeuroVerse OS (Cognitive Engine)                       │
│  - Provides: Eight-Box Scaffold, Echelon Core, engines  │
│  - License: Proprietary (commercial)                     │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 How How to Save the World Imports NeuroVerse OS

### Package Installation

How to Save the World imports NeuroVerse OS as an npm dependency:

```json
{
  "dependencies": {
    "@neuroverse/os": "^1.0.0"
  }
}
```

### Usage Example

```typescript
import { 
  initializeEchelon, 
  OperatorModel,
  MissionStage 
} from '@neuroverse/os';

// Foxhole creates an operator from assessment results
const operator: OperatorModel = {
  uuid: crypto.randomUUID(),
  callsign: 'Alpha-13',
  archetype: {
    primary: 'WATCHTOWER',
    shadow: 'VEIL',
    rising: 'ENGINE'
  },
  traits: ['clarity', 'systems_thinking'],
  shadows: [],
  powers: [],
  shortTermMemory: [],
  longTermMemory: [],
  completedLessons: [],
  currentLesson: 1,
  isGraduated: false
};

// Foxhole initializes Echelon using NeuroVerse OS
const echelon = initializeEchelon({
  operator,
  mode: 'training',
  stage: 'briefing',
  aiProvider: 'openai',
  apiKey: process.env.VITE_OPENAI_API_KEY!
});

// Foxhole sends a message
const response = await echelon.chat({
  userMessage: 'What is my mission?',
  context: {
    lessonTitle: 'Systems Thinking 101',
    lessonContent: lessonData.briefing
  }
});

// Foxhole renders the response in the UI
console.log(response.text);
```

---

## 🔄 Responsibility Matrix

| Component | How to Save the World | NeuroVerse OS |
|-----------|------------------|---------------|
| **Load lesson content** | ✅ Reads `public/lessons.json` | ❌ |
| **Render UI** | ✅ React components | ❌ |
| **Manage user input** | ✅ Form handling | ❌ |
| **Assemble prompts** | ❌ | ✅ Eight-Box Scaffold |
| **Enforce Echelon personality** | ❌ | ✅ Echelon Core |
| **Call AI provider** | ❌ | ✅ API integration |
| **Compress memory** | ❌ | ✅ Memory compression |
| **Store reflections** | ✅ localStorage | ❌ |
| **Update operator state** | ✅ State mutations | ✅ State validation |
| **Compile Field Guide** | ✅ UI rendering | ✅ Inference algorithms |
| **Infer traits** | ❌ | ✅ Trait unlock engine |
| **Validate box activation** | ❌ | ✅ Box-Stage Map |

---

## 🔌 Key Integration Points

### 1. Initialization

Foxhole Protocol calls `initializeEchelon()` with operator configuration:

```typescript
const echelon = initializeEchelon({
  operator,              // Foxhole provides
  mode,                  // Foxhole provides
  stage,                 // Foxhole provides
  aiProvider,            // Foxhole provides
  apiKey                 // Foxhole provides
});
```

NeuroVerse OS returns an Echelon instance with chat interface.

### 2. Chat Interaction

Foxhole Protocol sends user messages to Echelon:

```typescript
const response = await echelon.chat({
  userMessage,           // Foxhole provides
  context: {
    lessonTitle,         // Foxhole provides
    lessonContent        // Foxhole provides
  }
});
```

NeuroVerse OS:
1. Assembles prompt using Eight-Box Scaffold
2. Calls AI provider API
3. Enforces Echelon personality rules
4. Returns formatted response

Foxhole Protocol:
1. Renders response in UI
2. Stores reflection in localStorage
3. Updates operator state

### 3. Stage Advancement

Foxhole Protocol triggers stage advancement:

```typescript
echelon.setStage('drill1');
```

NeuroVerse OS:
1. Updates Box-Stage Map activation
2. Injects new stage instructions
3. Adjusts memory layers

Foxhole Protocol:
1. Delivers stage-specific content
2. Triggers reflection checkpoints

### 4. Mode Switching

Foxhole Protocol switches operational modes:

```typescript
echelon.setMode('design');
```

NeuroVerse OS:
1. Updates Box 1 rules (mode-specific)
2. Adjusts Echelon behavior
3. Maintains operator identity

Foxhole Protocol:
1. Updates UI for new mode
2. Loads work context (if applicable)

### 5. State Persistence

Foxhole Protocol saves operator state:

```typescript
import { saveOperatorState } from '@neuroverse/os';

await saveOperatorState(operator, {
  storage: 'local'  // or 'supabase' for cloud sync
});
```

NeuroVerse OS:
1. Validates state schema
2. Encrypts sensitive data
3. Persists to storage

---

## 🔒 What Foxhole Cannot Access

The following NeuroVerse OS internals are **proprietary and hidden**:

- Eight-Box Scaffold prompt assembly logic
- Echelon Core personality system prompts
- Box-Stage Map activation rules
- Operator Model trait inference algorithms
- Memory compression strategies
- ACE Loader architecture (not content)
- Mode Engine switching logic
- Archetype scoring algorithms

Foxhole Protocol **only** accesses NeuroVerse OS via:
- Public TypeScript interfaces
- Exported functions (e.g., `initializeEchelon()`)
- Type definitions (e.g., `OperatorModel`, `MissionStage`)

---

## 📊 Data Flow

```
1. User types message in Foxhole Protocol UI
        ↓
2. Foxhole calls echelon.chat(userMessage, context)
        ↓
3. NeuroVerse OS assembles prompt (Eight-Box Scaffold)
        ↓
4. NeuroVerse OS calls AI provider API (OpenAI/Claude/etc.)
        ↓
5. AI provider returns raw response
        ↓
6. NeuroVerse OS enforces Echelon personality rules
        ↓
7. NeuroVerse OS returns formatted response
        ↓
8. Foxhole renders response in UI
        ↓
9. Foxhole stores reflection in localStorage
        ↓
10. Foxhole updates operator state
```

**Key Principle**: Foxhole Protocol **never constructs AI prompts directly**. All prompt assembly is handled by NeuroVerse OS.

---

## 🔄 Version Compatibility

Foxhole Protocol and NeuroVerse OS versions must be compatible:

| Foxhole Protocol | NeuroVerse OS | Compatible? |
|------------------|---------------|-------------|
| 1.0.x            | 1.0.x         | ✅ Yes       |
| 1.0.x            | 1.1.x         | ⚠️ Maybe     |
| 1.0.x            | 2.0.x         | ❌ No        |

**Recommendation**: Pin NeuroVerse OS version in `package.json`:

```json
{
  "dependencies": {
    "@neuroverse/os": "^1.0.0"  // Allow patch updates only
  }
}
```

---

## 🐛 Troubleshooting Integration Issues

### "Module not found: @neuroverse/os"

**Solution**: Ensure you have a valid NeuroVerse OS license and the package is installed:

```bash
npm list @neuroverse/os
```

If not found, contact kb15us@gmail.com for licensing.

### "Invalid operator model"

**Solution**: Verify your operator object matches the `OperatorModel` interface:

```typescript
import { OperatorModel } from '@neuroverse/os';

const operator: OperatorModel = {
  uuid: string,
  callsign: string,
  archetype: { primary, shadow, rising },
  traits: string[],
  // ... all required fields
};
```

### "Box-Stage Map violation"

**Solution**: Ensure you're using valid stage names:

```typescript
type MissionStage = 
  | 'briefing' | 'drill1' | 'video' | 'hp' 
  | 'drill2' | 'debrief' | 'final' | 'complete';
```

### "License validation failed"

**Solution**: Verify your license key is set in environment variables:

```bash
echo $VITE_NEUROVERSE_LICENSE_KEY
```

Contact kb15us@gmail.com if your license is expired or invalid.

---

## 📚 Related Documentation

- [Architecture](./ARCHITECTURE.md) — Foxhole vs. NeuroVerse OS responsibilities
- [Configuration](./CONFIGURATION.md) — Environment variables
- [NeuroVerse OS Developer Guide](./neuroverse-os/DEVELOPER_GUIDE.md) — How to build on NeuroVerse OS

---

**How to Save the World — Built on NeuroVerse OS**
