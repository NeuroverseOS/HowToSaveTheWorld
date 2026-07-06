import { supabase } from "@/integrations/supabase/client";
import { TRAIT_MAP } from "./identity-system";
import { callOperatorAI, hasOperatorAIKey } from "./operator-ai";

// All analysis runs on the operator's own BYOK provider via the shared
// operator-ai router — the platform provides no AI service of its own.

/** Model output may arrive fenced or chatty; recover the first JSON array. */
function parseTraitArray(raw: string | null): string[] {
  if (!raw) return [];
  const match = raw.match(/\[[\s\S]*?\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === "string") : [];
  } catch {
    console.error("Failed to parse trait analysis response");
    return [];
  }
}

// Trait unlocking logic based on Field Guide insights
export async function analyzeAndUnlockTraits(
  userId: string,
  lessonId: number,
  userReflection: string
): Promise<string[]> {
  try {
    if (!hasOperatorAIKey()) {
      console.error("No AI provider available for trait analysis");
      return [];
    }

    // Get current unlocked traits
    const { data: currentTraits } = await supabase
      .from("operator_traits")
      .select("trait_tag")
      .eq("user_id", userId)
      .eq("unlocked", true);

    const unlockedTags = currentTraits?.map(t => t.trait_tag) || [];
    const availableTraits = Object.keys(TRAIT_MAP).filter(t => !unlockedTags.includes(t));

    if (availableTraits.length === 0) {
      return [];
    }

    // Build analysis prompt
    const analysisPrompt = `Analyze this reflection and determine which cognitive traits are demonstrated.

Reflection: "${userReflection}"

Available traits to unlock:
${availableTraits.map(tag => `- ${tag}: ${TRAIT_MAP[tag].definition}`).join('\n')}

Return ONLY a JSON array of trait tags that are clearly demonstrated (max 2). Example: ["systems_thinking", "analytical_rigor"]

If no traits are clearly demonstrated, return an empty array: []`;

    const raw = await callOperatorAI({
      system: "You are a trait analysis engine. Return only valid JSON arrays of trait tags.",
      prompt: analysisPrompt,
      temperature: 0.3,
      maxTokens: 1024,
    });
    const detectedTraits = parseTraitArray(raw);

    // Validate and unlock traits
    const validTraits = detectedTraits.filter(tag =>
      availableTraits.includes(tag) && TRAIT_MAP[tag]
    );

    if (validTraits.length === 0) {
      return [];
    }

    // Unlock traits in database
    for (const traitTag of validTraits) {
      // Insert or update trait
      await supabase
        .from("operator_traits")
        .upsert({
          user_id: userId,
          trait_tag: traitTag,
          unlocked: true,
          unlocked_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,trait_tag"
        });

      // Log the unlock event
      await supabase
        .from("operator_evolution_log")
        .insert({
          user_id: userId,
          lesson_id: lessonId,
          trait_tag: traitTag,
          insight_type: "trait_unlock",
          insight_text: `Trait unlocked: ${TRAIT_MAP[traitTag].name}`,
        });
    }

    return validTraits;
  } catch (error) {
    console.error("Trait unlock analysis failed:", error);
    return [];
  }
}

// Generate Field Guide entry after lesson completion
export async function generateFieldGuideEntry(
  userId: string,
  lessonId: number,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string | null> {
  try {
    if (!hasOperatorAIKey()) {
      console.error("No AI provider available for Field Guide generation");
      return null;
    }

    // Extract user reflections from conversation
    const userMessages = conversationHistory
      .filter(m => m.role === "user")
      .map(m => m.content)
      .join("\n\n");

    const prompt = `Based on this conversation, generate a Field Guide entry that captures the operator's key insights and growth.

Conversation reflections:
${userMessages}

Generate a concise Field Guide entry (2-3 sentences) that:
- Captures the core insight or pattern recognized
- Highlights cognitive growth or capability unlocked
- Uses mythic-tech voice (cinematic, precise, no fluff)

Return only the Field Guide entry text, nothing else.`;

    const fieldGuideEntry = (await callOperatorAI({
      system: "You are the Field Guide generator for the NeuroVerse OS. Write precise, mythic-tech insights.",
      prompt,
      temperature: 0.7,
      maxTokens: 512,
    }))?.trim() ?? "";

    if (!fieldGuideEntry) {
      return null;
    }

    // Save Field Guide entry
    await supabase
      .from("operator_identity_notes")
      .insert({
        user_id: userId,
        note_type: "field_guide_entry",
        note_content: fieldGuideEntry,
      });

    // Log in evolution log
    await supabase
      .from("operator_evolution_log")
      .insert({
        user_id: userId,
        lesson_id: lessonId,
        insight_type: "field_guide_entry",
        insight_text: fieldGuideEntry,
      });

    return fieldGuideEntry;
  } catch (error) {
    console.error("Field Guide generation failed:", error);
    return null;
  }
}
