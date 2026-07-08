// ============================================================================
// VANGUARD ROLES — archetype → contribution role on the Open Robotics Network
// The assessment is delivered as a posting, not a personality result:
// "Your strengths suggest you'll contribute most effectively as a
//  <role> within the Vanguard." (docs/WORLD_DESIGN.md §2.3)
// ============================================================================

export interface VanguardRole {
  role: string;
  lens: string;       // scenario vantage
  artifacts: string;  // what compiles on the dossier
}

export const VANGUARD_ROLES: Record<string, VanguardRole> = {
  "The Watchtower": {
    role: "Risk & Security Analyst",
    lens: "Sees the threat first",
    artifacts: "Early-warning briefs, threat analyses",
  },
  "The Weaver": {
    role: "Systems Architect",
    lens: "Designs how it all connects",
    artifacts: "Interop accords, integration maps",
  },
  "The Veil": {
    role: "Privacy Engineer",
    lens: "Guards what is private",
    artifacts: "Consent protocols, opacity layers",
  },
  "The Operator": {
    role: "Field Operations Lead",
    lens: "Runs the deployment",
    artifacts: "Field playbooks, rollout plans",
  },
  "The Engine": {
    role: "Field Engineer",
    lens: "Makes it actually run",
    artifacts: "Mesh build specs, compute plans",
  },
  "The Lumen": {
    role: "Community Organizer",
    lens: "Brings the people",
    artifacts: "Community charters, teaching kits",
  },
  "The Cipher": {
    role: "Protocol Steward",
    lens: "Makes trust mathematical",
    artifacts: "Verification schemes, key ceremonies",
  },
  "The Drift": {
    role: "Edge Researcher",
    lens: "Finds the edge cases",
    artifacts: "Recon reports, weak-signal surveys",
  },
  "The Chronicle": {
    role: "Governance Designer",
    lens: "Keeps power accountable",
    artifacts: "Governance proposals, canon records",
  },
};

export function getVanguardRole(primaryArchetype: string | null): VanguardRole | null {
  if (!primaryArchetype) return null;
  return VANGUARD_ROLES[primaryArchetype] ?? null;
}
