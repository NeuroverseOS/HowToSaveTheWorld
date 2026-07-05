# NeuroVerse OS — Configuration

This document describes all configuration options for NeuroVerse OS.

---

## 🔧 initializeEchelon()

The core function to initialize an Echelon instance.

### Signature

```typescript
function initializeEchelon(config: EchelonConfig): EchelonInstance
```

### EchelonConfig Interface

```typescript
interface EchelonConfig {
  // Required
  operator: OperatorModel;              // Operator identity and memory
  mode: OperationalMode;                // training | design | build | lead
  stage: MissionStage;                  // briefing | drill1 | hp | etc.
  aiProvider: AIProvider;               // openai | anthropic | google | ollama
  apiKey: string;                       // AI provider API key
  
  // Optional
  customBox1Rules?: string;             // Override default mode rules
  enableACE?: boolean;                  // Enable ACE knowledge retrieval (default: true)
  enableSpeech?: boolean;               // Enable text-to-speech (default: false)
  voice?: VoiceModel;                   // TTS voice (default: 'onyx')
  temperature?: number;                 // AI temperature (default: 0.7)
  maxTokens?: number;                   // Max response tokens (default: 2000)
  language?: string;                    // Response language (default: 'en')
  
  // Advanced
  boxStageMap?: BoxStageMap;            // Custom box activation rules
  memoryCompression?: boolean;          // Compress memory layers (default: true)
  persistState?: boolean;               // Auto-save state to localStorage (default: true)
  debugMode?: boolean;                  // Enable debug logging (default: false)
}
```

---

## 🎯 Core Configuration

### Operator Model

The operator's identity, traits, and memory:

```typescript
const operator: OperatorModel = {
  uuid: crypto.randomUUID(),
  callsign: 'Alpha-13',
  
  archetype: {
    primary: 'WATCHTOWER',
    shadow: 'VEIL',
    rising: 'ENGINE'
  },
  
  traits: ['clarity', 'systems_thinking'],
  shadows: ['analysis_paralysis'],
  powers: ['strategic_foresight'],
  
  shortTermMemory: [
    'Operator recognized pattern in chaos',
    'Decision made under pressure'
  ],
  
  longTermMemory: [
    'I believe in building systems that empower others'
  ],
  
  completedLessons: [1, 2, 3],
  currentLesson: 4,
  isGraduated: false
};
```

### Operational Mode

| Mode | Use Case | Box 1 Focus |
|------|----------|-------------|
| `training` | Lesson delivery, coaching | Reflection, pattern recognition |
| `design` | Strategic thinking, systems design | "What form could this take?" |
| `build` | Execution planning, task breakdown | "What's the smallest version?" |
| `lead` | People leadership, influence | "What will they feel?" |

```typescript
const echelon = initializeEchelon({
  operator,
  mode: 'design',  // Switch to Design Mode
  stage: 'briefing',
  aiProvider: 'openai',
  apiKey: process.env.OPENAI_API_KEY!
});
```

### Mission Stage

7-stage mission pipeline for Training Mode:

```typescript
type MissionStage = 
  | 'briefing'    // Echelon introduces mission
  | 'drill1'      // First reflection exercise
  | 'video'       // Field footage (optional)
  | 'hp'          // Head-Practical integration
  | 'drill2'      // Second reflection exercise
  | 'debrief'     // Mission summary
  | 'final';      // Deep reflection
```

---

## 🤖 AI Provider Configuration

### OpenAI

```typescript
const echelon = initializeEchelon({
  operator,
  mode: 'training',
  stage: 'briefing',
  aiProvider: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
  temperature: 0.7,
  maxTokens: 2000
});
```

### Anthropic (Claude)

```typescript
const echelon = initializeEchelon({
  operator,
  mode: 'training',
  stage: 'briefing',
  aiProvider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY!,
  temperature: 0.7,
  maxTokens: 2000
});
```

### Google (Gemini)

```typescript
const echelon = initializeEchelon({
  operator,
  mode: 'training',
  stage: 'briefing',
  aiProvider: 'google',
  apiKey: process.env.GOOGLE_API_KEY!,
  temperature: 0.7,
  maxTokens: 2000
});
```

### Local LLM (Ollama)

```typescript
const echelon = initializeEchelon({
  operator,
  mode: 'training',
  stage: 'briefing',
  aiProvider: 'ollama',
  apiKey: '',  // Not required for local
  temperature: 0.7,
  maxTokens: 2000
});
```

---

## 🎨 Customization Options

### Custom Box 1 Rules

Override default mode rules with custom instructions:

```typescript
const echelon = initializeEchelon({
  operator,
  mode: 'custom',
  stage: 'briefing',
  aiProvider: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
  customBox1Rules: `
    You are a strategic advisor for Web3 founders.
    You ask questions that reveal hidden assumptions about decentralization.
    You never provide solutions—only frameworks.
    You maintain a calm, analytical tone.
  `
});
```

### Enable ACE Knowledge Retrieval

```typescript
const echelon = initializeEchelon({
  operator,
  mode: 'training',
  stage: 'briefing',
  aiProvider: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
  enableACE: true  // Default: true
});
```

### Enable Text-to-Speech

```typescript
const echelon = initializeEchelon({
  operator,
  mode: 'training',
  stage: 'briefing',
  aiProvider: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
  enableSpeech: true,
  voice: 'onyx'  // onyx | alloy | echo | nova | shimmer | fable
});
```

### Language Configuration

```typescript
const echelon = initializeEchelon({
  operator,
  mode: 'training',
  stage: 'briefing',
  aiProvider: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
  language: 'es'  // Spanish responses
});
```

Supported languages:
- `en` — English
- `de` — Deutsch
- `es` — Español
- `fr` — Français
- `it` — Italiano
- `pt` — Português
- `ja` — 日本語
- `ko` — 한국어
- `zh` — 简体中文
- `ar` — العربية

---

## 🔬 Advanced Configuration

### Custom Box-Stage Map

Override default box activation rules:

```typescript
const customMap: BoxStageMap = {
  briefing: ['Box1', 'Box2', 'Box3', 'Box4', 'Box6', 'Box8'],
  drill1: ['Box1', 'Box2', 'Box3', 'Box4', 'Box5', 'Box6', 'Box8']
};

const echelon = initializeEchelon({
  operator,
  mode: 'training',
  stage: 'briefing',
  aiProvider: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
  boxStageMap: customMap
});
```

### Memory Compression

Compress memory layers to reduce token usage:

```typescript
const echelon = initializeEchelon({
  operator,
  mode: 'training',
  stage: 'briefing',
  aiProvider: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
  memoryCompression: true  // Default: true
});
```

When enabled:
- Short-term memory limited to last 10 entries
- Long-term memory summarized into core philosophy statements
- Conversation history compressed to last 5 turns

### Auto-Persist State

Automatically save operator state to localStorage after each interaction:

```typescript
const echelon = initializeEchelon({
  operator,
  mode: 'training',
  stage: 'briefing',
  aiProvider: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
  persistState: true  // Default: true
});
```

### Debug Mode

Enable verbose logging for development:

```typescript
const echelon = initializeEchelon({
  operator,
  mode: 'training',
  stage: 'briefing',
  aiProvider: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
  debugMode: true  // Default: false
});
```

Output includes:
- Box activation logs
- Prompt assembly details
- Token usage stats
- Memory compression metrics

---

## 🔄 Runtime Configuration Changes

### Switch Mode

```typescript
echelon.setMode('design');
```

### Switch Stage

```typescript
echelon.setStage('drill1');
```

### Update Operator

```typescript
echelon.updateOperator({
  traits: [...operator.traits, 'strategic_thinking'],
  completedLessons: [...operator.completedLessons, 5]
});
```

### Change Voice

```typescript
echelon.setVoice('nova');
```

---

## 📞 Support

For configuration questions or advanced use cases:

**Email**: kb15us@gmail.com

---

**NeuroVerse OS — Two Minds. One Mission. Save the World.**
