// ============================================================================
// FIELD GUIDE ENGINE v2
// Inference Layer: Interprets reflections into trait/shadow/power signals
// Uses existing TRAIT_MAP from identity-system.ts
// ============================================================================

import { ReflectionEntry } from "./reflection-storage";
import { MissionLogEntry, saveMissionLogEntry } from "./mission-log";
import { TRAIT_MAP } from "./identity-system";
import { callOperatorAI, hasOperatorAIKey } from "./operator-ai";

export interface TimelineEvent {
  lessonId: number;
  type: string; // "breakthrough" | "pattern" | "evolution" | "shadow_surfaced" | "power_emerging"
  description: string;
  timestamp: number;
}

// ============================================================================
// UTILITY: LIGHTWEIGHT THEME EXTRACTION
// ============================================================================

/**
 * Extract cognitive theme from reflection text
 * Maps to psychological patterns without AI call
 */
function extractTheme(text: string): string {
  if (!text) return "General Reflection";
  
  const lower = text.toLowerCase();
  
  // Systems Thinking signals
  if (lower.includes("system") || lower.includes("interconnect") || lower.includes("ripple")) {
    return "Systems Awareness";
  }
  
  // Pattern Recognition signals
  if (lower.includes("pattern") || lower.includes("repeat") || lower.includes("similar")) {
    return "Pattern Detection";
  }
  
  // Strategic Thinking signals
  if (lower.includes("plan") || lower.includes("strategy") || lower.includes("long-term")) {
    return "Strategic Planning";
  }
  
  // Emotional Intelligence signals
  if (lower.includes("feel") || lower.includes("emotion") || lower.includes("empathy")) {
    return "Emotional Processing";
  }
  
  // Creative Problem Solving signals
  if (lower.includes("creative") || lower.includes("novel") || lower.includes("innovat")) {
    return "Creative Synthesis";
  }
  
  // Execution Bias signals
  if (lower.includes("action") || lower.includes("execut") || lower.includes("build")) {
    return "Execution Mode";
  }
  
  // Analytical Rigor signals
  if (lower.includes("analyz") || lower.includes("data") || lower.includes("logic")) {
    return "Analytical Thinking";
  }
  
  // Adaptive Learning signals
  if (lower.includes("adapt") || lower.includes("learn") || lower.includes("adjust")) {
    return "Adaptive Learning";
  }
  
  // Communication Clarity signals
  if (lower.includes("communicat") || lower.includes("explain") || lower.includes("clarity")) {
    return "Communication Clarity";
  }
  
  // Shadow signals
  if (lower.includes("stuck") || lower.includes("blocked") || lower.includes("avoid")) {
    return "Resistance Pattern";
  }
  
  if (lower.includes("fear") || lower.includes("anxiety") || lower.includes("worry")) {
    return "Fear Response";
  }
  
  if (lower.includes("overwhelm") || lower.includes("too much") || lower.includes("chaos")) {
    return "Cognitive Overload";
  }
  
  return "Self-Awareness";
}

// ============================================================================
// INFERENCE: MAP THEMES TO TRAIT_MAP TAGS
// ============================================================================

/**
 * Infer trait signals from reflections using TRAIT_MAP
 */
function inferTraitSignals(reflections: ReflectionEntry[]): string[] {
  const signals: string[] = [];
  
  reflections.forEach(r => {
    const theme = extractTheme(r.operatorPrimary);
    
    switch (theme) {
      case "Systems Awareness":
        signals.push("systems_thinking");
        break;
      case "Pattern Detection":
        signals.push("pattern_recognition");
        break;
      case "Strategic Planning":
        signals.push("strategic_thinking");
        break;
      case "Emotional Processing":
        signals.push("emotional_intelligence");
        break;
      case "Creative Synthesis":
        signals.push("creative_problem_solving");
        break;
      case "Execution Mode":
        signals.push("execution_bias");
        break;
      case "Analytical Thinking":
        signals.push("analytical_rigor");
        break;
      case "Adaptive Learning":
        signals.push("adaptive_learning");
        break;
      case "Communication Clarity":
        signals.push("communication_clarity");
        break;
      default:
        // No specific trait signal
        break;
    }
  });
  
  return signals;
}

/**
 * Infer shadow signals from reflections
 * Maps to trait tags whose shadows are surfacing
 */
function inferShadowSignals(reflections: ReflectionEntry[]): string[] {
  const signals: string[] = [];
  
  reflections.forEach(r => {
    const theme = extractTheme(r.operatorPrimary);
    const text = r.operatorPrimary.toLowerCase();
    
    // Systems Thinking shadow: "Isolation or frustration when others cannot see the pattern"
    if ((theme === "Systems Awareness" || text.includes("frustrated") || text.includes("others don't see")) && 
        (text.includes("isolated") || text.includes("alone"))) {
      signals.push("systems_thinking");
    }
    
    // Pattern Recognition shadow: "False pattern detection or over-generalization"
    if (theme === "Pattern Detection" && (text.includes("wrong") || text.includes("incorrect"))) {
      signals.push("pattern_recognition");
    }
    
    // Strategic Thinking shadow: "Analysis paralysis or over-planning"
    if (theme === "Strategic Planning" && (text.includes("stuck") || text.includes("overthink"))) {
      signals.push("strategic_thinking");
    }
    
    // Emotional Intelligence shadow: "Emotional overwhelm or manipulation vulnerability"
    if (theme === "Emotional Processing" && text.includes("overwhelm")) {
      signals.push("emotional_intelligence");
    }
    
    // Creative Problem Solving shadow: "Impractical ideas or disconnection from implementation"
    if (theme === "Creative Synthesis" && (text.includes("impractical") || text.includes("unrealistic"))) {
      signals.push("creative_problem_solving");
    }
    
    // Execution Bias shadow: "Premature action without sufficient planning"
    if (theme === "Execution Mode" && (text.includes("rushed") || text.includes("too fast"))) {
      signals.push("execution_bias");
    }
    
    // Resistance Pattern (general shadow indicator)
    if (theme === "Resistance Pattern") {
      // Map to most likely trait based on context
      if (text.includes("think") || text.includes("analyz")) {
        signals.push("strategic_thinking");
      } else if (text.includes("feel")) {
        signals.push("emotional_intelligence");
      }
    }
  });
  
  return signals;
}

/**
 * Infer power signals from reflections
 * Maps to trait tags whose superpowers are emerging
 */
function inferPowerSignals(reflections: ReflectionEntry[]): string[] {
  const signals: string[] = [];
  
  reflections.forEach(r => {
    const text = r.operatorPrimary.toLowerCase();
    
    // Look for superpower language indicators
    if (text.includes("breakthrough") || text.includes("clarity") || text.includes("suddenly see")) {
      const theme = extractTheme(r.operatorPrimary);
      
      switch (theme) {
        case "Systems Awareness":
          signals.push("systems_thinking"); // "Sees the game board while others move pieces"
          break;
        case "Pattern Detection":
          signals.push("pattern_recognition"); // "Predicts outcomes before others see the trend"
          break;
        case "Strategic Planning":
          signals.push("strategic_thinking"); // "Sees 10 moves ahead"
          break;
        case "Emotional Processing":
          signals.push("emotional_intelligence"); // "Navigates human dynamics with precision"
          break;
        case "Creative Synthesis":
          signals.push("creative_problem_solving"); // "Invents solutions others didn't know were possible"
          break;
        case "Execution Mode":
          signals.push("execution_bias"); // "Ships while others are still talking"
          break;
        case "Analytical Thinking":
          signals.push("analytical_rigor"); // "Finds truth in noise"
          break;
        case "Adaptive Learning":
          signals.push("adaptive_learning"); // "Evolves faster than environment changes"
          break;
        case "Communication Clarity":
          signals.push("communication_clarity"); // "Makes the complex understandable"
          break;
      }
    }
  });
  
  return signals;
}

// ============================================================================
// CORE ENGINE: COMPILE MISSION LOG
// ============================================================================

/**
 * Compile mission log from all reflections for a lesson
 * This is called in LessonRunner after lesson completion
 */
export function compileMissionLog(
  lessonId: number,
  lessonTitle: string,
  reflections: ReflectionEntry[]
): MissionLogEntry {
  console.log(`[FIELD GUIDE ENGINE] Compiling mission log for lesson ${lessonId}...`);
  
  // Combine all operator reflections into insight summary
  const insightSummary = reflections
    .map(r => r.operatorPrimary)
    .filter(Boolean)
    .join(" | ");
  
  // Extract themes from each reflection
  const patterns = reflections.map(r => extractTheme(r.operatorPrimary));
  
  // Run inference functions
  const traitSignals = inferTraitSignals(reflections);
  const shadowSignals = inferShadowSignals(reflections);
  const powerSignals = inferPowerSignals(reflections);
  
  // Create entry
  const entry: MissionLogEntry = {
    lessonId,
    lessonTitle,
    insightSummary,
    patterns,
    traitSignals,
    shadowSignals,
    powerSignals,
    timestamp: Date.now(),
  };
  
  // Save to localStorage
  saveMissionLogEntry(entry);
  
  console.log(`[FIELD GUIDE ENGINE] Mission log compiled:`, {
    lessonId,
    patternsDetected: patterns.length,
    traitSignals: traitSignals.length,
    shadowSignals: shadowSignals.length,
    powerSignals: powerSignals.length,
  });
  
  return entry;
}

/**
 * Create timeline event (for evolution log)
 */
export function createTimelineEvent(
  lessonId: number,
  type: string,
  description: string
): TimelineEvent {
  return {
    lessonId,
    type,
    description,
    timestamp: Date.now(),
  };
}

/**
 * Get all trait tags from TRAIT_MAP
 */
export function getAllTraitTags(): string[] {
  return Object.keys(TRAIT_MAP);
}

// ============================================================================
// ECHELON'S READ — the AI's own contribution to the mission record.
// Two minds, one record: the operator's reflections plus Echelon's read of
// them, written by the operator's own AI, grounded strictly in their words.
// ============================================================================

export async function generateEchelonRead(
  lessonTitle: string,
  reflections: ReflectionEntry[],
  opts: { archetype?: string | null; language?: { code: string; name: string } } = {}
): Promise<string | null> {
  if (!hasOperatorAIKey()) return null;

  const material = reflections
    .map((r) => r.operatorPrimary)
    .filter(Boolean)
    .join("\n---\n");
  if (material.trim().length < 25) return null;

  const languageDirective =
    opts.language && opts.language.code !== "en"
      ? ` Respond entirely in ${opts.language.name}.`
      : "";

  const system =
    "You are Echelon, the training intelligence of How to Save the World. First person, mythic-tech, terse, precise. No emojis, no markdown, no headers. You write into the operator's permanent record.";

  const prompt = `The operator just completed the mission "${lessonTitle}".${
    opts.archetype ? ` Their archetype: ${opts.archetype}.` : ""
  } Their reflections, verbatim:

${material.slice(0, 4000)}

Write Echelon's read for the mission record — 3 to 4 sentences, first person:
- Name the strongest pattern in HOW they think here, citing their own words once.
- Then CONTRIBUTE one thing they did not say themselves: a connection, a risk, or a reframe that extends their thinking. Ground it strictly in what they wrote — never invent facts about their life or work.
- Close by naming the one thing you would press on next.
This is a contribution to shared thinking — not a summary, not a grade.${languageDirective}`;

  const read = await callOperatorAI({ system, prompt, temperature: 0.7, maxTokens: 400 });
  return read?.trim() || null;
}
