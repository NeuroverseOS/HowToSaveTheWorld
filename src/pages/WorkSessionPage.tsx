import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send } from "lucide-react";
import { loadState } from "@/lib/state-engine";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { WorkMode } from "@/lib/work-engine";

export default function WorkSessionPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentMode, setCurrentMode] = useState<WorkMode | null>(null);
  const [workContext, setWorkContext] = useState<any>(null);

  useEffect(() => {
    const state = loadState();
    if (!state || !state.work?.current_mode || !state.work?.current_context) {
      navigate("/work");
      return;
    }
    
    setCurrentMode(state.work.current_mode);
    setWorkContext(state.work.current_context);

    // Initial context lock message
    const initialMessage = {
      role: "assistant",
      content: `${state.work.current_mode.charAt(0).toUpperCase() + state.work.current_mode.slice(1)} Mode activated. Context locked:\n\nProject: ${state.work.current_context.project_name}\n\nDescribe your next step or ask a question to begin.`
    };
    setMessages([initialMessage]);
  }, [navigate]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isStreaming) return;

    const userMessage = { role: "user", content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsStreaming(true);

    try {
      const state = loadState();
      if (!state) throw new Error("State not found");

      const aiProvider = localStorage.getItem("neuroverse_ai_provider") || "openai";
      const apiKey = localStorage.getItem("neuroverse_api_key") || "";

      const response = await supabase.functions.invoke("echelon-chat", {
        body: {
          mode: currentMode,
          messages: [...messages, userMessage],
          workContext: workContext,
          userData: {
            callsign: state.user.vanguard.callsign,
            userId: state.user.id,
            language: state.user.language,
          },
        },
        headers: {
          "x-ai-provider": aiProvider,
          "x-ai-key": apiKey,
        },
      });

      if (response.error) throw response.error;

      const reader = response.data.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || "";
              if (content) {
                assistantMessage += content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg?.role === "assistant") {
                    newMessages[newMessages.length - 1] = {
                      role: "assistant",
                      content: assistantMessage,
                    };
                  } else {
                    newMessages.push({ role: "assistant", content: assistantMessage });
                  }
                  return newMessages;
                });
              }
            } catch (e) {
              console.error("Parse error:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to communicate with Echelon",
        variant: "destructive",
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleEndSession = () => {
    navigate("/work");
  };

  const modeColors = {
    design: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    build: "text-neuro-cyan bg-neuro-cyan/10 border-neuro-cyan/30",
    lead: "text-neuro-orange bg-neuro-orange/10 border-neuro-orange/30",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-neuro-border bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleEndSession}
                className="text-neuro-cyan hover:text-neuro-cyan/80"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                End Session
              </Button>
              {currentMode && (
                <Badge className={modeColors[currentMode]}>
                  {currentMode.charAt(0).toUpperCase() + currentMode.slice(1)} Mode
                </Badge>
              )}
            </div>
            {workContext && (
              <div className="text-sm text-muted-foreground">
                {workContext.project_name}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col max-w-4xl">
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.map((msg, idx) => (
            <Card
              key={idx}
              className={`p-4 ${
                msg.role === "user"
                  ? "bg-neuro-cyan/10 border-neuro-cyan/30 ml-12"
                  : "bg-card mr-12"
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
            </Card>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            placeholder="Type your message..."
            disabled={isStreaming}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isStreaming || !inputMessage.trim()}
            className="bg-neuro-cyan hover:bg-neuro-cyan/90 text-background"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
