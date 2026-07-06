// ============================================================================
// KERNEL PROBE — the hard-law audit.
//
// Feeds the kernel a synthetic lesson where every field is a unique canary
// string, assembles the stage context for every mission stage, and asserts:
//   1. no forbidden canary survives visibility filtering,
//   2. every allowed field for the stage passes through,
//   3. memory/identity flags match the Box-Stage Map,
//   4. an unknown stage collapses to the safe default (Box 1 only),
//   5. the client and edge copies of the Box-Stage Map have not drifted,
//   6. the edge stage-content map and the visibility allowlists agree
//      (a field sent but not allowlisted silently never arrives — the
//      exact bug class that once kept lesson_summary out of briefings).
//
// Deterministic, no AI key, no network. Run: npm run probe:kernel
// ============================================================================

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// The edge copies are the LIVE wall — probe those directly.
import {
  BOX_STAGE_MAP as EDGE_MAP,
  VISIBILITY_MATRIX,
  getVisibilityRules,
  filterContentByVisibility,
  getActiveBoxesForStage,
} from "../supabase/functions/_shared/visibility-rules.ts";
import { BOX_STAGE_MAP as CLIENT_MAP } from "../src/lib/box-stage-map.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.error(`  ✗ ${msg}`);
};
const pass = (msg: string) => console.log(`  ✓ ${msg}`);

// ---------------------------------------------------------------------------
// The canary lesson: every field a unique, unmistakable marker
// ---------------------------------------------------------------------------
const CANARY_FIELDS = [
  "briefing",
  "echelon_opening",
  "lesson_title",
  "section_name",
  "lesson_summary",
  "story_beat",
  "drill1_prompt",
  "video_url",
  "head",
  "practical",
  "drill2_prompt",
  "debrief",
  "final_question",
  "field_guide_prompt",
  "echelon_closing",
] as const;

const canary = (field: string) => `CANARY__${field.toUpperCase()}__X9`;
const canaryLesson: Record<string, string> = Object.fromEntries(
  CANARY_FIELDS.map((f) => [f, canary(f)])
);

// Replicates the edge function's per-stage content selection by parsing the
// actual source — so drift between index.ts and this probe is impossible.
function extractStageContentMap(): Record<string, string[]> {
  const src = readFileSync(
    join(ROOT, "supabase/functions/echelon-chat/index.ts"),
    "utf8"
  );
  const mapMatch = src.match(
    /const stageContentMap[\s\S]*?=\s*\{([\s\S]*?)\n  \};/
  );
  if (!mapMatch) throw new Error("Could not locate stageContentMap in edge index.ts");
  const body = mapMatch[1];
  const stages: Record<string, string[]> = {};
  const stageBlocks = body.matchAll(/(\w+):\s*\{([\s\S]*?)\n    \},/g);
  for (const [, stage, block] of stageBlocks) {
    stages[stage] = [...block.matchAll(/(\w+):\s*lesson\.(\w+)/g)].map((m) => m[1]);
  }
  return stages;
}

const MISSION_STAGES = [
  "briefing",
  "drill1",
  "video",
  "hp",
  "drill2",
  "debrief",
  "final",
  "complete",
] as const;

// ---------------------------------------------------------------------------
console.log("KERNEL PROBE — hard-law audit\n");

// ---- 1+2: canary containment per stage ------------------------------------
console.log("[1/6] Forbidden canaries never survive filtering");
console.log("[2/6] Allowed fields always arrive");
const stageContentMap = extractStageContentMap();

for (const stage of MISSION_STAGES) {
  const sentFields = stageContentMap[stage] ?? [];
  const sent: Record<string, string> = Object.fromEntries(
    sentFields.map((f) => [f, canaryLesson[f] ?? canary(f)])
  );
  const filtered = filterContentByVisibility(sent, stage);
  const rules = getVisibilityRules(stage);
  const serialized = JSON.stringify(filtered);

  // No field forbidden for this stage may survive
  for (const field of rules.forbiddenContentFields) {
    if (field === "*") continue;
    if (serialized.includes(canary(field))) {
      fail(`${stage}: forbidden field "${field}" leaked through filtering`);
    }
  }
  // Nothing outside the allowlist may survive when '*' forbids
  if (rules.forbiddenContentFields.includes("*")) {
    for (const key of Object.keys(filtered)) {
      if (!rules.allowedContentFields.includes(key)) {
        fail(`${stage}: "${key}" survived a wildcard-forbidden stage`);
      }
    }
  }
  // Every sent + allowed field must arrive (three-layer wiring check)
  for (const field of sentFields) {
    const allowed =
      rules.allowedContentFields.includes(field) ||
      (!rules.forbiddenContentFields.includes("*") &&
        !rules.forbiddenContentFields.includes(field));
    if (allowed && !serialized.includes(canary(field))) {
      fail(`${stage}: allowed field "${field}" was sent but did not arrive`);
    }
    if (!allowed) {
      fail(
        `${stage}: edge sends "${field}" but visibility drops it — dead wiring (allowlist and stageContentMap disagree)`
      );
    }
  }
}
if (failures === 0) pass("all mission stages contain their canaries correctly");

// ---- 3: memory/identity flags match the map --------------------------------
console.log("[3/6] Memory and identity flags match the Box-Stage Map");
let flagFailures = 0;
for (const stage of MISSION_STAGES) {
  const boxes = getActiveBoxesForStage(stage);
  const rules = getVisibilityRules(stage);
  const checks: Array<[string, boolean, boolean]> = [
    ["identity (Box 2)", boxes.includes(2), rules.showIdentityTags],
    ["short-term memory (Box 6)", boxes.includes(6), rules.showShortTermMemory],
    ["long-term memory (Box 7)", boxes.includes(7), rules.showLongTermMemory],
  ];
  for (const [name, fromMap, fromRules] of checks) {
    if (fromMap !== fromRules) {
      fail(`${stage}: ${name} — map says ${fromMap}, rules say ${fromRules}`);
      flagFailures++;
    }
  }
}
if (flagFailures === 0) pass("flags agree across map and rules for every stage");

// ---- 4: unknown stage collapses safe ----------------------------------------
console.log("[4/6] Unknown stage collapses to the safe default");
const unknownBoxes = getActiveBoxesForStage("stage_that_does_not_exist");
if (unknownBoxes.length === 1 && unknownBoxes[0] === 1) {
  pass("unknown stage → Box 1 only");
} else {
  fail(`unknown stage returned boxes [${unknownBoxes.join(", ")}] instead of [1]`);
}

// ---- 5: client/edge map drift ------------------------------------------------
console.log("[5/6] Client and edge Box-Stage Maps are identical");
const normalize = (map: typeof EDGE_MAP) =>
  JSON.stringify(
    [...map]
      .sort((a, b) => a.stage.localeCompare(b.stage))
      .map((e) => ({ stage: e.stage, boxes: e.activeBoxes }))
  );
if (normalize(EDGE_MAP) === normalize(CLIENT_MAP as typeof EDGE_MAP)) {
  pass("maps match");
} else {
  fail("client src/lib/box-stage-map.ts has drifted from edge _shared/visibility-rules.ts");
}

// ---- 6: every mission stage exists in both structures ------------------------
console.log("[6/6] Every mission stage is covered by content map, matrix, and box map");
for (const stage of MISSION_STAGES) {
  if (!(stage in stageContentMap)) fail(`${stage}: missing from edge stageContentMap`);
  if (!(stage in VISIBILITY_MATRIX)) fail(`${stage}: missing from VISIBILITY_MATRIX`);
  if (!EDGE_MAP.some((e) => e.stage === stage)) fail(`${stage}: missing from BOX_STAGE_MAP`);
}
if (failures === 0) pass("full coverage");

// ---------------------------------------------------------------------------
console.log(
  failures === 0
    ? "\nKERNEL PROBE PASSED — hard law holds."
    : `\nKERNEL PROBE FAILED — ${failures} violation(s).`
);
process.exit(failures === 0 ? 0 : 1);
