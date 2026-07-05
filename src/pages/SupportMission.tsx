import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function SupportMission() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  
  const variant = searchParams.get("variant") || "short";
  const ethAddress = "howtosavetheworld.eth";
  const paypalUrl = "https://www.paypal.com/ncp/payment/G9X8CZZVQXL7L";

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(ethAddress);
      setCopied(true);
      toast.success("Address copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy address");
    }
  };

  const shortCopy = (
    <>
      <p className="text-foreground/90 leading-relaxed mb-6">
        Your evolution strengthens the NeuroVerse.
      </p>
      <p className="text-foreground/70 leading-relaxed">
        If you choose to support this decentralized mission, you help keep this OS free, human-first, and independent.
      </p>
    </>
  );

  const longCopy = (
    <>
      <p className="text-foreground/90 leading-relaxed mb-4">
        Your actions widen the neural pathways of the decentralized future.
      </p>
      <p className="text-foreground/80 leading-relaxed mb-4">
        This OS exists outside corporations, ads, or surveillance systems. It survives through those who believe humanity must lead.
      </p>
      <p className="text-foreground/70 leading-relaxed">
        If you choose to support the builders, your contribution strengthens this free, sovereign system and funds the next evolution of the NeuroVerse.
      </p>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        {/* Title */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-light tracking-wide text-primary">
            Support the Mission
          </h1>
        </div>

        {/* Copy */}
        <div className="space-y-4 text-center max-w-xl mx-auto">
          {variant === "short" ? shortCopy : longCopy}
        </div>

        {/* Payment Options */}
        <div className="space-y-6 pt-8 border-t border-border/50">
          {/* Ethereum Option */}
          <div className="space-y-4">
            <p className="text-sm text-foreground/60 uppercase tracking-wider text-center">
              Ethereum
            </p>
            
            {/* Address with Copy Button */}
            <div className="flex items-center gap-2 p-4 rounded-md bg-muted/30 border border-border/30">
              <code className="text-sm md:text-base text-foreground flex-1 font-mono break-all">
                {ethAddress}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyAddress}
                className="h-10 w-10 p-0 flex-shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* PayPal Option */}
          <div className="space-y-4">
            <p className="text-sm text-foreground/60 uppercase tracking-wider text-center">
              PayPal
            </p>
            <Button
              variant="outline"
              className="w-full justify-between h-12"
              onClick={() => window.open(paypalUrl, "_blank")}
            >
              <span>Contribute via PayPal</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Continue Button */}
        <div className="pt-8">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate(-1)}
          >
            Continue Mission →
          </Button>
        </div>
      </div>
    </div>
  );
}
