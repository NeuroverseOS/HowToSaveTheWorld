// Canonical Scoring Engine from NEUROVERSE_SCORING_ENGINE.docx
// DO NOT MODIFY - This implements the exact scoring logic from the canonical spec

export type ArchetypeKey = 
  | "WATCHTOWER"
  | "WEAVER"
  | "VEIL"
  | "OPERATOR"
  | "ENGINE"
  | "LUMEN"
  | "CIPHER"
  | "DRIFT"
  | "CHRONICLE";

// v2 scenario-to-archetype mappings (A, B, C, D for each scenario)
// Rebalanced: every archetype appears 5-6 times, 2-3 in the late half
// (Rising-eligible), no position bias. See the assessment audit.
const SCENARIO_MAPPINGS: Record<number, [ArchetypeKey, ArchetypeKey, ArchetypeKey, ArchetypeKey]> = {
  1: ["LUMEN", "CHRONICLE", "OPERATOR", "CIPHER"],
  2: ["DRIFT", "VEIL", "CHRONICLE", "WEAVER"],
  3: ["OPERATOR", "WATCHTOWER", "LUMEN", "ENGINE"],
  4: ["DRIFT", "WATCHTOWER", "OPERATOR", "CHRONICLE"],
  5: ["CIPHER", "VEIL", "ENGINE", "LUMEN"],
  6: ["CIPHER", "OPERATOR", "WEAVER", "ENGINE"],
  7: ["WATCHTOWER", "DRIFT", "WEAVER", "VEIL"],
  8: ["CHRONICLE", "LUMEN", "DRIFT", "CIPHER"],
  9: ["OPERATOR", "WEAVER", "ENGINE", "CHRONICLE"],
  10: ["VEIL", "CHRONICLE", "LUMEN", "WATCHTOWER"],
  11: ["ENGINE", "LUMEN", "CIPHER", "OPERATOR"],
  12: ["WEAVER", "DRIFT", "WATCHTOWER", "VEIL"],
};

// Polarity Map for Shadow calculation
const POLARITY_MAP: Record<ArchetypeKey, ArchetypeKey> = {
  WATCHTOWER: "ENGINE",
  ENGINE: "WATCHTOWER",
  WEAVER: "CIPHER",
  CIPHER: "WEAVER",
  VEIL: "OPERATOR",
  OPERATOR: "VEIL",
  DRIFT: "CHRONICLE",
  CHRONICLE: "DRIFT",
  LUMEN: "LUMEN", // neutral axis
};

export interface ArchetypeScores {
  [key: string]: number;
}

export interface ArchetypeResult {
  primary: ArchetypeKey;
  shadow: ArchetypeKey;
  rising: ArchetypeKey;
}

export function calculateArchetypes(choices: number[]): ArchetypeResult {
  if (choices.length !== 12) {
    throw new Error("Expected exactly 12 scenario choices");
  }

  // Initialize scores
  const totalScores: ArchetypeScores = {
    WATCHTOWER: 0,
    WEAVER: 0,
    VEIL: 0,
    OPERATOR: 0,
    ENGINE: 0,
    LUMEN: 0,
    CIPHER: 0,
    DRIFT: 0,
    CHRONICLE: 0,
  };

  const earlyScores: ArchetypeScores = { ...totalScores };
  const lateScores: ArchetypeScores = { ...totalScores };

  // Process each choice
  choices.forEach((choiceIndex, scenarioIndex) => {
    const scenarioNum = scenarioIndex + 1;
    const mapping = SCENARIO_MAPPINGS[scenarioNum];
    const archetype = mapping[choiceIndex];

    totalScores[archetype] += 1;

    // Track early (1-6) vs late (7-12) for Rising calculation
    if (scenarioNum <= 6) {
      earlyScores[archetype] += 1;
    } else {
      lateScores[archetype] += 1;
    }
  });

  // Calculate Primary: highest total score
  const primary = Object.entries(totalScores)
    .sort(([, a], [, b]) => b - a)[0][0] as ArchetypeKey;

  // Calculate Rising: archetype with largest delta between early and late
  const deltas = Object.keys(totalScores).map((key) => ({
    archetype: key as ArchetypeKey,
    delta: lateScores[key] - earlyScores[key],
    lateScore: lateScores[key],
  }));

  // Calculate Shadow first: polarity opposite of primary
  const shadowCandidate = POLARITY_MAP[primary];
  // LUMEN maps to itself in the polarity table; never let Shadow equal Primary
  const shadowValid = totalScores[shadowCandidate] > 0 && shadowCandidate !== primary;

  // Rising must be distinct from BOTH primary and shadow, with late-game presence
  const risingCandidate = deltas
    .filter((d) => d.archetype !== primary && d.archetype !== shadowCandidate && d.lateScore > 0)
    .sort((a, b) => b.delta - a.delta || b.lateScore - a.lateScore)[0];

  const risingFallback = (Object.entries(totalScores) as [ArchetypeKey, number][])
    .filter(([k]) => k !== primary && k !== shadowCandidate)
    .sort(([, a], [, b]) => b - a)[0]?.[0] as ArchetypeKey | undefined;

  const rising = risingCandidate?.archetype || risingFallback || "CHRONICLE";

  // Shadow: the polarity opposite when it registered; otherwise the strongest
  // remaining archetype distinct from primary and rising (never a duplicate)
  const shadowFallback = (Object.entries(totalScores) as [ArchetypeKey, number][])
    .filter(([k]) => k !== primary && k !== rising)
    .sort(([, a], [, b]) => b - a)[0]?.[0] as ArchetypeKey | undefined;

  const shadow = shadowValid ? shadowCandidate : shadowFallback || shadowCandidate;

  return {
    primary,
    shadow,
    rising,
  };
}
