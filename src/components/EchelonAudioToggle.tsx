import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSpeech } from "@/hooks/useSpeech";
import { ECHELON_VOICES } from "@/data/voices";

export function EchelonAudioToggle() {
  const { settings, updateSettings, isSpeaking, stop } = useSpeech();

  const handleToggle = () => {
    if (isSpeaking) {
      stop();
    }
    updateSettings({ enabled: !settings.enabled });
  };

  const voiceName = ECHELON_VOICES[settings.voice]?.name || "System Voice";
  const tooltipText = settings.enabled 
    ? `Audio On — ${voiceName}` 
    : "Audio Off";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className={`transition-colors ${
              settings.enabled 
                ? "text-neuro-cyan hover:text-neuro-cyan/80" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {settings.enabled ? (
              <Volume2 className={`h-5 w-5 ${isSpeaking ? "animate-pulse" : ""}`} />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
