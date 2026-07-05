// Shared BYOK provider routing for one-shot (non-streaming) Echelon AI calls.
//
// The operator brings their own AI key (/activate-echelon); it lives in
// localStorage and every analysis call runs client-side against the provider
// they chose. This module is the single home for that routing so engines like
// phase-assessment and identity-unlock don't each carry their own copy.
// (Streaming chat routes through the echelon-chat edge function instead.)

export interface OperatorAIConfig {
  provider: string;
  apiKey: string;
  ollamaEndpoint: string;
  ollamaModel: string;
}

/**
 * Read the operator's BYOK AI configuration from localStorage.
 */
export function loadOperatorAIConfig(): OperatorAIConfig {
  return {
    provider: localStorage.getItem("neuroverse_ai_provider") || "openai",
    apiKey: localStorage.getItem("neuroverse_api_key") || "",
    ollamaEndpoint: localStorage.getItem("neuroverse_ollama_endpoint") || "http://localhost:11434",
    ollamaModel: localStorage.getItem("neuroverse_ollama_model") || "llama2",
  };
}

/**
 * True when the current config can actually make a call
 * (Ollama needs no key; every hosted provider does).
 */
export function hasOperatorAIKey(config: OperatorAIConfig = loadOperatorAIConfig()): boolean {
  return config.provider === "ollama" || !!config.apiKey;
}

export interface OperatorAICallOptions {
  system: string;
  prompt: string;
  /** Applied where the provider supports it (OpenAI). */
  temperature?: number;
  /** Applied where the provider requires it (Anthropic). Default 1024. */
  maxTokens?: number;
}

/**
 * Make a single system+user call with the operator's own AI provider and
 * return the assistant's text, or null on any failure (no key, bad response).
 */
export async function callOperatorAI(
  options: OperatorAICallOptions,
  config: OperatorAIConfig = loadOperatorAIConfig()
): Promise<string | null> {
  const { system, prompt, temperature, maxTokens = 1024 } = options;
  const { provider, apiKey, ollamaEndpoint, ollamaModel } = config;

  if (!hasOperatorAIKey(config)) {
    console.error("[OPERATOR AI] No API key available");
    return null;
  }

  try {
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
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
          ...(temperature !== undefined ? { temperature } : {}),
        }),
      });

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || null;
    }

    if (provider === "anthropic") {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-dangerous-direct-browser-access": "true",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-5",
          max_tokens: maxTokens,
          messages: [{ role: "user", content: prompt }],
          system,
        }),
      });

      const data = await response.json();
      return data.content?.[0]?.text?.trim() || null;
    }

    if (provider === "google") {
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
              parts: [{ text: system }],
            },
          }),
        }
      );

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    }

    if (provider === "ollama") {
      const response = await fetch(`${ollamaEndpoint}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaModel,
          stream: false,
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
        }),
      });

      const data = await response.json();
      return data.message?.content?.trim() || null;
    }

    console.error(`[OPERATOR AI] Unsupported provider: ${provider}`);
    return null;
  } catch (error) {
    console.error("[OPERATOR AI] Call failed:", error);
    return null;
  }
}

/**
 * Extract a JSON object from an AI text response, tolerating markdown code
 * fences and surrounding prose. Returns null if nothing parseable is found.
 */
export function parseJSONObjectFromAIResponse<T>(text: string | null): T | null {
  if (!text) return null;

  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
