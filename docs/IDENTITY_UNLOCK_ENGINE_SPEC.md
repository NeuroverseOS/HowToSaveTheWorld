# Identity Unlock Engine Specification

**Mission Engine Subsystem #4**

## Overview

The Identity Unlock Engine controls trait unlocks, subskill unlocks, shadow reveals, and superpower reveals. It writes to `operator_traits` and `operator_evolution_log` tables, integrates with the Stage Engine and Prompt Assembly Engine, and notifies the Field Guide system.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  IDENTITY UNLOCK ENGINE                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  Trait   │ ─> │ Subskill │ ─> │  Shadow  │ ─> Superpower│
│  │  Unlock  │    │  Unlock  │    │  Reveal  │              │
│  └──────────┘    └──────────┘    └──────────┘              │
│                                                               │
│  ┌─────────────────────────────────────────────────┐        │
│  │         Evolution Log (Timeline)                 │        │
│  └─────────────────────────────────────────────────┘        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Unlock Rules

### Core Principles

1. **Trait Unlock**: First-time activation of a trait (e.g., Systems Thinking)
2. **Subskill Unlock**: Unlock individual capabilities within a trait
3. **Shadow Reveal**: Auto-reveals after 3 subskills unlocked
4. **Superpower Reveal**: Requires all subskills + shadow revealed

### Unlock Frequency

| Entity | Frequency | Trigger |
|--------|-----------|---------|
| **Traits** | 1-2 per mission | Clear demonstration in reflection |
| **Subskills** | 1 per mission | Mission completion |
| **Shadow** | Auto after 3 subskills | System-triggered |
| **Superpower** | Auto after completion | All subskills + shadow |

## Database Integration

### Tables Used

**`operator_traits`**
```sql
- user_id (uuid)
- trait_tag (text)
- unlocked (boolean)
- unlocked_at (timestamp)
- subskills_unlocked (jsonb array)
- shadow_revealed (boolean)
- superpower_revealed (boolean)
```

**`operator_evolution_log`**
```sql
- user_id (uuid)
- lesson_id (bigint)
- trait_tag (text)
- subskill_unlocked (text)
- insight_type (text)
- insight_text (text)
- created_at (timestamp)
```

## Core Functions

### 1. Trait Unlock

```typescript
await unlockTrait(
  userId: string,
  traitTag: string,
  lessonId: number,
  insightText: string
): Promise<UnlockResult | null>
```

**Writes to:**
- `operator_traits` (sets `unlocked = true`)
- `operator_evolution_log` (logs unlock event)

**Returns:**
```typescript
{
  type: 'trait',
  traitTag: 'systems_thinking',
  insightText: '🔓 Systems Thinking trait unlocked',
  timestamp: '2025-01-15T10:30:00Z'
}
```

### 2. Subskill Unlock

```typescript
await unlockSubskill(
  userId: string,
  traitTag: string,
  subskillName: string,
  lessonId: number,
  insightText: string
): Promise<UnlockResult | null>
```

**Writes to:**
- `operator_traits` (appends to `subskills_unlocked` array)
- `operator_evolution_log` (logs subskill unlock)

**Auto-triggers:**
- Shadow reveal if 3+ subskills unlocked

### 3. Shadow Reveal

```typescript
await revealShadow(
  userId: string,
  traitTag: string,
  lessonId: number,
  insightText: string
): Promise<UnlockResult | null>
```

**Writes to:**
- `operator_traits` (sets `shadow_revealed = true`)
- `operator_evolution_log` (logs shadow reveal)

**Returns:**
```typescript
{
  type: 'shadow',
  traitTag: 'systems_thinking',
  insightText: '🌑 Shadow Revealed: Isolation when others cannot see the pattern',
  timestamp: '2025-01-15T10:30:00Z'
}
```

### 4. Superpower Reveal

```typescript
await revealSuperpower(
  userId: string,
  traitTag: string,
  lessonId: number,
  insightText: string
): Promise<UnlockResult | null>
```

**Prerequisites:**
- All subskills unlocked
- Shadow revealed

**Writes to:**
- `operator_traits` (sets `superpower_revealed = true`)
- `operator_evolution_log` (logs superpower reveal)

## AI-Powered Unlock Determination

### Flow

```
Mission FINAL stage complete
    ↓
determineUnlocksFromReflection()
    ↓
Edge function: analyze-trait-unlocks
    ↓
Lovable AI analyzes reflection
    ↓
Returns: { new_traits: [], subskills: [] }
    ↓
Execute unlocks in sequence
    ↓
Update Box 6 (recent insight)
    ↓
Proceed to Field Guide generation
```

### Analysis Prompt Structure

```typescript
const prompt = `
REFLECTION: ${userReflection}
CONVERSATION: ${fullConversation}
UNLOCKED TRAITS: ${currentTraits}
AVAILABLE TRAITS: ${availableTraits}

Identify 0-2 traits clearly demonstrated.
For existing traits, identify demonstrated subskill.

Return JSON:
{
  "new_traits": ["trait_tag1"],
  "subskills": [{"trait": "tag", "subskill": "name"}],
  "reasoning": "Brief explanation"
}
`;
```

### Edge Function: `analyze-trait-unlocks`

**File:** `supabase/functions/analyze-trait-unlocks/index.ts`

**Uses:** Lovable AI (`google/gemini-2.5-flash`)

**Returns:**
```json
{
  "new_traits": ["systems_thinking"],
  "subskills": [
    {
      "trait": "pattern_recognition",
      "subskill": "cross_domain_mapping"
    }
  ],
  "reasoning": "Operator demonstrated ability to see system-level consequences and map patterns across business and personal domains."
}
```

## Integration with Mission Flow

### Stage Engine Integration

```typescript
// After FINAL stage completes
if (currentStage === MissionStage.FINAL) {
  // 1. Determine unlocks
  const unlocks = await determineUnlocksFromReflection(
    userId,
    lesson.id,
    finalResponse,
    messages
  );
  
  // 2. Display unlocks to operator
  unlocks.forEach(unlock => {
    toast({
      title: unlock.insightText,
      description: `Evolution tracked`,
    });
  });
  
  // 3. Generate Field Guide entry
  // (Field Guide will read from operator_evolution_log)
}
```

### Prompt Assembly Integration

**Box 6 (Recent Insight)** is updated with latest unlock:

```typescript
if (unlocks.length > 0) {
  const latest = unlocks[unlocks.length - 1];
  await saveRecentInsight(userId, latest.insightText);
}
```

This ensures Echelon references the unlock in the next mission.

## Field Guide Notification

### Evolution Timeline

The Field Guide reads from `operator_evolution_log` to display:

```typescript
const timeline = await getEvolutionTimeline(userId);

// Display:
// 🔓 Trait: Systems Thinking (Lesson 3)
// 📈 Subskill: downstream_effects (Lesson 5)
// 🌑 Shadow: Isolation pattern (Lesson 8)
// ⚡ SUPERPOWER: Sees game board (Lesson 12)
```

### Trait Completion Display

```typescript
const completion = await getTraitCompletion(userId, 'systems_thinking');

// Returns:
{
  trait: TraitDefinition,
  unlocked: true,
  subskillsUnlocked: 2,
  totalSubskills: 3,
  shadowRevealed: false,
  superpowerRevealed: false,
  completionPercent: 40  // (2/3 * 60%)
}
```

**Completion Formula:**
- Subskills: 60% weight
- Shadow: 20% weight
- Superpower: 20% weight

## Usage Examples

### Mission Completion Hook

```typescript
import { 
  determineUnlocksFromReflection,
  getEvolutionTimeline 
} from '@/lib/identity-unlock-engine';

// After FINAL stage
const unlocks = await determineUnlocksFromReflection(
  userId,
  lesson.id,
  finalResponse,
  conversationHistory
);

console.log(`Unlocked ${unlocks.length} capabilities`);
```

### Field Guide Display

```typescript
import { getEvolutionTimeline, getTraitCompletion } from '@/lib/identity-unlock-engine';

const timeline = await getEvolutionTimeline(userId);
const systemsCompletion = await getTraitCompletion(userId, 'systems_thinking');

return (
  <div>
    <h2>Systems Thinking</h2>
    <Progress value={systemsCompletion.completionPercent} />
    <p>{systemsCompletion.subskillsUnlocked}/{systemsCompletion.totalSubskills} subskills</p>
    
    <h3>Evolution Timeline</h3>
    {timeline.map(entry => (
      <div key={entry.id}>
        {entry.insight_type}: {entry.insight_text}
      </div>
    ))}
  </div>
);
```

### Manual Unlock (Admin/Testing)

```typescript
import { unlockTrait, unlockSubskill } from '@/lib/identity-unlock-engine';

// Unlock trait manually
await unlockTrait(
  userId,
  'systems_thinking',
  lessonId,
  'Manual unlock for testing'
);

// Unlock specific subskill
await unlockSubskill(
  userId,
  'systems_thinking',
  'downstream_effects',
  lessonId,
  'Demonstrated in reflection'
);
```

## Security Considerations

### RLS Policies

**`operator_traits`:**
- Users can INSERT/UPDATE their own traits
- Users can SELECT their own traits
- No DELETE allowed

**`operator_evolution_log`:**
- Users can INSERT their own log entries
- Users can SELECT their own log entries
- No UPDATE or DELETE allowed

### Edge Function Security

**`analyze-trait-unlocks`:**
- `verify_jwt = false` (public access)
- Rate limited through Lovable AI
- Validates user_id in request body
- Returns safe defaults on error

## Error Handling

```typescript
// Graceful degradation
const unlocks = await determineUnlocksFromReflection(...);

if (unlocks.length === 0) {
  console.log('[UNLOCK ENGINE] No unlocks determined this mission');
  // Still proceed to Field Guide generation
}

// Validation
const result = await unlockTrait(...);
if (!result) {
  console.error('Trait unlock failed - already unlocked or invalid');
}
```

## Performance Considerations

- **Batch writes:** All unlocks written in single transaction where possible
- **Caching:** Trait definitions cached in TRAIT_MAP
- **AI efficiency:** Single AI call per mission (not per unlock)
- **Query optimization:** Index on `user_id`, `trait_tag` in `operator_traits`

## Validation Checklist

- ✅ Trait unlock function writes to both tables
- ✅ Subskill unlock appends to jsonb array correctly
- ✅ Shadow auto-reveals after 3 subskills
- ✅ Superpower validates prerequisites
- ✅ Evolution log captures all unlock types
- ✅ AI analysis returns valid JSON structure
- ✅ Box 6 updated with latest unlock
- ✅ Field Guide reads from evolution log

## Next Subsystem: Mission Progress Engine

The Identity Unlock Engine enables **Subsystem #5: Mission Progress Engine** because:
- Unlock events signal mission completion
- Evolution log provides progress markers
- Trait state determines mission availability
- Completion percentage drives UI indicators

## Related Documentation

- [Stage Engine](./STAGE_ENGINE_SPEC.md) - Subsystem #2
- [Prompt Assembly Engine](./STAGE_ENGINE_SPEC.md#prompt-assembly-engine-7-box-protocol) - Subsystem #3
- [Identity System](../src/lib/identity-system.ts) - Trait definitions
- [Trait Map](../src/lib/identity-system.ts) - 9 core traits
