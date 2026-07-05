import type { DossierData } from "./buildDossierData";

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function buildDossierHTML(data: DossierData): string {
  const unlockedTraits = data.traits.filter(t => t.unlocked);
  const superpowerCount = unlockedTraits.filter(t => t.superpower_revealed).length;
  const shadowCount = unlockedTraits.filter(t => t.shadow_revealed).length;

  // Sealed phase assessment chapters (omitted gracefully if none exist)
  const assessmentsHTML = data.phaseAssessments.map(assessment => `
    <section class="section">
      <h3 class="section-title">${escapeHTML(assessment.name)}</h3>
      <div class="assessment-meta">Sealed: ${new Date(assessment.sealed_at).toLocaleDateString()}</div>
      <div class="assessment-body">
        ${escapeHTML(assessment.content).split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br />')}</p>`).join('')}
      </div>
    </section>
  `).join('');

  const traitsHTML = unlockedTraits.map(trait => `
    <div class="trait-block">
      <h4>${trait.trait_name}</h4>
      <div class="trait-meta">
        <span>Completion: ${trait.completionPercent}%</span>
        <span>Subskills: ${trait.subskills_unlocked.length}/${trait.total_subskills}</span>
      </div>
      ${trait.superpower_revealed ? '<div class="badge superpower">⚡ SUPERPOWER ACTIVE</div>' : ''}
      ${trait.shadow_revealed ? '<div class="badge shadow">👁 SHADOW REVEALED</div>' : ''}
    </div>
  `).join('');

  const timelineHTML = data.timeline.slice(0, 20).map(entry => `
    <div class="timeline-entry">
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div class="timeline-type">${entry.insight_type || 'EVOLUTION'}</div>
        ${entry.trait_tag ? `<div class="timeline-trait">${entry.trait_tag}</div>` : ''}
        ${entry.subskill_unlocked ? `<div class="timeline-subskill">${entry.subskill_unlocked}</div>` : ''}
        ${entry.insight_text ? `<div class="timeline-text">${entry.insight_text}</div>` : ''}
        <div class="timeline-date">${entry.unlocked_at ? new Date(entry.unlocked_at).toLocaleDateString() : ''}</div>
      </div>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Operator Dossier - ${data.callsign}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #e0e0e0;
      line-height: 1.6;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 60px 40px;
      background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
    }
    
    .header {
      text-align: center;
      margin-bottom: 60px;
      border-bottom: 2px solid #06b6d4;
      padding-bottom: 30px;
    }
    
    .header h1 {
      font-size: 42px;
      font-weight: 800;
      letter-spacing: 4px;
      color: #06b6d4;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    
    .header h2 {
      font-size: 32px;
      font-weight: 600;
      color: #a855f7;
      margin-bottom: 15px;
    }
    
    .timestamp {
      font-size: 12px;
      color: #666;
      letter-spacing: 1px;
    }

    .rank-line {
      display: inline-block;
      font-size: 14px;
      font-weight: 700;
      color: #10b981;
      border: 1px solid #10b981;
      border-radius: 14px;
      padding: 4px 16px;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 15px;
    }

    .assessment-meta {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
    }

    .assessment-body {
      background: #1a1a1a;
      border-left: 3px solid #a855f7;
      border-radius: 4px;
      padding: 20px 25px;
      color: #ddd;
      line-height: 1.8;
      font-size: 14px;
    }

    .assessment-body p {
      margin-bottom: 12px;
    }
    
    .section {
      margin-bottom: 50px;
    }
    
    .section-title {
      font-size: 24px;
      font-weight: 700;
      color: #06b6d4;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #333;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .archetype-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 20px;
    }
    
    .archetype-card {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    
    .archetype-label {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    
    .archetype-value {
      font-size: 18px;
      font-weight: 600;
      color: #a855f7;
    }
    
    .trait-block {
      background: #1a1a1a;
      border-left: 3px solid #06b6d4;
      padding: 15px 20px;
      margin-bottom: 15px;
      border-radius: 4px;
    }
    
    .trait-block h4 {
      font-size: 16px;
      color: #06b6d4;
      margin-bottom: 8px;
    }
    
    .trait-meta {
      font-size: 12px;
      color: #888;
      display: flex;
      gap: 20px;
      margin-bottom: 8px;
    }
    
    .badge {
      display: inline-block;
      font-size: 10px;
      padding: 4px 10px;
      border-radius: 12px;
      margin-right: 8px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    
    .badge.superpower {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
      border: 1px solid #10b981;
    }
    
    .badge.shadow {
      background: rgba(251, 191, 36, 0.2);
      color: #fbbf24;
      border: 1px solid #fbbf24;
    }
    
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 20px;
    }
    
    .stat-card {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    
    .stat-value {
      font-size: 36px;
      font-weight: 700;
      color: #06b6d4;
      margin-bottom: 5px;
    }
    
    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .timeline-entry {
      display: flex;
      gap: 15px;
      margin-bottom: 15px;
      padding-left: 10px;
    }
    
    .timeline-dot {
      width: 8px;
      height: 8px;
      background: #a855f7;
      border-radius: 50%;
      margin-top: 6px;
      flex-shrink: 0;
    }
    
    .timeline-content {
      flex: 1;
      padding-bottom: 15px;
      border-bottom: 1px solid #222;
    }
    
    .timeline-type {
      font-size: 11px;
      color: #a855f7;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    
    .timeline-trait {
      font-size: 14px;
      color: #06b6d4;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .timeline-subskill {
      font-size: 13px;
      color: #888;
      margin-bottom: 4px;
    }
    
    .timeline-text {
      font-size: 13px;
      color: #ccc;
      margin-bottom: 4px;
      line-height: 1.5;
    }
    
    .timeline-date {
      font-size: 11px;
      color: #555;
    }
    
    .long-term-pattern {
      background: #1a1a1a;
      border: 1px solid #a855f7;
      border-radius: 8px;
      padding: 20px;
      color: #ddd;
      line-height: 1.8;
      font-size: 14px;
    }
    
    .footer {
      text-align: center;
      margin-top: 60px;
      padding-top: 30px;
      border-top: 2px solid #06b6d4;
      color: #666;
      font-size: 12px;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>OPERATOR DOSSIER</h1>
      <h2>VANGUARD ${data.callsign}</h2>
      <div class="rank-line">Rank: ${escapeHTML(data.rank)}</div>
      <p class="timestamp">Generated: ${new Date(data.generatedAt).toLocaleString()}</p>
    </header>

    <!-- ARCHETYPE CONSTELLATION -->
    <section class="section">
      <h3 class="section-title">Archetype Constellation</h3>
      <div class="archetype-grid">
        <div class="archetype-card">
          <div class="archetype-label">Primary</div>
          <div class="archetype-value">${data.archetypes.primary || 'Unknown'}</div>
        </div>
        <div class="archetype-card">
          <div class="archetype-label">Shadow</div>
          <div class="archetype-value">${data.archetypes.shadow || 'Unknown'}</div>
        </div>
        <div class="archetype-card">
          <div class="archetype-label">Rising</div>
          <div class="archetype-value">${data.archetypes.rising || 'Unknown'}</div>
        </div>
      </div>
    </section>

    <!-- MISSION STATISTICS -->
    <section class="section">
      <h3 class="section-title">Mission Performance</h3>
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">${data.missionStats.completedMissions}</div>
          <div class="stat-label">Missions Complete</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${unlockedTraits.length}</div>
          <div class="stat-label">Traits Unlocked</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${superpowerCount}</div>
          <div class="stat-label">Superpowers Active</div>
        </div>
      </div>
    </section>

    <!-- SEALED PHASE ASSESSMENTS -->
    ${assessmentsHTML}

    <!-- UNLOCKED TRAITS -->
    <section class="section">
      <h3 class="section-title">Identity Architecture</h3>
      ${traitsHTML}
    </section>

    <!-- LONG-TERM PATTERN -->
    ${data.longTermPattern ? `
    <section class="section">
      <h3 class="section-title">Long-Term Pattern</h3>
      <div class="long-term-pattern">
        ${data.longTermPattern}
      </div>
    </section>
    ` : ''}

    <!-- EVOLUTION TIMELINE -->
    <section class="section">
      <h3 class="section-title">Evolution Timeline</h3>
      ${timelineHTML}
    </section>

    <footer class="footer">
      <p>FOXHOLE ARCHIVE /// NEUROVERSE OS</p>
      <p style="margin-top: 10px; font-size: 10px;">Generated locally. No data transmitted.</p>
    </footer>
  </div>
</body>
</html>
  `;
}
