// ============================================================================
// MARKDOWN VAULT EXPORT
// Exports the operator's complete learning record — identity dossier, mission
// insights, deep reflections, phase assessments, field guide, achievements —
// as a zip of Markdown files with YAML frontmatter, ready to drop into an
// Obsidian vault (or any tool that reads plain .md).
//
// Sovereignty: everything is read from local state and packaged in-browser.
// No network calls, no dependencies — the zip is written by hand (STORE
// method, no compression) so the export works offline forever.
// ============================================================================

import { loadState, type StateSchema } from "./state-engine";
import { getMissionLogs, type MissionLogEntry } from "./mission-log";
import { getReflectionEntries, type ReflectionEntry } from "./reflection-storage";
import { TRAIT_MAP } from "./identity-system";
import { zipStore } from "./zip-store";

interface VaultFile {
  path: string;
  content: string;
}

// ---------------------------------------------------------------------------
// Markdown builders
// ---------------------------------------------------------------------------

const safe = (s: string) => s.replace(/[\\/:*?"<>|#^[\]]/g, "").trim().slice(0, 80);
const pad = (n: number) => String(n).padStart(2, "0");
const day = (t: number | string) => new Date(t).toISOString().split("T")[0];

function frontmatter(fields: Record<string, string | number | string[]>): string {
  const lines = Object.entries(fields).map(([k, v]) =>
    Array.isArray(v) ? `${k}: [${v.join(", ")}]` : `${k}: ${JSON.stringify(v)}`
  );
  return `---\n${lines.join("\n")}\n---\n\n`;
}

function identityDossier(state: StateSchema): string {
  const v = state.user.vanguard;
  const a = state.user.archetype as Record<string, unknown>;
  let md = frontmatter({
    type: "identity-dossier",
    callsign: v.callsign ?? "UNASSIGNED",
    rank: state.rank.current,
    tags: ["neuroverse", "dossier"],
  });
  md += `# Identity Dossier — ${v.full_identity ?? "Operator"}\n\n`;
  md += `| | |\n|---|---|\n`;
  md += `| Callsign | ${v.callsign ?? "—"} |\n`;
  md += `| Rank | ${state.rank.current} |\n`;
  md += `| Archetype (Primary) | ${(a.primary as string) ?? "—"} |\n`;
  md += `| Archetype (Shadow) | ${(a.shadow as string) ?? "—"} |\n`;
  md += `| Archetype (Rising) | ${(a.rising as string) ?? "—"} |\n`;
  md += `| Missions Complete | ${state.progress.lessons_completed.length} |\n\n`;

  if (state.rank.history.length > 0) {
    md += `## Rank Record\n\n`;
    for (const r of state.rank.history) {
      md += `- **${r.rank}** — conferred ${day(r.earned_at)} (Mission ${r.lesson_id})\n`;
    }
    md += `\n`;
  }

  if (state.identity.unlocked_traits.length > 0) {
    md += `## Unlocked Traits\n\n`;
    for (const tag of state.identity.unlocked_traits) {
      const t = TRAIT_MAP[tag];
      if (t) {
        md += `### ${t.name}\n\n${t.definition}\n\n`;
        md += `- **Shadow:** ${t.shadow}\n- **Superpower:** ${t.superpower}\n\n`;
      } else {
        md += `### ${tag}\n\n`;
      }
    }
  }

  if (state.achievements.length > 0) {
    md += `## Achievements\n\n`;
    for (const ach of state.achievements) {
      md += `- **${ach.title}** — ${ach.description} *(${day(ach.awarded_at)})*\n`;
    }
    md += `\n`;
  }

  return md;
}

function missionFile(
  log: MissionLogEntry | undefined,
  lessonId: number,
  reflections: ReflectionEntry[],
  quickReflections: StateSchema["reflections"]
): string {
  const title = log?.lessonTitle ?? `Mission ${lessonId}`;
  const date = log ? day(log.timestamp) : reflections[0] ? day(reflections[0].timestamp) : "";
  let md = frontmatter({
    type: "mission",
    lesson: lessonId,
    title,
    date,
    tags: ["neuroverse", "mission", ...(log?.traitSignals ?? [])],
  });
  md += `# Mission ${lessonId} — ${title}\n\n`;

  if (log) {
    md += `## Insight Summary\n\n${log.insightSummary}\n\n`;
    if (log.patterns.length) md += `## Patterns\n\n${log.patterns.map((p) => `- ${p}`).join("\n")}\n\n`;
    if (log.traitSignals.length) md += `**Trait signals:** ${log.traitSignals.join(", ")}\n\n`;
    if (log.shadowSignals.length) md += `**Shadow signals:** ${log.shadowSignals.join(", ")}\n\n`;
    if (log.powerSignals.length) md += `**Power signals:** ${log.powerSignals.join(", ")}\n\n`;
  }

  if (reflections.length > 0) {
    md += `## Deep Reflections\n\n`;
    for (const r of reflections) {
      md += `### ${r.stage} · ${day(r.timestamp)}\n\n`;
      md += `> ${r.prompt}\n\n`;
      md += `**Operator:** ${r.operatorPrimary}\n\n`;
      if (r.operatorFollowup) md += `**Operator (follow-up):** ${r.operatorFollowup}\n\n`;
      md += `**Echelon:** ${r.echelonMirror}\n\n`;
      if (r.echelonClose) md += `*${r.echelonClose}*\n\n`;
    }
  }

  const quick = quickReflections.filter((r) => r.lesson_id === lessonId);
  if (quick.length > 0) {
    md += `## Mission Reflections\n\n`;
    for (const r of quick) {
      md += `- *(${day(r.timestamp)})* ${r.content}\n`;
    }
    md += `\n`;
  }

  return md;
}

function phaseReport(rec: StateSchema["phase_assessments"][number]): string {
  let md = frontmatter({
    type: "phase-assessment",
    phase: rec.phase,
    title: rec.name,
    date: day(rec.sealed_at),
    tags: ["neuroverse", "report", "mirror-gate"],
  });
  md += `# ${rec.name} — Phase ${rec.phase}\n\n`;
  md += `*Sealed at the Mirror Gate, ${day(rec.sealed_at)} (Mission ${rec.lesson_id}).*\n\n---\n\n`;
  md += `${rec.content}\n`;
  return md;
}

function fieldGuideReport(state: StateSchema): string {
  let md = frontmatter({
    type: "field-guide",
    tags: ["neuroverse", "report", "field-guide"],
  });
  md += `# Field Guide — Section Reports\n\n`;
  for (const s of state.field_guide.sections) {
    md += `## Section ${s.section_id}: ${s.title} (${s.lesson_range})\n\n`;
    md += `- **Signature:** ${s.signature}\n`;
    md += `- **Strength:** ${s.strength}\n`;
    md += `- **Vulnerability:** ${s.vulnerability}\n`;
    md += `- **Pattern:** ${s.pattern}\n`;
    md += `- **Evolution:** ${s.evolution}\n\n`;
  }
  return md;
}

// ---------------------------------------------------------------------------
// Vault assembly
// ---------------------------------------------------------------------------

export function buildVaultFiles(): VaultFile[] {
  const state = loadState();
  if (!state) return [];

  const callsign = state.user.vanguard.callsign ?? "Operator";
  const logs = getMissionLogs();
  const reflections = getReflectionEntries();
  const files: VaultFile[] = [];

  // Every lesson that left any trace gets a mission file
  const lessonIds = new Set<number>([
    ...logs.map((l) => l.lessonId),
    ...reflections.map((r) => r.lessonId),
    ...state.reflections.map((r) => r.lesson_id),
  ]);

  const missionLinks: string[] = [];
  for (const id of [...lessonIds].sort((a, b) => a - b)) {
    const log = logs.find((l) => l.lessonId === id);
    const title = safe(log?.lessonTitle ?? `Mission ${id}`);
    const path = `Missions/Mission ${pad(id)} — ${title}.md`;
    files.push({
      path,
      content: missionFile(log, id, reflections.filter((r) => r.lessonId === id), state.reflections),
    });
    missionLinks.push(`- [[Mission ${pad(id)} — ${title}]]`);
  }

  for (const rec of state.phase_assessments) {
    files.push({ path: `Reports/Phase ${rec.phase} — ${safe(rec.name)}.md`, content: phaseReport(rec) });
  }

  if (state.field_guide.sections.length > 0) {
    files.push({ path: `Reports/Field Guide Sections.md`, content: fieldGuideReport(state) });
  }

  files.push({ path: `Operator/Identity Dossier.md`, content: identityDossier(state) });

  let home = frontmatter({ type: "vault-home", tags: ["neuroverse"] });
  home += `# ${callsign} — Training Vault\n\n`;
  home += `Exported from How to Save the World on ${day(Date.now())}. `;
  home += `Everything here is yours: plain Markdown, no lock-in, no telemetry.\n\n`;
  home += `## Operator\n\n- [[Identity Dossier]]\n\n`;
  if (state.phase_assessments.length > 0 || state.field_guide.sections.length > 0) {
    home += `## Reports\n\n`;
    for (const rec of state.phase_assessments) home += `- [[Phase ${rec.phase} — ${safe(rec.name)}]]\n`;
    if (state.field_guide.sections.length > 0) home += `- [[Field Guide Sections]]\n`;
    home += `\n`;
  }
  if (missionLinks.length > 0) {
    home += `## Missions\n\n${missionLinks.join("\n")}\n`;
  }
  files.push({ path: `Home.md`, content: home });

  return files;
}

/** Build the vault and trigger a zip download. Returns file count (0 = no state). */
export function downloadVaultZip(): number {
  const files = buildVaultFiles();
  if (files.length === 0) return 0;

  const state = loadState();
  const callsign = state?.user.vanguard.callsign ?? "operator";
  const blob = zipStore(files);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `neuroverse_vault_${callsign}_${day(Date.now())}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return files.length;
}
