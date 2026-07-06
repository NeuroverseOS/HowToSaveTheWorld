# Stage Engine Specification

> **Canon note (2026-07):** the kernel is now the **Eight-Box Kernel** —
> Box 8 (World State, campaign continuity) joined the original seven.
> This document predates Box 8 and is kept as the historical spec;
> the living description is [HOW_ECHELON_WORKS.md](./HOW_ECHELON_WORKS.md).

**Mission Engine Subsystem #2**

## Overview

The Stage Engine controls the 7-box protocol flow for missions in the NeuroVerse OS. It ensures proper stage sequencing, content filtering, and transition logic.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     STAGE ENGINE                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Stage    │ ─> │ Content  │ ─> │ Prompt   │              │
│  │ Control  │    │ Filter   │    │ Assembly │              │
│  └──────────┘    └──────────┘    └──────────┘              │
│                                                               │
│  Briefing → Drill1 → Video → HP → Drill2 → Debrief → Final  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## The 7-Box Protocol

### Stage Sequence

```
1. BRIEFING   → Mission setup, context setting
2. DRILL1     → Personal mapping (first reflection)
3. VIDEO      → Visual intel (operator watches independently)
4. HP         → Head + Practical integration
5. DRILL2     → Deepening (second reflection)
6. DEBRIEF    → Synthesis and acknowledgment
7. FINAL      → Final anchor (Field Guide input)
8. COMPLETE   → Mission complete
```

### Content Filtering Per Stage

Each stage exposes **ONLY** the relevant lesson fields:

| Stage | Exposed Fields |
|-------|---------------|
| **BRIEFING** | `briefing`, `echelon_opening`, `lesson_title`, `section_name` |
| **DRILL1** | `drill1_prompt` |
| **VIDEO** | `video_url` (no AI content) |
| **HP** | `head`, `practical` |
| **DRILL2** | `drill2_prompt` |
| **DEBRIEF** | `debrief` |
| **FINAL** | `final_question`, `field_guide_prompt` |
| **COMPLETE** | `echelon_closing` |

**Critical Rule:** Future content is NEVER leaked to earlier stages. This prevents:
- Operators seeing answers before questions
- Echelon referencing content not yet introduced
- Breaking the designed pedagogical flow

## Stage Completion Criteria

Each stage has specific completion requirements:

```typescript
interface StageCompletionCriteria {
  requiresUserInput: boolean;       // Must operator respond?
  requiresVideoCompletion: boolean; // Must video finish?
  requiresEchelonResponse: boolean; // Must Echelon respond?
  minimumInteractions: number;      // How many exchanges?
}
```

### Example: DRILL1

```typescript
{
  requiresUserInput: true,        // Operator must answer drill
  requiresVideoCompletion: false, // No video at this stage
  requiresEchelonResponse: true,  // Echelon must acknowledge
  minimumInteractions: 1          // One Q&A cycle
}
```

## Stage Transitions

### Transition Rules

1. **Sequential Only:** Can only advance to next stage in sequence
2. **No Skipping:** Cannot skip stages
3. **No Reversing:** Cannot go backwards (except in replay mode)
4. **Validation:** Each transition is validated before execution

### Transition Function

```typescript
function advanceToNextStage(userResponse?: string): void {
  const nextStage = getNextStage(currentStage);
  
  if (!nextStage) {
    console.warn('Cannot advance - already at final stage');
    return;
  }
  
  // Record completion
  recordStageCompletion(currentStage, userResponse);
  
  // Update state
  setCurrentStage(nextStage);
  
  // Log transition
  console.log(`[STAGE ENGINE] ${currentStage} → ${nextStage}`);
}
```

## Integration with Prompt Assembly

The Stage Engine provides filtered content to the 7-box prompt system:

```typescript
// Stage Engine filters content
const stageContent = getStageContent(lesson, currentStage);

// Prompt assembly uses filtered content
const prompt = assembleEchelonPrompt({
  callsign: "ATLAS",
  traitTags: ["visionary", "builder"],
  stage: currentStage,
  stageContent, // <-- Only current stage content
  lessonModifiers: { tone: "tactical", fog_level: 3 }
});
```

### Box 4: Stage Content

```
STAGE CONTENT:
drill1_prompt: What pattern are you noticing in how you make decisions 
               under pressure?
```

**Not included:**
- `drill2_prompt` (future content)
- `final_question` (future content)
- `head`, `practical` (not relevant to drill stage)

## Usage Examples

### Frontend: MissionEngine Component

```typescript
import {
  STAGE_DISPLAY_NAMES,
  getNextStage,
  shouldShowInput,
  calculateStageProgress,
} from '@/lib/stage-engine';

// Advance to next stage
const handleAdvance = () => {
  const nextStage = getNextStage(currentStage);
  if (nextStage) {
    setCurrentStage(nextStage);
  }
};

// Check if input should be shown
if (shouldShowInput(currentStage)) {
  return <TextArea placeholder="Enter response..." />;
}

// Calculate progress
const progress = calculateStageProgress(currentStage); // 0-100
```

### Backend: Edge Function

```typescript
import { getStageContent } from './stage-engine';

// Filter lesson content by stage
const stageContent = getStageContent(lesson, currentStage);

console.log(`[STAGE ENGINE] Stage: ${currentStage}`);
console.log(`[STAGE ENGINE] Content keys: ${Object.keys(stageContent)}`);

// Assemble prompt with filtered content
const prompt = assembleEchelonPrompt({
  stage: currentStage,
  stageContent, // Only relevant fields
  // ... other context
});
```

## Stage Validation

The Stage Engine includes validation to prevent invalid states:

```typescript
const validation = validateStageState(stageEngineState);

if (!validation.valid) {
  console.error('Invalid stage state:', validation.errors);
  // Example errors:
  // - "Invalid current stage: UNKNOWN"
  // - "Invalid stage transition: DRILL2 → BRIEFING"
}
```

## Debug Mode

Enable detailed stage logging:

```typescript
console.log(getStageDebugInfo(stageEngineState));
```

Output:
```
STAGE ENGINE DEBUG
==================
Current: DRILL1 (Personal Mapping)
Progress: 14%
Remaining: VIDEO → HP → DRILL2 → DEBRIEF → FINAL → COMPLETE
History: 1 stages completed
Video: Pending
Validation: PASS
```

## Key Design Principles

1. **Content Isolation:** Each stage sees ONLY what it needs
2. **Sequential Flow:** No skipping, no reversing (in active mode)
3. **Validation First:** All transitions are validated
4. **Logging:** Every stage change is logged for debugging
5. **State Tracking:** Complete history maintained for replay

## Integration Points

### With Lesson Intake Layer (Subsystem #1)
- Receives lesson data from lesson loader
- Filters content per stage
- Ensures all 91 lessons follow same protocol

### With Identity Unlock Engine (Subsystem #3)
- Provides stage context for trait unlocks
- Signals when FINAL stage completes (Field Guide trigger)
- Tracks which stages completed successfully

### With Mission Progress Engine (Subsystem #4)
- Records stage completions
- Maintains stage history
- Enables replay mode navigation

## Testing Stage Transitions

```typescript
// Test: Can transition from BRIEFING to DRILL1
const canAdvance = canTransitionToStage(
  MissionStage.BRIEFING, 
  MissionStage.DRILL1
); // true

// Test: Cannot skip stages
const canSkip = canTransitionToStage(
  MissionStage.BRIEFING,
  MissionStage.HP
); // false

// Test: Cannot reverse
const canReverse = canTransitionToStage(
  MissionStage.DRILL2,
  MissionStage.DRILL1
); // false
```

## Performance Considerations

- **Token Reduction:** Stage filtering reduces prompt size by 60-80%
- **Memory Efficiency:** Only current stage content in memory
- **Network Optimization:** Smaller payloads to AI API

## Error Handling

```typescript
// Invalid stage
if (!CANONICAL_STAGE_SEQUENCE.includes(stage)) {
  throw new Error(`Invalid stage: ${stage}`);
}

// Cannot advance
const next = getNextStage(stage);
if (!next) {
  console.warn('Already at final stage');
  return;
}

// Failed validation
const validation = validateStageState(state);
if (!validation.valid) {
  console.error('Stage state invalid:', validation.errors);
}
```

## Future Enhancements

1. **Stage Branching:** Conditional paths based on responses
2. **Dynamic Stages:** Variable stage counts per lesson type
3. **Stage Checkpoints:** Save/resume mid-stage
4. **Stage Analytics:** Track time spent per stage
5. **Stage Hints:** Progressive disclosure based on progress

## Prompt Assembly Engine (7-Box Protocol)

**Subsystem #3 - Implemented**

The Prompt Assembly Engine constructs minimal, stage-aware prompts using a 7-box system that achieves **60-70% token reduction** while maintaining full context continuity.

### Box Structure

```
┌─────────────────────────────────────────────────────────┐
│                    7-BOX PROMPT SYSTEM                   │
├─────────────────────────────────────────────────────────┤
│ BOX 1: Core Rules (Always Present)                      │
│   - Echelon identity & voice                            │
│   - "ONE question only" rule (absolute)                 │
│   - Mythic-tech voice guidelines                        │
│   - ICF coaching protocol                               │
├─────────────────────────────────────────────────────────┤
│ BOX 2: Identity Tags (Minimal)                          │
│   - Operator callsign                                   │
│   - Unlocked trait tags ONLY (no definitions)           │
├─────────────────────────────────────────────────────────┤
│ BOX 3: Stage Instruction (Dynamic)                      │
│   - Current stage behavior rules                        │
│   - Stage-specific constraints                          │
│   - Completion criteria guidance                        │
├─────────────────────────────────────────────────────────┤
│ BOX 4: Stage Content (Filtered)                         │
│   - ONLY fields relevant to current stage               │
│   - Briefing: briefing, echelon_opening                 │
│   - Drill1: drill1_prompt                               │
│   - Video: (no AI content)                              │
│   - HP: head, practical                                 │
│   - Drill2: drill2_prompt                               │
│   - Debrief: debrief                                    │
│   - Final: final_question, field_guide_prompt           │
├─────────────────────────────────────────────────────────┤
│ BOX 5: Lesson Modifiers (Optional)                      │
│   - Tone directive (tactical, reflective, etc)          │
│   - Fog level (complexity rating)                       │
│   - Phase indicator (Fog, Drift, etc)                   │
├─────────────────────────────────────────────────────────┤
│ BOX 6: Short-Term Memory (Recent Insight)               │
│   - Latest operator insight from previous stage         │
│   - Cleared at mission boundaries                       │
│   - Enables stage-to-stage continuity                   │
├─────────────────────────────────────────────────────────┤
│ BOX 7: Long-Term Pattern (Persistent Memory)            │
│   - Overarching pattern across missions                 │
│   - Persistent across entire program                    │
│   - Updated by Field Guide generation                   │
└─────────────────────────────────────────────────────────┘
```

### Token Compression Results

**Typical Metrics:**
- Full lesson dump: ~2,000-3,000 tokens
- 7-box filtered prompt: ~600-900 tokens
- **Compression: 60-70% reduction**

**Logging Output:**
```
[PROMPT ASSEMBLY] 7-Box Token Efficiency:
  - Full Lesson: ~2400 tokens
  - 7-Box Prompt: ~680 tokens
  - Compression: 72% reduction
  - Boxes active: 6/7
  - Stage: drill1 (1 fields)
```

### Implementation Points

#### Edge Function (Backend)
**File:** `supabase/functions/echelon-chat/index.ts`

```typescript
// Fetch identity notes (Boxes 6 & 7)
const { data: recentNote } = await supabase
  .from('operator_identity_notes')
  .select('note_content')
  .eq('user_id', userId)
  .eq('note_type', 'recent_insight')
  .single();

const { data: longTermNote } = await supabase
  .from('operator_identity_notes')
  .select('note_content')
  .eq('user_id', userId)
  .eq('note_type', 'long_term_pattern')
  .single();

// Assemble complete 7-box prompt
const systemPrompt = assembleEchelonPrompt({
  callsign: "ATLAS",
  traitTags: ["systems_thinking", "pattern_recognition"],
  stage: currentStage,
  stageContent: getStageContent(lesson, currentStage),
  lessonModifiers: { tone: lesson.tone, fog_level: lesson.fog_level },
  recentInsight: recentNote?.note_content,
  longTermNote: longTermNote?.note_content
});
```

#### Client-Side Management
**File:** `src/lib/identity-system.ts`

```typescript
import { saveRecentInsight, saveLongTermPattern, getIdentityNotes } from '@/lib/identity-system';

// Save recent insight after stage completion
await saveRecentInsight(userId, "Operator recognizes pattern of perfectionism delaying execution");

// Update long-term pattern after Field Guide generation
await saveLongTermPattern(userId, "Builder archetype with execution bias + systems thinking");

// Fetch notes for client-side display
const { recentInsight, longTermPattern } = await getIdentityNotes(userId);
```

### Memory Lifecycle

**Box 6: Short-Term Memory (Recent Insight)**
- Written: After each mission stage completes
- Read: At start of next stage
- Cleared: At mission boundaries (COMPLETE → next BRIEFING)
- Purpose: Stage-to-stage continuity within one mission

**Box 7: Long-Term Pattern (Persistent Memory)**
- Written: After Field Guide generation (FINAL stage)
- Read: At every stage across all missions
- Cleared: Never (persists indefinitely)
- Purpose: Cross-mission identity continuity

### Integration with Stage Engine

The Prompt Assembly Engine receives filtered content from the Stage Engine:

```typescript
// Stage Engine filters content (Subsystem #2)
const stageContent = getStageContent(lesson, currentStage);

// Prompt Assembly uses filtered content (Subsystem #3)
const prompt = assembleEchelonPrompt({
  stage: currentStage,
  stageContent, // Only 1-3 fields per stage
  // ... other boxes
});
```

### Critical Rules Enforced

1. **ONE Question Only** - Box 1 enforces absolute rule
2. **Mythic-Tech Voice** - Box 1 defines voice parameters
3. **Content Isolation** - Box 4 only includes current stage fields
4. **Identity Continuity** - Boxes 6 & 7 provide memory
5. **Token Efficiency** - All boxes minimize redundancy

### Why This Is Mission-Critical

| Without 7-Box System | With 7-Box System |
|----------------------|-------------------|
| ❌ 3000 tokens per prompt | ✅ 700 tokens per prompt |
| ❌ No memory between missions | ✅ Persistent identity tracking |
| ❌ Content leakage to earlier stages | ✅ Stage-isolated content |
| ❌ Generic AI responses | ✅ Identity-aware coaching |
| ❌ High API costs | ✅ 60-70% cost reduction |

### Validation Checklist

- ✅ All 7 boxes implemented in edge function
- ✅ Identity notes fetched from `operator_identity_notes`
- ✅ Token compression logged and validated (60-70%)
- ✅ Client-side management API available
- ✅ Stage-filtered content used (Box 4)
- ✅ ONE question rule enforced (Box 1)
- ✅ Mythic-tech voice maintained (Box 1)

### Next Subsystem: Identity Unlock Engine

The Prompt Assembly Engine now enables **Subsystem #4: Identity Unlock Engine** because:
- Box 2 provides trait tags for personalized responses
- Box 6 captures insights that trigger subskill unlocks
- Box 7 provides pattern context for Field Guide generation
- Token efficiency allows richer identity context

## Related Documentation

- [Lesson Intake Layer](./LESSON_INTAKE_SPEC.md) - Subsystem #1
- [Prompt Assembly System](../src/lib/prompt-assembly.ts) - 7-box reference
- [Identity System](../src/lib/identity-system.ts) - Note management API
- [State Engine](../src/lib/state-engine.ts) - Mission progress tracking
