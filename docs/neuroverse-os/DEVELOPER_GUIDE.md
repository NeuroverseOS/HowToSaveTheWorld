# NeuroVerse OS — Developer Guide

This guide shows you how to build applications on top of NeuroVerse OS.

---

## 📦 Installation

### 1. Obtain a License

Contact kb15us@gmail.com to obtain a commercial license for NeuroVerse OS.

### 2. Install the Package

```bash
npm install @neuroverse/os
```

### 3. Add License Key

Store your license key in environment variables:

```bash
# .env
NEUROVERSE_LICENSE_KEY=your_license_key_here
```

---

## 🚀 Quick Start

### Initialize Echelon

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
  traits: ['clarity', 'systems_thinking'],
  shadows: [],
  powers: [],
  shortTermMemory: [],
  longTermMemory: [],
  completedLessons: [],
  currentLesson: 1,
  isGraduated: false
};

const echelon = initializeEchelon({
  operator,
  mode: 'training',
  stage: 'briefing',
  aiProvider: 'openai',
  apiKey: process.env.OPENAI_API_KEY
});
```

### Send a Message

```typescript
const response = await echelon.chat({
  userMessage: 'What is my mission?',
  context: {
    lessonTitle: 'Systems Thinking 101',
    lessonContent: 'You will learn to see patterns...'
  }
});

console.log(response.text);
```

---

## 🧠 Core Concepts

### Operator Model

The Operator Model represents a user's identity, traits, and memory:

```typescript
interface OperatorModel {
  uuid: string;                    // Unique identifier
  callsign: string;                // e.g., "Alpha-13"
  
  archetype: {
    primary: ArchetypeType;        // WATCHTOWER | WEAVER | VEIL | etc.
    shadow: ArchetypeType;
    rising: ArchetypeType;
  };
  
  traits: string[];                // Unlocked capabilities
  shadows: string[];               // Revealed weaknesses
  powers: string[];                // Emergent strengths
  
  shortTermMemory: string[];       // Last 10 decisions
  longTermMemory: string[];        // Philosophy statements
  
  completedLessons: number[];
  currentLesson: number;
  isGraduated: boolean;
}
```

### Operational Modes

NeuroVerse OS supports four operational modes:

| Mode | Purpose | Box 1 Focus |
|------|---------|-------------|
| `training` | Lesson delivery and coaching | Pattern recognition, reflection |
| `design` | Strategic thinking | "What form could this take?" |
| `build` | Execution planning | "What's the smallest version?" |
| `lead` | People leadership | "What will they feel?" |

Switch modes dynamically:

```typescript
echelon.setMode('design');
```

### Mission Stages

Training mode uses 7 mission stages:

```typescript
type MissionStage = 
  | 'briefing'    // Echelon introduces mission
  | 'drill1'      // First reflection exercise
  | 'video'       // Field footage (optional)
  | 'hp'          // Head-Practical integration
  | 'drill2'      // Second reflection exercise
  | 'debrief'     // Mission summary
  | 'final'       // Deep reflection
  | 'complete';   // Field Guide compilation
```

Advance stages programmatically:

```typescript
echelon.advanceStage('drill1');
```

---

## 🎨 Customization

### Custom Box 1 Rules

Override default mode rules:

```typescript
const echelon = initializeEchelon({
  operator,
  mode: 'custom',
  customBox1Rules: `
    You are a strategic advisor.
    You ask questions that reveal hidden assumptions.
    You never provide solutions—only frameworks.
  `
});
```

### Custom ACE Boxes

Add custom knowledge modules:

```typescript
import { registerACEBox } from '@neuroverse/os';

registerACEBox({
  id: 'ACE-11',
  name: 'Industry Knowledge',
  triggers: ['explain market dynamics', 'what is industry trend'],
  entries: [
    {
      id: 'market-01',
      title: 'Market Dynamics 101',
      content: 'Markets are driven by supply and demand...',
      tags: ['economics', 'market']
    }
  ]
});
```

---

## 📊 State Management

### Save Operator State

```typescript
import { saveOperatorState } from '@neuroverse/os';

await saveOperatorState(operator, {
  storage: 'local',  // or 'supabase' if syncing
  encrypt: true
});
```

### Load Operator State

```typescript
import { loadOperatorState } from '@neuroverse/os';

const operator = await loadOperatorState('operator-uuid', {
  storage: 'local'
});
```

---

## 🧩 ACE Integration

### Check for System Literacy Triggers

```typescript
import { detectSystemLiteracyTrigger } from '@neuroverse/os';

const userMessage = "How does this work?";
const trigger = detectSystemLiteracyTrigger(userMessage);

if (trigger) {
  const entries = await getRelevantEntries(trigger.type);
  // Pass entries to Echelon with system_literacy mode flag
}
```

### Retrieve ACE Content

```typescript
import { loadACEBox08 } from '@neuroverse/os';

const box08 = await loadACEBox08();
const faqEntries = box08.content.faq;
```

---

## 🔧 Advanced Usage

### Multi-Turn Conversations

```typescript
const conversation = [];

// Turn 1
const response1 = await echelon.chat({
  userMessage: 'What should I focus on?',
  conversationHistory: conversation
});
conversation.push({ role: 'user', content: 'What should I focus on?' });
conversation.push({ role: 'assistant', content: response1.text });

// Turn 2
const response2 = await echelon.chat({
  userMessage: 'Tell me more about that.',
  conversationHistory: conversation
});
```

### Field Guide Compilation

```typescript
import { compileMissionLog } from '@neuroverse/os';

const reflections = [
  { stage: 'drill1', operatorPrimary: 'I noticed patterns in...' },
  { stage: 'drill2', operatorPrimary: 'This connects to...' }
];

const missionLog = compileMissionLog(lessonId, lessonTitle, reflections);
console.log(missionLog.insightSummary);
console.log(missionLog.traitSignals);  // ['systems_thinking', 'pattern_recognition']
```

---

## 🛡️ Best Practices

### 1. Always Validate License

```typescript
import { validateLicense } from '@neuroverse/os';

const isValid = await validateLicense(process.env.NEUROVERSE_LICENSE_KEY);
if (!isValid) {
  throw new Error('Invalid NeuroVerse OS license');
}
```

### 2. Store Operator Data Locally

Never send operator identity, traits, or memory to external servers without explicit user consent.

### 3. Respect Mode Boundaries

Each mode has distinct Box 1 rules. Don't mix mode behaviors (e.g., asking coaching questions in Build Mode).

### 4. Use Stage-Driven Content Delivery

Always advance stages after user completes each phase. Don't skip stages.

### 5. Implement Graceful Degradation

If AI provider fails, fall back to cached responses or local processing.

---

## 📚 API Reference

### Core Functions

```typescript
// Initialization
initializeEchelon(config: EchelonConfig): EchelonInstance

// Chat
echelon.chat(options: ChatOptions): Promise<ChatResponse>

// State Management
saveOperatorState(operator: OperatorModel, options: SaveOptions): Promise<void>
loadOperatorState(uuid: string, options: LoadOptions): Promise<OperatorModel>

// ACE Loader
loadACEBox08(): Promise<ACEBox>
detectSystemLiteracyTrigger(message: string): Trigger | null
getRelevantEntries(triggerType: string): Promise<ACEEntry[]>

// Field Guide
compileMissionLog(lessonId: number, title: string, reflections: ReflectionEntry[]): MissionLogEntry
```

---

## 🐛 Troubleshooting

### "Invalid License Key"

Ensure your license key is correctly set in environment variables:

```bash
echo $NEUROVERSE_LICENSE_KEY
```

Contact kb15us@gmail.com if your key is expired or invalid.

### "Box-Stage Map Violation"

Check that you're using valid stage names and that the Box-Stage Map is loaded:

```typescript
import { getActiveBoxesForStage } from '@neuroverse/os';

const activeBoxes = getActiveBoxesForStage('briefing');
console.log(activeBoxes);  // ['Box1', 'Box2', 'Box3', 'Box4', 'Box6']
```

### "ACE Box Not Found"

Ensure ACE content is bundled in `/public/ace/` and accessible:

```bash
ls public/ace/box08_system_literacy/
```

---

## 📞 Support

For technical support, architecture questions, or licensing issues:

**Email**: kb15us@gmail.com

---

**NeuroVerse OS — Two Minds. One Mission. Save the World.**
