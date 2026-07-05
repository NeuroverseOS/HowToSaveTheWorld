import html2pdf from 'html2pdf.js';
import { buildDossierHTML } from './dossierTemplate';
import type { DossierData } from './buildDossierData';

export async function generateDossierPDF(dossierData: DossierData): Promise<void> {
  console.log('[PDF] Generating graduation dossier PDF...');

  const htmlContent = buildDossierHTML(dossierData);

  const opt = {
    margin: 0.5,
    filename: `Operator_${dossierData.callsign}_Dossier.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      letterRendering: true,
      backgroundColor: '#0a0a0a'
    },
    jsPDF: { 
      unit: 'in', 
      format: 'letter', 
      orientation: 'portrait' as const,
      compress: true
    }
  };

  try {
    await html2pdf().from(htmlContent).set(opt).save();
    console.log('[PDF] Dossier PDF generated successfully');
  } catch (error) {
    console.error('[PDF] Failed to generate dossier:', error);
    throw new Error('Failed to generate PDF dossier');
  }
}
