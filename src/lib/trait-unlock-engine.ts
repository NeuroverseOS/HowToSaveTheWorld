import { supabase } from "@/integrations/supabase/client";
import { TRAIT_MAP } from "./identity-system";

// Trait unlocking logic based on Field Guide insights
export async function analyzeAndUnlockTraits(
  userId: string,
  lessonId: number,
  userReflection: string
): Promise<string[]> {
  try {
    // Get AI provider config
    const provider = localStorage.getItem("neuroverse_ai_provider") || "openai";
    const apiKey = localStorage.getItem("neuroverse_api_key") || "";
    
    if (!apiKey) {
      console.error("No API key available for trait analysis");
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

    // Call AI for analysis
    let detectedTraits: string[] = [];

    if (provider === "openai") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a trait analysis engine. Return only valid JSON arrays of trait tags." },
            { role: "user", content: analysisPrompt }
          ],
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "[]";
      
      try {
        detectedTraits = JSON.parse(content.trim());
      } catch {
        console.error("Failed to parse trait analysis response");
        return [];
      }
    } else if (provider === "anthropic") {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-dangerous-direct-browser-access": "true",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1024,
          messages: [
            { role: "user", content: analysisPrompt }
          ],
          system: "You are a trait analysis engine. Return only valid JSON arrays of trait tags.",
        }),
      });

      const data = await response.json();
      const content = data.content?.[0]?.text || "[]";
      
      try {
        detectedTraits = JSON.parse(content.trim());
      } catch {
        console.error("Failed to parse trait analysis response");
        return [];
      }
    } else if (provider === "google") {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: analysisPrompt }],
              },
            ],
            systemInstruction: {
              parts: [{ text: "You are a trait analysis engine. Return only valid JSON arrays of trait tags." }],
            },
          }),
        }
      );

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      
      try {
        detectedTraits = JSON.parse(content.trim());
      } catch {
        console.error("Failed to parse trait analysis response");
        return [];
      }
    }

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
    const provider = localStorage.getItem("neuroverse_ai_provider") || "openai";
    const apiKey = localStorage.getItem("neuroverse_api_key") || "";
    
    if (!apiKey) {
      console.error("No API key available for Field Guide generation");
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

    let fieldGuideEntry = "";

    if (provider === "openai") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are the Field Guide generator for the NeuroVerse OS. Write precise, mythic-tech insights." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      fieldGuideEntry = data.choices?.[0]?.message?.content?.trim() || "";
    } else if (provider === "anthropic") {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-dangerous-direct-browser-access": "true",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 512,
          messages: [
            { role: "user", content: prompt }
          ],
          system: "You are the Field Guide generator for the NeuroVerse OS. Write precise, mythic-tech insights.",
        }),
      });

      const data = await response.json();
      fieldGuideEntry = data.content?.[0]?.text?.trim() || "";
    } else if (provider === "google") {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
            systemInstruction: {
              parts: [{ text: "You are the Field Guide generator for the NeuroVerse OS. Write precise, mythic-tech insights." }],
            },
          }),
        }
      );

      const data = await response.json();
      fieldGuideEntry = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    }

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
