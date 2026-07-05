// RETIRED — NO LONGER CALLED BY THE APP.
//
// This function depends on the defunct Lovable AI gateway
// (ai.gateway.lovable.dev) and cannot work anymore. The trait unlock
// analysis it performed now runs CLIENT-SIDE on the operator's own BYOK
// provider: see src/lib/identity-unlock-engine.ts (determineUnlocksFromReflection),
// which routes through the shared src/lib/operator-ai.ts helper.
//
// The file is kept only as a historical reference; do not deploy or re-wire
// callers to it.

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, userId, lessonId } = await req.json();

    console.log(`[TRAIT UNLOCK ANALYZER] Analyzing for user ${userId}, lesson ${lessonId}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Use Lovable AI for trait unlock analysis
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are the NeuroVerse trait unlock analyzer. Analyze reflections and return ONLY valid JSON with trait and subskill determinations. Be conservative - only unlock if clearly demonstrated."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TRAIT UNLOCK ANALYZER] AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded", new_traits: [], subskills: [] }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON response
    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch (parseError) {
      console.error('[TRAIT UNLOCK ANALYZER] JSON parse error:', parseError);
      // Return safe default
      analysisResult = {
        new_traits: [],
        subskills: [],
        reasoning: "Failed to parse analysis result"
      };
    }

    console.log('[TRAIT UNLOCK ANALYZER] Result:', analysisResult);

    // Validate structure
    if (!analysisResult.new_traits) analysisResult.new_traits = [];
    if (!analysisResult.subskills) analysisResult.subskills = [];
    if (!analysisResult.reasoning) analysisResult.reasoning = "Analysis complete";

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[TRAIT UNLOCK ANALYZER] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        new_traits: [],
        subskills: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
