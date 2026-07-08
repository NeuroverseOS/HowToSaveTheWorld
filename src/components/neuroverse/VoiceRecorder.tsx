import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

// Voice input is 100% on-device: the browser's own speech recognition.
// No audio ever leaves the machine, no server key is spent, no account
// is needed. On browsers without the Web Speech API (e.g. Firefox) the
// mic button simply doesn't render — typing always works.
const SpeechRecognitionImpl =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : undefined;

export function VoiceRecorder({ onTranscription, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");

  if (!SpeechRecognitionImpl) return null;

  const startRecording = () => {
    try {
      const recognition = new SpeechRecognitionImpl();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = navigator.language || "en-US";

      transcriptRef.current = "";

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcriptRef.current +=
              (transcriptRef.current ? " " : "") + event.results[i][0].transcript.trim();
          }
        }
      };

      recognition.onerror = (event: any) => {
        setIsRecording(false);
        if (event.error === "not-allowed") {
          toast({
            title: "Microphone Access Denied",
            description: "Please allow microphone access to use voice input.",
            variant: "destructive",
          });
        } else if (event.error !== "aborted" && event.error !== "no-speech") {
          toast({
            title: "Voice Input Error",
            description: "Could not capture speech. Please try again or type instead.",
            variant: "destructive",
          });
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (transcriptRef.current) {
          onTranscription(transcriptRef.current);
          toast({
            title: "Voice Captured",
            description: "Transcribed on your device — nothing was uploaded.",
          });
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Speech recognition error:", error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
  };

  return (
    <Button
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled}
      variant={isRecording ? "destructive" : "outline"}
      size="icon"
      className={`min-h-[44px] min-w-[44px] ${
        isRecording
          ? "bg-red-500 hover:bg-red-600 animate-pulse"
          : "border-neuro-cyan/50 text-neuro-cyan hover:bg-neuro-cyan/10"
      }`}
      title={isRecording ? "Stop recording" : "Speak your response (on-device)"}
    >
      {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
    </Button>
  );
}
