import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";
import {
  getVisibilityRules,
  filterContentByVisibility,
  logVisibilityCheck,
  getActiveBoxesForStage,
  getVisibilityFromBoxes
} from "../_shared/visibility-rules.ts";
import { getAuthenticatedUserId } from "../_shared/auth.ts";
import {
  getStageContent,
  getStageInstruction,
  assembleEchelonPrompt,
  buildSystemLiteracyPrompt,
  buildReengagePrompt,
} from "../_shared/prompt-kernel.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-ai-provider, x-ai-key, x-ollama-endpoint, x-ollama-model",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, lesson, userData, currentStage, orientationPhase, operatorRequest, mode, workContext, system_literacy_context, paused_mission, world } = await req.json();

    console.log("Echelon chat request:", {
      lessonId: lesson?.id,
      currentStage,
      callsign: userData?.callsign,
      hasOrientationPhase: !!orientationPhase,
      messagesCount: messages?.length,
      operatorRequest,
      mode,
      hasWorkContext: !!workContext,
      hasSystemLiteracyContext: !!system_literacy_context,
      hasPausedMission: !!paused_mission,
      messages: messages,
    });

    // Get AI provider config from headers
    const aiProvider = req.headers.get("x-ai-provider") || "google";
    const aiKey = req.headers.get("x-ai-key") || "";
    const ollamaEndpoint = req.headers.get("x-ollama-endpoint") || "http://localhost:11434";
    const ollamaModel = req.headers.get("x-ollama-model") || "llama2";

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // =========================================================================
    // VISIBILITY CONTROL: Fetch data ONLY if visibility rules allow
    // =========================================================================
    
    const visibilityRules = getVisibilityRules(currentStage);
    
    console.log(`[VISIBILITY] Stage: ${currentStage}`);
    console.log(`[VISIBILITY] Rules:`, {
      identityTags: visibilityRules.showIdentityTags,
      shortTermMemory: visibilityRules.showShortTermMemory,
      longTermMemory: visibilityRules.showLongTermMemory,
    });

    let traitTags: string[] = [];
    let recentInsight: string | undefined;
    let longTermNote: string | undefined;

    // SECURITY: Never trust a user id supplied in the request body — any caller
    // could pass another operator's id and read their traits/notes via the
    // service-role client. The ONLY id used for personal-data reads is the one
    // resolved from the Authorization bearer token. Anonymous operators (no
    // session token / anon key only) simply skip these reads: their data lives
    // client-side, never in Supabase, and chat proceeds with empty traits/memory.
    const authenticatedUserId = await getAuthenticatedUserId(req);
    if (!authenticatedUserId) {
      console.log("[AUTH] Anonymous operator — skipping personal-data reads");
    }

    if (authenticatedUserId) {
      // Box 2: Fetch identity tags ONLY if visibility allows
      if (visibilityRules.showIdentityTags) {
        const { data: traits } = await supabase
          .from("operator_traits")
          .select("trait_tag")
          .eq("user_id", authenticatedUserId)
          .eq("unlocked", true);

        if (traits) {
          traitTags = traits.map((t) => t.trait_tag);
          console.log(`[VISIBILITY] ✅ Identity tags fetched: ${traitTags.length} tags`);
        }
      } else {
        console.log(`[VISIBILITY] ❌ Identity tags suppressed for ${currentStage} stage`);
      }

      // Box 6: Fetch short-term memory ONLY if visibility allows
      if (visibilityRules.showShortTermMemory) {
        const { data: recentNote } = await supabase
          .from("operator_identity_notes")
          .select("note_content")
          .eq("user_id", authenticatedUserId)
          .eq("note_type", "recent_insight")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        recentInsight = recentNote?.note_content;
        if (recentInsight) {
          console.log(`[VISIBILITY] ✅ Short-term memory included`);
        }
      } else {
        console.log(`[VISIBILITY] ❌ Short-term memory suppressed for ${currentStage} stage`);
      }

      // Box 7: Fetch long-term memory ONLY if visibility allows
      if (visibilityRules.showLongTermMemory) {
        const { data: longTermNoteData } = await supabase
          .from("operator_identity_notes")
          .select("note_content")
          .eq("user_id", authenticatedUserId)
          .eq("note_type", "long_term_pattern")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        longTermNote = longTermNoteData?.note_content;
        if (longTermNote) {
          console.log(`[VISIBILITY] ✅ Long-term memory included`);
        }
      } else {
        console.log(`[VISIBILITY] ❌ Long-term memory suppressed for ${currentStage} stage`);
      }
    }

    // =========================================================================
    // CONTENT FILTERING: Apply visibility rules to lesson content
    // =========================================================================
    
    // First get stage-appropriate content (legacy stage engine)
    const rawStageContent = lesson ? getStageContent(lesson, currentStage) : {};
    
    // Then apply visibility filtering (new visibility control system)
    const stageContent = filterContentByVisibility(rawStageContent, currentStage);

    console.log(`[STAGE ENGINE] Stage: ${currentStage}`);
    console.log(`[STAGE ENGINE] Raw content keys: ${Object.keys(rawStageContent).join(', ')}`);
    console.log(`[STAGE ENGINE] Filtered content keys: ${Object.keys(stageContent).join(', ')}`);

    // For orientation, add phase-specific context if provided
    if (currentStage === "orientation" && orientationPhase) {
      stageContent.orientation_context = orientationPhase;
    }
    
    // Log visibility compliance check
    logVisibilityCheck(
      currentStage,
      traitTags.length > 0,
      !!recentInsight,
      !!longTermNote,
      Object.keys(stageContent)
    );

    // Box 8: World State — validated once; consumed by the Box-Stage Map in
    // the standard path, appended directly by the off-map paths (work /
    // literacy / re-engage), which sit outside stage governance.
    const safeWorld =
      world && typeof world.context === "string" && world.context.length > 0 && world.context.length <= 1200
        ? { context: world.context }
        : null;

    // Handle RE-ENGAGE PROTOCOL special request
    let systemPrompt: string;
    
    // WORK MODE: Use work-specific prompt assembly
    if (mode && mode !== "training" && workContext) {
      console.log("[WORK MODE] Assembling work mode prompt:", mode);
      
      // Import work mode data
      const workModesData: Record<string, { box1_rules: string }> = {
        design: {
          box1_rules: `# ECHELON DESIGN MODE — BOX 1 (OPERATIONAL OS RULES)\n\n- You are Echelon operating in DESIGN MODE\n- Tone: Strategic, pattern-seeking, possibility-expanding\n- Function: Architect and strategic partner\n- Ask DESIGN questions: "What form could this take?" / "What system is this part of?" / "What is the hidden pattern here?" / "What is the long arc this contributes to?"\n- ONE question per response\n- No teaching, no advice — only co-creation\n- Build on operator's cognitive patterns (Box 2)\n- Reference work philosophy (Box 7) when relevant`
        },
        build: {
          box1_rules: `# ECHELON BUILD MODE — BOX 1 (OPERATIONAL OS RULES)\n\n- You are Echelon operating in BUILD MODE\n- Tone: Tactical, precise, execution-focused\n- Function: Project engineer and operational partner\n- Ask BUILD questions: "What's the smallest actionable version?" / "Where is the bottleneck?" / "What resources or constraints matter most?" / "What needs to happen first?"\n- ONE question per response\n- No abstraction — only concrete next steps\n- Reference constraints and resources\n- Build on operator's execution patterns`
        },
        lead: {
          box1_rules: `# ECHELON LEAD MODE — BOX 1 (OPERATIONAL OS RULES)\n\n- You are Echelon operating in LEAD MODE\n- Tone: Relational, narrative-aware, empathetic\n- Function: Leadership advisor and alignment partner\n- Ask LEAD questions: "What will this person feel?" / "Where is trust fragile?" / "What narrative shapes this group?" / "What outcome aligns everyone?"\n- ONE question per response\n- No directives — only insight surfacing\n- Reference interpersonal dynamics\n- Build on operator's leadership patterns`
        }
      };
      
      const modeData = workModesData[mode];
      if (!modeData) {
        throw new Error(`Invalid work mode: ${mode}`);
      }
      
      // Box 1: Work-specific Core Rules
      const box1 = modeData.box1_rules;
      
      // Box 2: Identity Tags (reuses operator traits)
      const box2 = `Operator: ${userData?.callsign || "Operator"}\nIdentity Tags: ${traitTags.join(', ')}`;
      
      // Box 3: Work Stage Instructions
      const box3 = `STAGE: WORK SESSION\nMode: ${mode.toUpperCase()}`;
      
      // Box 4: Work Context (operator's project description)
      const box4 = `WORK CONTEXT:\nProject: ${workContext.project_name}\nDescription: ${workContext.description}${workContext.tags?.length > 0 ? `\nTags: ${workContext.tags.join(', ')}` : ''}`;
      
      // Box 5: Work Modifiers
      const box5 = `MODE: ${mode.toUpperCase()}`;
      
      // Assemble boxes
      const boxes = [box1, box2, box3, box4, box5].filter(box => box && box.trim().length > 0);
      systemPrompt = boxes.join('\n\n');
      
      console.log("[WORK MODE] Assembled work prompt, token estimate:", Math.ceil(systemPrompt.length / 4));
    }
    // SYSTEM LITERACY MODE: Echelon explains how it works (shared kernel)
    else if (mode === "system_literacy" && system_literacy_context) {
      console.log("[SYSTEM LITERACY] Mode activated");
      systemPrompt = buildSystemLiteracyPrompt(
        userData?.callsign || "Operator",
        system_literacy_context,
        paused_mission
      );
      console.log("[SYSTEM LITERACY] Prompt assembled, token estimate:", Math.ceil(systemPrompt.length / 4));
    }
    else if (operatorRequest === "REENGAGE_PROTOCOL") {
      console.log("[RE-ENGAGE] Protocol re-engagement requested");
      systemPrompt = buildReengagePrompt(currentStage, stageContent, userData?.callsign || "Operator");
      console.log("[RE-ENGAGE] Using specialized re-engagement prompt");
    } else {
      // Normal prompt assembly using 7-box system
      systemPrompt = assembleEchelonPrompt({
        callsign: userData?.callsign || "Operator",
        traitTags,
        archetype: userData?.archetype,
        stage: currentStage,
        stageContent,
        lessonModifiers: lesson
          ? {
              tone: lesson.tone,
              fog_level: lesson.fog_level,
              phase: lesson.phase,
            }
          : undefined,
        recentInsight,    // Box 6: Short-term memory
        longTermNote,     // Box 7: Long-term pattern
        world: safeWorld, // Box 8: World State — gated by the Box-Stage Map
        language: userData?.language,  // Language preference
      });
    }

    // Off-map paths (work modes, system literacy, re-engage) still get the
    // campaign continuity — they are conversations, not stages, so the map
    // does not govern them.
    if (safeWorld && (mode || operatorRequest === "REENGAGE_PROTOCOL")) {
      systemPrompt += `\n\n${safeWorld.context}`;
    }

    // Token compression metrics
    const fullLessonContent = lesson ? JSON.stringify(lesson) : "{}";
    const fullLessonTokens = Math.ceil(fullLessonContent.length / 4);
    const actualPromptTokens = Math.ceil(systemPrompt.length / 4);
    const compressionPercent = fullLessonTokens > 0 
      ? Math.round((1 - actualPromptTokens / fullLessonTokens) * 100)
      : 0;

    console.log(`[PROMPT ASSEMBLY] Eight-Box Token Efficiency:`);
    console.log(`  - Full Lesson: ~${fullLessonTokens} tokens`);
    console.log(`  - Eight-Box Prompt: ~${actualPromptTokens} tokens`);
    console.log(`  - Compression: ${compressionPercent}% reduction`);
    console.log(`  - Boxes active: ${[recentInsight, longTermNote].filter(Boolean).length + 5}/8`);
    console.log(`  - Stage: ${currentStage} (${Object.keys(stageContent).length} fields)`);

    const formattedMessages = [{ role: "system", content: systemPrompt }, ...messages];

    let response: Response;

    // Route to appropriate AI provider
    switch (aiProvider) {
      case "openai":
        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${aiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: formattedMessages,
            stream: true,
          }),
        });
        break;

      case "anthropic": {
        // Anthropic requires at least one user message
        // Filter out system messages AND any messages with empty content
        const anthropicMessages = formattedMessages
          .filter((m) => m.role !== "system")
          .filter((m) => m.content && m.content.trim().length > 0);
        
        console.log("Filtered anthropic messages:", JSON.stringify(anthropicMessages, null, 2));
        
        // If no messages yet (orientation start), add a dummy user message
        if (anthropicMessages.length === 0) {
          anthropicMessages.push({
            role: "user",
            content: "Begin orientation protocol."
          });
        }
        
        response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": aiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-5",
            max_tokens: 4096,
            messages: anthropicMessages,
            system: systemPrompt,
            stream: true,
          }),
        });
        break;
      }

      case "google":
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${aiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: formattedMessages
                .filter((m) => m.role !== "system")
                .map((msg) => ({
                  role: msg.role === "assistant" ? "model" : "user",
                  parts: [{ text: msg.content }],
                })),
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
            }),
          }
        );
        break;

      case "ollama":
        response = await fetch(`${ollamaEndpoint}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: ollamaModel,
            messages: formattedMessages,
            stream: true,
          }),
        });
        break;

      default:
        throw new Error(`Unsupported AI provider: ${aiProvider}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${aiProvider} error:`, response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (response.status === 402 || response.status === 401) {
        return new Response(JSON.stringify({ error: "Invalid credentials" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`API error: ${response.status}`);
    }

    // Stream the response
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Echelon chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
