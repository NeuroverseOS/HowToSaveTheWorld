import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { VideoPlayer } from './VideoPlayer';
import { VoiceRecorder } from './VoiceRecorder';
import { useToast } from '@/hooks/use-toast';
import { supabase, getEdgeFunctionUrl, ACTIVE_SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';
import { Loader2, Send, ArrowRight, CheckCircle2, Sparkles, Zap, RefreshCw, Menu, HelpCircle } from 'lucide-react';
import type { Lesson } from '@/lib/lesson-queries';
import { MissionStage, type StateSchema, type MissionProgress, loadState, saveState } from '@/lib/state-engine';
import {
  STAGE_DISPLAY_NAMES,
  getStageContent,
  getNextStage,
  shouldShowInput,
  shouldShowVideo,
  getStageButtonText,
  calculateStageProgress,
} from '@/lib/stage-engine';
import { determineUnlocksFromReflection, type UnlockResult } from '@/lib/identity-unlock-engine';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HelpModal } from './HelpModal';
import { useUnlockAnimationContext } from './UnlockAnimationProvider';
import { renderEmphasis } from '@/lib/render-emphasis';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface MissionEngineProps {
  lesson: Lesson;
  userId: string;
  state: StateSchema;
  onLessonComplete: (reflections: MissionReflections) => void;
  mode?: 'active' | 'replay';
}

export interface MissionReflections {
  drill1_response: string;
  drill2_response: string;
  final_response: string;
  all_interactions: Message[];
}

// Stage display names now imported from stage-engine

export function MissionEngine({ lesson, userId, state, onLessonComplete, mode = 'active' }: MissionEngineProps) {
  const { toast } = useToast();
  const { triggerUnlock } = useUnlockAnimationContext();
  const [currentStage, setCurrentStage] = useState<MissionStage>(MissionStage.BRIEFING);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [drill1Response, setDrill1Response] = useState('');
  const [drill2Response, setDrill2Response] = useState('');
  const [finalResponse, setFinalResponse] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null); // Tracks user_lesson_progress.id for conversation logging
  const [showInactivityPulse, setShowInactivityPulse] = useState(false); // Pulse effect after 2min inactivity
  const [showHelpModal, setShowHelpModal] = useState(false); // Help modal state
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const systemPromptRef = useRef<string>(''); // Store last system prompt for logging
  const lastActivityRef = useRef<number>(Date.now()); // Track last user activity
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null); // Timer for inactivity check

  // Load saved mission progress & initialize session tracking
  useEffect(() => {
    const initializeSession = async () => {
      // Check for existing user_lesson_progress record
      const { data: existingProgress, error: fetchError } = await supabase
        .from('user_lesson_progress')
        .select('id, current_stage')
        .eq('user_id', userId)
        .eq('lesson_id', lesson.id)
        .maybeSingle();

      if (fetchError) {
        console.error('[CONVERSATION LOG] Error fetching progress:', fetchError);
      }

      if (existingProgress) {
        setSessionId(existingProgress.id);
        console.log('[CONVERSATION LOG] ✅ Session ID loaded:', existingProgress.id);
      } else {
        // Create new user_lesson_progress record
        const { data: newProgress, error: createError } = await supabase
          .from('user_lesson_progress')
          .insert({
            user_id: userId,
            lesson_id: lesson.id,
            current_stage: MissionStage.BRIEFING,
          })
          .select('id')
          .single();

        if (createError) {
          console.error('[CONVERSATION LOG] Error creating progress:', createError);
        } else if (newProgress) {
          setSessionId(newProgress.id);
          console.log('[CONVERSATION LOG] ✅ New session created:', newProgress.id);
        }
      }
    };

    initializeSession();

    const savedProgress = state.progress.mission_progress?.[lesson.lesson_number];
    if (savedProgress) {
      setCurrentStage(savedProgress.current_stage);
      setVideoCompleted(savedProgress.video_completed);
      setDrill1Response(savedProgress.drill1_response || '');
      setDrill2Response(savedProgress.drill2_response || '');
      setFinalResponse(savedProgress.final_response || '');
      
      // Reconstruct messages from stage history
      const reconstructedMessages: Message[] = [];
      savedProgress.stage_history.forEach(entry => {
        if (entry.user_response) {
          reconstructedMessages.push({ role: 'user', content: entry.user_response });
        }
      });
      setMessages(reconstructedMessages);
    } else if (mode === 'active') {
      // First time: deliver briefing
      deliverBriefing();
    }
    
    // Debug log for Re-engage Protocol button visibility
    console.log('[RE-ENGAGE] Button visibility check:', {
      mode,
      currentStage,
      isComplete: currentStage === MissionStage.COMPLETE,
      shouldShow: mode === 'active' && currentStage !== MissionStage.COMPLETE
    });
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Track user activity and manage inactivity pulse
  useEffect(() => {
    const resetActivity = () => {
      lastActivityRef.current = Date.now();
      setShowInactivityPulse(false);

      // Clear existing timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Set new timer for 2 minutes (120,000ms)
      inactivityTimerRef.current = setTimeout(() => {
        setShowInactivityPulse(true);
        console.log('[INACTIVITY] 2 minutes passed - showing pulse on Re-engage Protocol');
      }, 120000);
    };

    // Listen for user interactions
    const handleActivity = () => {
      resetActivity();
    };

    // Track various user activities
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    // Initial setup
    resetActivity();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  // Save progress to state
  const saveMissionProgress = (updates: Partial<MissionProgress>) => {
    const currentState = loadState() || state;
    const lessonProgress = currentState.progress.mission_progress?.[lesson.lesson_number] || {
      current_stage: currentStage,
      stage_history: [],
      video_completed: false,
      drill1_response: null,
      drill2_response: null,
      final_response: null,
    };

    const updatedProgress: MissionProgress = {
      ...lessonProgress,
      ...updates,
    };

    currentState.progress.mission_progress = {
      ...currentState.progress.mission_progress,
      [lesson.lesson_number]: updatedProgress,
    };

    saveState(currentState);
  };

  /**
   * Log a stage transition to mission_stage_history table.
   * Canon: raw chat is never saved — only stage-transition metadata is
   * written. Message arguments are accepted (call sites unchanged) but
   * their conversational content is deliberately not persisted.
   * Confirmed reflections persist exactly as before, elsewhere.
   */
  const logConversationStep = async (
    _userMessage: string,
    _echelonResponse: string,
    _systemPrompt?: string
  ) => {
    if (!sessionId) {
      console.warn('[STAGE LOG] ⚠️ No session ID - skipping log');
      return;
    }

    try {
      const { error } = await supabase
        .from('mission_stage_history')
        .insert({
          session_id: sessionId,
          stage: currentStage,
        });

      if (error) {
        console.error('[STAGE LOG] ❌ Error logging stage transition:', error);
      } else {
        console.log(`[STAGE LOG] ✅ Logged stage transition: ${currentStage}`);
      }
    } catch (error) {
      console.error('[STAGE LOG] ❌ Exception logging stage transition:', error);
    }
  };

  const deliverBriefing = async () => {
    if (!lesson.briefing) {
      toast({
        title: "Mission Error",
        description: "Briefing content not available",
        variant: "destructive",
      });
      return;
    }

    setIsStreaming(true);
    const callsign = state.user.vanguard.callsign || "Operator";
    const briefingMessage = `Operator ${callsign}, mission briefing incoming.\n\n${lesson.briefing}`;
    
    await streamMessage(briefingMessage);
    
    // Log briefing delivery (no user input for initial briefing)
    await logConversationStep('', briefingMessage);
    
    setIsStreaming(false);
  };

  const streamMessage = async (content: string, userInput?: string) => {
    const words = content.split(' ');
    let accumulated = '';
    
    for (let i = 0; i < words.length; i++) {
      accumulated += (i > 0 ? ' ' : '') + words[i];
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        
        if (lastMessage?.role === 'assistant') {
          newMessages[newMessages.length - 1] = { role: 'assistant', content: accumulated };
        } else {
          newMessages.push({ role: 'assistant', content: accumulated });
        }
        return newMessages;
      });
      await new Promise(resolve => setTimeout(resolve, 30));
    }
  };

  const streamEchelonResponse = async (userMessage: string, drillPrompt?: string, operatorRequest?: string) => {
    setIsStreaming(true);

    try {
      const callsign = state.user.vanguard.callsign || "Operator";
      const archetypeData = state.user.archetype.assessment_complete ? {
        primary: state.user.archetype.primary,
        shadow: state.user.archetype.shadow,
        rising: state.user.archetype.rising,
      } : null;

      // Get AI provider config from localStorage
      const aiProvider = localStorage.getItem('neuroverse_ai_provider') || 'openai';
      const aiKey = localStorage.getItem('neuroverse_api_key') || '';
      const ollamaEndpoint = localStorage.getItem('neuroverse_ollama_endpoint') || 'http://localhost:11434';
      const ollamaModel = localStorage.getItem('neuroverse_ollama_model') || 'llama2';

      // Validate credentials
      if (!aiProvider || (aiProvider !== 'ollama' && !aiKey)) {
        toast({
          title: "Echelon Not Activated",
          description: "Please activate Echelon first from Settings",
          variant: "destructive",
        });
        setIsStreaming(false);
        return;
      }

      const response = await fetch(
        getEdgeFunctionUrl('echelon-chat'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ACTIVE_SUPABASE_PUBLISHABLE_KEY}`,
            'x-ai-provider': aiProvider,
            'x-ai-key': aiKey,
            'x-ollama-endpoint': ollamaEndpoint,
            'x-ollama-model': ollamaModel,
          },
          body: JSON.stringify({
            messages: messages.filter(m => m.role === 'user' || m.role === 'assistant'),
            lesson: lesson, // Send full lesson, edge function will filter by stage
            userData: {
              userId: state.user.id,
              callsign,
              archetype: archetypeData,
              language: {
                code: state.user.language.code,
                name: state.user.language.name,
              },
            },
            currentStage,
            ...(operatorRequest && { operatorRequest }), // Include special request if provided
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Rate Limit",
            description: "Too many requests. Please wait a moment.",
            variant: "destructive",
          });
          setIsStreaming(false);
          return;
        }
        if (response.status === 402) {
          toast({
            title: "Payment Required",
            description: "Please add credits to continue.",
            variant: "destructive",
          });
          setIsStreaming(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let assistantMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          let data: string;
          if (line.startsWith('data: ')) data = line.slice(6);
          else if (line.trim().startsWith('{')) data = line.trim(); // Ollama NDJSON
          else continue;
          {
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content ?? // OpenAI
                parsed.delta?.text ?? // Anthropic
                parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? // Gemini
                parsed.message?.content; // Ollama
              
              if (content) {
                assistantMessage += content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  
                  if (lastMessage?.role === 'assistant') {
                    newMessages[newMessages.length - 1] = { role: 'assistant', content: assistantMessage };
                  } else {
                    newMessages.push({ role: 'assistant', content: assistantMessage });
                  }
                  return newMessages;
                });
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      // Log conversation step after streaming completes
      if (userMessage && assistantMessage) {
        await logConversationStep(userMessage, assistantMessage);
      }
    } catch (error) {
      console.error('Error streaming response:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to Echelon",
        variant: "destructive",
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const advanceToNextStage = (userResponse?: string) => {
    const nextStage = getNextStage(currentStage);
    
    if (!nextStage) {
      console.warn('[MISSION ENGINE] Cannot advance - already at final stage');
      return;
    }
    
    console.log(`[MISSION ENGINE] Stage Transition: ${currentStage} → ${nextStage}`);
    setIsTransitioning(true);
    
    setTimeout(() => {
      saveMissionProgress({
        current_stage: nextStage,
        stage_history: [
          ...(state.progress.mission_progress?.[lesson.lesson_number]?.stage_history || []),
          {
            stage: currentStage,
            completed_at: new Date().toISOString(),
            user_response: userResponse,
          },
        ],
      });
      setCurrentStage(nextStage);
      setIsTransitioning(false);
    }, 300);
  };

  const handleBriefingAdvance = () => {
    advanceToNextStage(); // Advances to DRILL1
    if (lesson.drill1_prompt) {
      const callsign = state.user.vanguard.callsign || "Operator";
      streamMessage(`Operator ${callsign}, first mapping drill:\n\n${lesson.drill1_prompt}`, '');
    }
  };

  const handleDrill1Submit = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setDrill1Response(userMessage);
    saveMissionProgress({ drill1_response: userMessage });

    await streamEchelonResponse(userMessage);
    
    // Advance to video after acknowledgment
    setTimeout(() => {
      advanceToNextStage(userMessage); // Advances to VIDEO
      const callsign = state.user.vanguard.callsign || "Operator";
      streamMessage(`Operator ${callsign}, activate field footage now.`, '');
    }, 1000);
  };

  const handleVideoComplete = () => {
    setVideoCompleted(true);
    saveMissionProgress({ video_completed: true });
  };

  const handleVideoAdvance = () => {
    advanceToNextStage(); // Advances to HP
  };

  const handleHPAdvance = () => {
    advanceToNextStage(); // Advances to DRILL2
    if (lesson.drill2_prompt) {
      const callsign = state.user.vanguard.callsign || "Operator";
      streamMessage(`Operator ${callsign}, deepening drill:\n\n${lesson.drill2_prompt}`, '');
    }
  };

  const handleDrill2Submit = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setDrill2Response(userMessage);
    saveMissionProgress({ drill2_response: userMessage });

    await streamEchelonResponse(userMessage);
    
    setTimeout(() => {
      advanceToNextStage(userMessage); // Advances to DEBRIEF
      if (lesson.debrief) {
        streamMessage(lesson.debrief, '');
      }
    }, 1000);
  };

  const handleDebriefAdvance = () => {
    advanceToNextStage(); // Advances to FINAL
    if (lesson.final_question) {
      const callsign = state.user.vanguard.callsign || "Operator";
      streamMessage(`Operator ${callsign}, final anchor:\n\n${lesson.final_question}`, '');
    }
  };

  const handleFinalSubmit = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setFinalResponse(userMessage);
    saveMissionProgress({ final_response: userMessage });

    await streamEchelonResponse(userMessage);
    
    setTimeout(async () => {
      advanceToNextStage(userMessage); // Advances to COMPLETE
      const callsign = state.user.vanguard.callsign || "Operator";
      streamMessage(`Mission complete, Vanguard ${callsign}.\nYour perception has evolved.`, '');
      
      // IDENTITY UNLOCK ENGINE: Determine unlocks from reflection
      console.log('[MISSION ENGINE] 🔍 Analyzing reflection for trait/subskill unlocks...');
      
      try {
        const conversationHistory: Message[] = [
          ...messages,
          { role: 'user' as const, content: userMessage }
        ];

        const unlocks = await determineUnlocksFromReflection(
          state.user.id,
          lesson.id,
          userMessage,
          conversationHistory.map(m => ({ role: m.role, content: m.content }))
        );

        console.log(`[MISSION ENGINE] ✅ ${unlocks.length} unlocks determined`);

        // Display each unlock with toast notification AND visual animation
        unlocks.forEach((unlock, index) => {
          setTimeout(() => {
            const icon = unlock.type === 'trait' ? '🔓' : 
                        unlock.type === 'subskill' ? '📈' :
                        unlock.type === 'shadow' ? '🌑' : '⚡';
            
            const title = unlock.type === 'trait' ? 'Trait Unlocked' :
                         unlock.type === 'subskill' ? 'Subskill Unlocked' :
                         unlock.type === 'shadow' ? 'Shadow Revealed' : 'SUPERPOWER UNLOCKED';
            
            // Toast notification for persistence
            toast({
              title: `${icon} ${title}`,
              description: unlock.insightText,
              duration: unlock.type === 'superpower' ? 8000 : 5000,
            });

            // Trigger visual animation
            triggerUnlock({
              type: unlock.type,
              data: {
                name: unlock.subskillName || unlock.traitTag,
                description: unlock.insightText,
              },
            });
          }, index * 1500); // Increased stagger to allow animations to complete
        });

        // Add delay for unlock notifications + animations before completion
        const unlockDelay = unlocks.length > 0 ? unlocks.length * 1500 + 1000 : 2000;
        
        // Trigger mission completion animation
        setTimeout(() => {
          triggerUnlock({
            type: 'mission',
            data: {
              name: lesson.lesson_title,
              description: 'Mission objectives achieved',
            },
          });
        }, unlockDelay - 500);
        
        setTimeout(() => {
          onLessonComplete({
            drill1_response: drill1Response,
            drill2_response: drill2Response,
            final_response: userMessage,
            all_interactions: conversationHistory,
          });
        }, unlockDelay);
      } catch (error) {
        console.error('[MISSION ENGINE] Unlock determination failed:', error);
        
        // Still complete the mission even if unlocks fail
        setTimeout(() => {
          onLessonComplete({
            drill1_response: drill1Response,
            drill2_response: drill2Response,
            final_response: userMessage,
            all_interactions: [...messages, { role: 'user' as const, content: userMessage }],
          });
        }, 2000);
      }
    }, 1000);
  };

  const handleVoiceTranscription = (text: string) => {
    setInput(text);
  };

  // Handle Re-engage Protocol button
  const handleReengageProtocol = async () => {
    if (isStreaming) return;

    try {
      setIsStreaming(true);

      // Stream Echelon's re-engagement response with special flag
      await streamEchelonResponse(
        '[RE-ENGAGE PROTOCOL]',
        undefined,
        'REENGAGE_PROTOCOL'
      );
    } catch (error) {
      console.error('[RE-ENGAGE] Failed:', error);
      toast({
        title: "Re-engagement Failed",
        description: "Unable to re-engage protocol. Please try again.",
        variant: "destructive",
      });
      setIsStreaming(false);
    }
  };

  const renderStageIndicator = () => {
    const stages = Object.values(MissionStage);
    const currentIndex = stages.indexOf(currentStage);

    return (
      <TooltipProvider>
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2">
          {stages.map((stage, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            
            return (
              <div key={stage} className="flex items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`
                        flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-xs
                        transition-all duration-300 ease-in-out cursor-pointer
                        ${isCompleted ? 'bg-neuro-orange text-white scale-100' : ''}
                        ${isCurrent ? 'bg-neuro-orange/20 border-2 border-neuro-orange text-neuro-orange animate-pulse scale-110' : ''}
                        ${!isCompleted && !isCurrent ? 'bg-neuro-border/30 text-muted-foreground scale-95 opacity-60' : ''}
                        hover:scale-105
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 animate-scale-in" />
                      ) : (
                        <span className="font-mono font-bold">{index + 1}</span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="bottom" 
                    className="bg-neuro-dark border-neuro-border text-xs font-mono"
                  >
                    <p className="text-neuro-orange">{STAGE_DISPLAY_NAMES[stage]}</p>
                    <p className="text-muted-foreground text-[10px]">
                      {isCompleted ? '✓ Complete' : isCurrent ? 'In Progress' : 'Pending'}
                    </p>
                  </TooltipContent>
                </Tooltip>
                {index < stages.length - 1 && (
                  <div 
                    className={`
                      w-4 sm:w-8 h-0.5 transition-all duration-500 ease-in-out
                      ${isCompleted ? 'bg-neuro-orange scale-x-100' : 'bg-neuro-border/30 scale-x-75'}
                    `} 
                  />
                )}
              </div>
            );
          })}
        </div>
      </TooltipProvider>
    );
  };

  // Debug log when footer conditions change
  useEffect(() => {
    console.log('[RE-ENGAGE] Footer visibility check:', {
      mode,
      currentStage,
      isComplete: currentStage === MissionStage.COMPLETE,
      shouldShow: mode === 'active' && currentStage !== MissionStage.COMPLETE
    });
  }, [mode, currentStage]);

  return (
    <Card className="w-full max-w-4xl mx-auto bg-neuro-dark border-neuro-border shadow-2xl overflow-hidden flex flex-col max-h-screen">
      {/* Scrollable content area - includes header and messages */}
      <ScrollArea className="flex-1">
        {/* Header - scrolls naturally with content */}
        <div className="p-4 sm:p-6 border-b border-neuro-border space-y-4 bg-gradient-to-r from-neuro-dark to-neuro-dark/80">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-foreground truncate animate-fade-in">
                {lesson.lesson_title}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
                {lesson.phase} · {lesson.section_name}
              </p>
            </div>
            
            {/* Hamburger Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowHelpModal(true)}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Guide
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-neuro-orange"
                  onClick={handleReengageProtocol}
                  disabled={isStreaming}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Re-engage Protocol
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="text-xs sm:text-sm text-neuro-orange font-mono shrink-0 animate-fade-in px-3 py-1 bg-neuro-orange/10 rounded-full border border-neuro-orange/30">
              {STAGE_DISPLAY_NAMES[currentStage]}
            </div>
          </div>
          
          {renderStageIndicator()}
        </div>

        {/* Messages area */}
        <div className={`p-4 sm:p-6 space-y-4 transition-opacity duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>

          {messages.filter((m) => !m.content.startsWith("[STAGE_CONTENT") && (m.content.trim() !== "" || isStreaming)).map((msg, idx) => (
            <div
              key={idx}
              className={`
                p-3 sm:p-4 rounded-lg animate-fade-in
                transition-all duration-300 ease-in-out
                ${msg.role === 'user'
                  ? 'bg-primary/10 ml-8 sm:ml-12 hover:bg-primary/15'
                  : 'bg-muted mr-8 sm:mr-12 hover:bg-muted/80'
                }
              `}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="text-xs text-muted-foreground mb-1 font-mono">
                {msg.role === 'user' ? state.user.vanguard.full_identity || 'OPERATOR' : 'ECHELON'}
              </div>
              <div className="text-base whitespace-pre-wrap leading-relaxed">{renderEmphasis(msg.content)}</div>
            </div>
          ))}

          {currentStage === MissionStage.VIDEO && lesson.video_url && (
            <div className="animate-fade-in">
              <VideoPlayer
                videoUrl={lesson.video_url}
                onComplete={handleVideoComplete}
                callsign={state.user.vanguard.callsign || "Operator"}
              />
            </div>
          )}

          {currentStage === MissionStage.HP && (
            <Card className="p-4 sm:p-6 bg-neuro-dark/50 border-neuro-border animate-fade-in">
              <div className="space-y-4">
                <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                  <div className="text-sm font-bold text-neuro-orange mb-2 font-mono">HEAD</div>
                  <div className="text-base whitespace-pre-wrap leading-relaxed">{renderEmphasis(lesson.head)}</div>
                </div>
                <div className="h-px bg-neuro-border/30" />
                <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                  <div className="text-sm font-bold text-neuro-orange mb-2 font-mono">PRACTICAL</div>
                  <div className="text-base whitespace-pre-wrap leading-relaxed">{renderEmphasis(lesson.practical)}</div>
                </div>
              </div>
            </Card>
          )}

          {isStreaming && (
            <div className="flex items-center gap-3 text-muted-foreground animate-fade-in p-3 sm:p-4 bg-muted/50 rounded-lg border border-neuro-border/30">
              <Loader2 className="h-5 w-5 animate-spin text-neuro-cyan" />
              <div className="space-y-1">
                <span className="text-sm font-mono text-neuro-cyan">ECHELON PROCESSING</span>
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-neuro-cyan rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-1 bg-neuro-cyan rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-1 bg-neuro-cyan rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Fixed footer with controls */}
      {mode === 'active' && currentStage !== MissionStage.COMPLETE && (
        <div className="p-4 sm:p-6 border-t border-neuro-border space-y-3 bg-neuro-dark">
          {(currentStage === MissionStage.DRILL1 || currentStage === MissionStage.DRILL2 || currentStage === MissionStage.FINAL) && (
            <div className="flex gap-2 sm:gap-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (currentStage === MissionStage.DRILL1) handleDrill1Submit();
                    if (currentStage === MissionStage.DRILL2) handleDrill2Submit();
                    if (currentStage === MissionStage.FINAL) handleFinalSubmit();
                  }
                }}
                placeholder="Enter your response..."
                disabled={isStreaming}
                className="min-h-[100px] sm:min-h-[80px] resize-none transition-all duration-200 focus:ring-2 focus:ring-neuro-orange"
              />
              <div className="flex flex-col gap-2">
                <VoiceRecorder onTranscription={handleVoiceTranscription} />
                <Button
                  onClick={() => {
                    if (currentStage === MissionStage.DRILL1) handleDrill1Submit();
                    if (currentStage === MissionStage.DRILL2) handleDrill2Submit();
                    if (currentStage === MissionStage.FINAL) handleFinalSubmit();
                  }}
                  disabled={!input.trim() || isStreaming}
                  size="icon"
                  className="min-h-[48px] min-w-[48px] transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {currentStage === MissionStage.BRIEFING && !isStreaming && (
            <Button 
              onClick={handleBriefingAdvance} 
              className="w-full min-h-[48px] transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              <ArrowRight className="h-5 w-5 mr-2" />
              Begin Mission
            </Button>
          )}

          {currentStage === MissionStage.VIDEO && videoCompleted && (
            <Button 
              onClick={handleVideoAdvance} 
              className="w-full min-h-[48px] transition-all duration-200 hover:scale-[1.02] active:scale-95 animate-fade-in"
            >
              <ArrowRight className="h-5 w-5 mr-2" />
              Continue Mission
            </Button>
          )}

          {currentStage === MissionStage.HP && (
            <Button 
              onClick={handleHPAdvance} 
              className="w-full min-h-[48px] transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              <ArrowRight className="h-5 w-5 mr-2" />
              Proceed to Deepening
            </Button>
          )}

          {currentStage === MissionStage.DEBRIEF && !isStreaming && (
            <Button 
              onClick={handleDebriefAdvance} 
              className="w-full min-h-[48px] transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              <ArrowRight className="h-5 w-5 mr-2" />
              Final Anchor
            </Button>
          )}
        </div>
      )}
      
      {/* Help Modal */}
      <HelpModal
        open={showHelpModal}
        onOpenChange={setShowHelpModal}
      />
    </Card>
  );
}
