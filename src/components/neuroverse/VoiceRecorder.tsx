import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getEdgeFunctionUrl, ACTIVE_SUPABASE_PUBLISHABLE_KEY, supabase } from "@/integrations/supabase/client";

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onTranscription, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          
          try {
            // Transcription spends the server's OpenAI key, so the edge
            // function requires a signed-in user. Send the session token when
            // available; anonymous operators get a 401 and a sign-in prompt.
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token || ACTIVE_SUPABASE_PUBLISHABLE_KEY;

            // Call transcription edge function
            const response = await fetch(
              getEdgeFunctionUrl('transcribe-audio'),
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ audio: base64Audio }),
              }
            );

            if (response.status === 401) {
              toast({
                title: "Sign In Required",
                description: "Voice transcription requires a signed-in account. Sign in to use voice features, or type your response instead.",
                variant: "destructive",
              });
              return;
            }

            if (!response.ok) {
              throw new Error('Transcription failed');
            }

            const { text } = await response.json();
            onTranscription(text);
            
            toast({
              title: "Voice Captured",
              description: "Your response has been transcribed.",
            });
          } catch (error) {
            console.error('Transcription error:', error);
            toast({
              title: "Transcription Failed",
              description: "Could not process your audio. Please try again.",
              variant: "destructive",
            });
          } finally {
            setIsProcessing(false);
          }
        };
        reader.readAsDataURL(audioBlob);

        // Clean up
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access error:', error);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to record audio.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <Button
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled || isProcessing}
      variant={isRecording ? "destructive" : "outline"}
      size="icon"
      className={`min-h-[44px] min-w-[44px] ${
        isRecording 
          ? "bg-red-500 hover:bg-red-600 animate-pulse" 
          : "border-neuro-cyan/50 text-neuro-cyan hover:bg-neuro-cyan/10"
      }`}
    >
      {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
    </Button>
  );
}
