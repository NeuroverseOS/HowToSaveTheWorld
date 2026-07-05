import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Share2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface TransmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callsign: string;
}

export function TransmissionModal({ open, onOpenChange, callsign }: TransmissionModalProps) {
  const [copied, setCopied] = useState(false);
  
  const transmissionUrl = `${window.location.origin}?transmission=${callsign}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(transmissionUrl);
    setCopied(true);
    toast({
      title: "Link Copied",
      description: "Transmission link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };
  
  const socialTemplates = {
    twitter: `The NeuroVerse has identified potential in your cognition.\n\nThis is not a course. It is a protocol.\n\nReceive the transmission: ${transmissionUrl}`,
    linkedin: `I've been training in the NeuroVerse OS — a sovereign system designed for builders of the decentralized future.\n\nIf you're ready to develop the cognitive infrastructure humanity needs, receive this transmission: ${transmissionUrl}`,
    whatsapp: `Incoming transmission from Vanguard ${callsign}.\n\nThe NeuroVerse OS has identified potential in your signal.\n\nConfirm receipt: ${transmissionUrl}`,
    encrypted: `═══════════════════════════════════\n ENCRYPTED TRANSMISSION DETECTED\n═══════════════════════════════════\n\nSource: Vanguard ${callsign}\nNetwork: NeuroVerse OS\nClearance: UNCLASSIFIED\n\nYou have been identified as a potential operator.\nThe Echelon Network requires cognitive infrastructure.\n\n[INITIATE CONTACT PROTOCOL]\n${transmissionUrl}\n\n═══════════════════════════════════\nThis transmission will self-destruct.\n═══════════════════════════════════`,
  };
  
  const handleShare = (platform: 'twitter' | 'linkedin' | 'whatsapp') => {
    const text = socialTemplates[platform];
    let url = '';
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(transmissionUrl)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        break;
    }
    
    window.open(url, '_blank', 'width=600,height=400');
  };
  
  const handleCopyEncrypted = () => {
    navigator.clipboard.writeText(socialTemplates.encrypted);
    toast({
      title: "Encrypted Message Copied",
      description: "Full transmission message copied to clipboard",
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-neuro-border">
        <DialogHeader>
          <DialogTitle className="text-2xl text-neuro-cyan flex items-center gap-2">
            <Share2 className="h-6 w-6" />
            SEND TRANSMISSION
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground pt-2">
            Share encrypted link with another potential Operator.
            The NeuroVerse will scan their signal when they arrive.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* URL Copy Section */}
          <Card className="p-4 bg-neuro-surface/50 border-neuro-cyan/30">
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm text-foreground/80 break-all bg-background/50 px-3 py-2 rounded">
                {transmissionUrl}
              </code>
              <Button
                onClick={handleCopy}
                variant="outline"
                size="icon"
                className="shrink-0 border-neuro-cyan/50 hover:bg-neuro-cyan/10"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-neuro-green" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </Card>
          
          {/* Social Share Buttons */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Quick Share:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                onClick={() => handleShare('twitter')}
                variant="outline"
                className="w-full border-neuro-border hover:bg-neuro-cyan/10"
              >
                𝕏 Twitter
              </Button>
              <Button
                onClick={() => handleShare('linkedin')}
                variant="outline"
                className="w-full border-neuro-border hover:bg-neuro-cyan/10"
              >
                LinkedIn
              </Button>
              <Button
                onClick={() => handleShare('whatsapp')}
                variant="outline"
                className="w-full border-neuro-border hover:bg-neuro-cyan/10"
              >
                WhatsApp
              </Button>
            </div>
          </div>
          
          {/* Encrypted Message Option */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Or copy the full encrypted transmission:</p>
            <Button
              onClick={handleCopyEncrypted}
              variant="outline"
              className="w-full border-neuro-orange/50 text-neuro-orange hover:bg-neuro-orange/10"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Encrypted Message
            </Button>
          </div>
          
          {/* Info Footer */}
          <div className="pt-4 border-t border-neuro-border/50">
            <p className="text-xs text-muted-foreground text-center">
              Recipients will see your callsign (Vanguard {callsign}) when they arrive.
              <br />
              No personal data is shared. All tracking remains local-first.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
