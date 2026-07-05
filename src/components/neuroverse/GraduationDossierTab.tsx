import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, Lock, Shield } from "lucide-react";
import { buildDossierData } from "@/lib/graduation/buildDossierData";
import { generateDossierPDF } from "@/lib/graduation/generateDossierPDF";
import { toast } from "sonner";

export default function GraduationDossierTab() {
  const [loading, setLoading] = useState(false);

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
      <Card className="border-neuro-purple/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-neuro-purple">
            <FileDown className="h-6 w-6" />
            Operator Dossier
          </CardTitle>
          <CardDescription>
            Your complete identity archive — compiled locally via the Foxhole Engine
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This dossier contains your complete operational record:
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
                <span>Evolution Timeline</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neuro-cyan mt-0.5">◆</span>
                <span>Long-Term Pattern Analysis</span>
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
