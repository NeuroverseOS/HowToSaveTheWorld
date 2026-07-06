import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, ScrollText, Shield } from "lucide-react";
import { buildDossierData } from "@/lib/graduation/buildDossierData";
import { generateDossierPDF } from "@/lib/graduation/generateDossierPDF";
import { loadState } from "@/lib/state-engine";
import { getSlideBand } from "@/lib/campaign-engine";
import { toast } from "sonner";

interface SealedReport {
  phase: number;
  name: string;
  content: string;
  sealed_at: string;
}

interface CampaignSummary {
  slide: number;
  band: string;
  signal: number;
  decisionCount: number;
  missionsCompleted: number;
}

export default function GraduationDossierTab() {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<SealedReport[]>([]);
  const [campaign, setCampaign] = useState<CampaignSummary | null>(null);

  useEffect(() => {
    const state = loadState();
    if (!state) return;
    setReports(
      (state.phase_assessments || [])
        .slice()
        .sort((a, b) => a.phase - b.phase)
        .map((a) => ({ phase: a.phase, name: a.name, content: a.content, sealed_at: a.sealed_at }))
    );
    setCampaign({
      slide: state.world.slide,
      band: getSlideBand(state.world.slide).name,
      signal: state.world.signal,
      decisionCount: state.world.decisions.length,
      missionsCompleted: state.progress.lessons_completed.length,
    });
  }, []);

  async function handleDownload() {
    setLoading(true);
    try {
      const data = await buildDossierData();
      await generateDossierPDF(data);
      toast.success("Dossier generated successfully");
    } catch (error) {
      console.error("Failed to generate dossier:", error);
      toast.error("Failed to generate dossier");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Campaign record — the world this operator is running, live */}
      {campaign && (
        <Card className="border-neuro-cyan/40 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-neuro-cyan">Campaign Record</CardTitle>
            <CardDescription>
              The state of the war as your work has left it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 rounded-lg border border-border/40 bg-card/30">
                <div className="text-2xl font-bold text-neuro-cyan font-mono">{campaign.slide}/100</div>
                <div className="text-xs text-muted-foreground mt-1">The Slide — {campaign.band}</div>
              </div>
              <div className="p-3 rounded-lg border border-border/40 bg-card/30">
                <div className="text-2xl font-bold text-neuro-cyan font-mono">{campaign.signal}/100</div>
                <div className="text-xs text-muted-foreground mt-1">Operator Signal</div>
              </div>
              <div className="p-3 rounded-lg border border-border/40 bg-card/30">
                <div className="text-2xl font-bold text-neuro-cyan font-mono">{campaign.missionsCompleted}</div>
                <div className="text-xs text-muted-foreground mt-1">Missions Complete</div>
              </div>
              <div className="p-3 rounded-lg border border-border/40 bg-card/30">
                <div className="text-2xl font-bold text-neuro-cyan font-mono">{campaign.decisionCount}</div>
                <div className="text-xs text-muted-foreground mt-1">Decisions on Record</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Echelon's sealed reports — readable here, not just in the PDF */}
      {reports.length > 0 ? (
        reports.map((report) => (
          <Card key={report.phase} className="border-neuro-purple/40 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neuro-purple">
                <ScrollText className="h-5 w-5" />
                {report.name}
              </CardTitle>
              <CardDescription>
                Sealed {new Date(report.sealed_at).toLocaleDateString()} — a witnessing, not a grade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                {report.content}
              </p>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card className="border-border/40 bg-card/30">
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              No reports sealed yet. Echelon writes one at the close of each training phase
              (missions 30, 60, and 90) — each is presented to you and sealed only with your
              approval. They will appear here, in full.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border-neuro-purple/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-neuro-purple">
            <FileDown className="h-6 w-6" />
            Take It With You
          </CardTitle>
          <CardDescription>
            Your complete identity archive as a single document — compiled locally
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The full dossier bundles everything on this page plus:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-neuro-cyan mt-0.5">◆</span>
                <span>Archetype Constellation (Primary / Shadow / Rising)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neuro-cyan mt-0.5">◆</span>
                <span>Trait & Subskill Unlocks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neuro-cyan mt-0.5">◆</span>
                <span>Shadow & Superpower Revelations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neuro-cyan mt-0.5">◆</span>
                <span>Campaign Record & Decisions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neuro-cyan mt-0.5">◆</span>
                <span>Evolution Timeline</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neuro-cyan mt-0.5">◆</span>
                <span>Mission Performance Summary</span>
              </li>
            </ul>
          </div>

          <Button
            onClick={handleDownload}
            disabled={loading}
            size="lg"
            className="w-full bg-neuro-purple hover:bg-neuro-purple/80"
          >
            {loading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Generating Dossier...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Download My Dossier
              </>
            )}
          </Button>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-card/30 border border-border/30">
            <Shield className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Privacy Guarantee</p>
              <p>Generated fully offline. No data ever leaves your device.</p>
              <p>This dossier is yours alone — stored nowhere, transmitted nowhere.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
