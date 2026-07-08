// ============================================================================
// ECHELON DIRECT — browser → AI provider, no relay in between.
//
// This module assembles the Eight-Box prompt IN THE BROWSER using the exact
// same files the edge relay runs (supabase/functions/_shared/prompt-kernel.ts
// and visibility-rules.ts — imported here directly, not copied), then streams
// straight to the operator's chosen provider. Mission conversations never
// transit any server we operate: the operator's key, their words, and
// Echelon's replies travel between their browser and their provider only.
//
// The relay remains as an automatic fallback for networks where a direct
// call cannot leave the page (strict CORS proxies, exotic setups) — same
// kernel, same wall, different transport.
// ============================================================================

import {
  getVisibilityRules,
  filterContentByVisibility,
} from "../../supabase/functions/_shared/visibility-rules.ts";
import {
  getStageContent,
  assembleEchelonPrompt,
  buildSystemLiteracyPrompt,
  buildReengagePrompt,
  withAnthropicCaching,
} from "../../supabase/functions/_shared/prompt-kernel.ts";
import { supabase } from "@/integrations/supabase/client";
import { loadOperatorAIConfig, type OperatorAIConfig } from "./operator-ai";

/** The chat request body LessonRunner already builds — shape unchanged. */
export interface EchelonChatBody {
  messages: { role: string; content: string }[];
  lesson?: any;
  userData?: {
    userId?: string;
    callsign?: string;
    archetype?: { primary?: string | null; shadow?: string | null; rising?: string | null };
    language?: { code: string; name: string };
  };
  currentStage: string;
  orientationPhase?: string;
  operatorRequest?: string;
  mode?: string;
  system_literacy_context?: string;
  paused_mission?: { lessonId: number; stage: string } | null;
  world?: { context: string } | null;
}

/**
 * Assemble the system prompt exactly as the relay does — same kernel, same
 * visibility wall — but with the personal-data reads (Boxes 2/6/7) done by
 * the operator's own session against RLS-guarded tables. Anonymous operators
 * skip those reads, exactly as they do on the relay.
 */
export async function buildDirectEchelonPrompt(body: EchelonChatBody): Promise<string> {
  const {
    lesson, userData, currentStage, orientationPhase,
    operatorRequest, mode, system_literacy_context, paused_mission, world,
  } = body;

  const visibilityRules = getVisibilityRules(currentStage);

  let traitTags: string[] = [];
  let recentInsight: string | undefined;
  let longTermNote: string | undefined;

  // Personal data: only for signed-in operators, only when the Box-Stage Map
  // allows the box, and only ever their own rows (RLS + explicit id).
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const uid = session.user.id;

      if (visibilityRules.showIdentityTags) {
        const { data: traits } = await supabase
          .from("operator_traits")
          .select("trait_tag")
          .eq("user_id", uid)
          .eq("unlocked", true);
        if (traits) traitTags = traits.map((t) => t.trait_tag);
      }

      if (visibilityRules.showShortTermMemory) {
        const { data: recentNote } = await supabase
          .from("operator_identity_notes")
          .select("note_content")
          .eq("user_id", uid)
          .eq("note_type", "recent_insight")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        recentInsight = recentNote?.note_content ?? undefined;
      }

      if (visibilityRules.showLongTermMemory) {
        const { data: longTermNoteData } = await supabase
          .from("operator_identity_notes")
          .select("note_content")
          .eq("user_id", uid)
          .eq("note_type", "long_term_pattern")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        longTermNote = longTermNoteData?.note_content ?? undefined;
      }
    }
  } catch (error) {
    console.log("[ECHELON DIRECT] Personal-data reads skipped:", error);
  }

  // Content filtering: identical two-layer wall as the relay
  const rawStageContent = lesson ? getStageContent(lesson, currentStage) : {};
  const stageContent = filterContentByVisibility(rawStageContent, currentStage);
  if (currentStage === "orientation" && orientationPhase) {
    stageContent.orientation_context = orientationPhase;
  }

  // Box 8: World State — validated once, size-capped (mirror of the relay)
  const safeWorld =
    world && typeof world.context === "string" && world.context.length > 0 && world.context.length <= 1200
      ? { context: world.context }
      : null;

  let systemPrompt: string;

  if (mode === "system_literacy" && system_literacy_context) {
    systemPrompt = buildSystemLiteracyPrompt(
      userData?.callsign || "Operator",
      system_literacy_context,
      paused_mission
    );
  } else if (operatorRequest === "REENGAGE_PROTOCOL") {
    systemPrompt = buildReengagePrompt(currentStage, stageContent, userData?.callsign || "Operator");
  } else {
    systemPrompt = assembleEchelonPrompt({
      callsign: userData?.callsign || "Operator",
      traitTags,
      archetype: userData?.archetype,
      stage: currentStage,
      stageContent,
      lessonModifiers: lesson
        ? { tone: lesson.tone, fog_level: lesson.fog_level, phase: lesson.phase }
        : undefined,
      recentInsight,
      longTermNote,
      world: safeWorld,
      language: userData?.language,
    });
  }

  // Off-map paths (literacy / re-engage) still get campaign continuity —
  // they are conversations, not stages, so the map does not govern them.
  if (safeWorld && (mode || operatorRequest === "REENGAGE_PROTOCOL")) {
    systemPrompt += `\n\n${safeWorld.context}`;
  }

  return systemPrompt;
}

/**
 * Stream a chat completion directly from the operator's provider.
 * Returns the provider's raw streaming Response — the same wire formats the
 * relay passes through, so existing stream parsers work unchanged.
 * Throws on network-level failure (fetch TypeError); HTTP errors return
 * normally for the caller's status handling.
 */
export async function streamEchelonDirect(
  body: EchelonChatBody,
  config: OperatorAIConfig = loadOperatorAIConfig()
): Promise<Response> {
  const systemPrompt = await buildDirectEchelonPrompt(body);
  const { provider, apiKey, ollamaEndpoint, ollamaModel } = config;
  const formattedMessages = [{ role: "system", content: systemPrompt }, ...body.messages];

  console.log(`[ECHELON DIRECT] ${provider} — browser-to-provider, no relay`);

  switch (provider) {
    case "openai":
      return fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: formattedMessages,
          stream: true,
        }),
      });

    case "anthropic": {
      // Anthropic requires at least one non-empty user message
      const anthropicMessages = formattedMessages
        .filter((m) => m.role !== "system")
        .filter((m) => m.content && m.content.trim().length > 0);
      if (anthropicMessages.length === 0) {
        anthropicMessages.push({ role: "user", content: "Begin orientation protocol." });
      }

      // Prompt caching: the Eight-Box system prompt and the conversation
      // prefix are re-read from cache on turns 2+ within a stage, cutting the
      // operator's own input cost roughly in half on multi-turn missions.
      const cached = withAnthropicCaching(systemPrompt, anthropicMessages);

      return fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          // Anthropic's explicit opt-in for BYOK browser apps — the key is
          // the operator's own, stored only on their device.
          "anthropic-dangerous-direct-browser-access": "true",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 4096,
          messages: cached.messages,
          system: cached.system,
          stream: true,
        }),
      });
    }

    case "google":
      return fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
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
            systemInstruction: { parts: [{ text: systemPrompt }] },
          }),
        }
      );

    case "ollama":
      return fetch(`${ollamaEndpoint}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaModel,
          messages: formattedMessages,
          stream: true,
        }),
      });

    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}
