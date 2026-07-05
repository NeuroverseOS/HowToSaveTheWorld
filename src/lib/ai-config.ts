// src/lib/ai-config.ts

// Save selected AI provider
export function saveAIProvider(provider: string): void {
  localStorage.setItem("neuroverse_ai_provider", provider);
}

// Save API key
export function saveAPIKey(apiKey: string): void {
  localStorage.setItem("neuroverse_api_key", apiKey);
}

// Load provider
export function loadAIProvider(): string | null {
  return localStorage.getItem("neuroverse_ai_provider");
}

// Load API key
export function loadAPIKey(): string | null {
  return localStorage.getItem("neuroverse_api_key");
}

// Clear both
export function clearAIConfig(): void {
  localStorage.removeItem("neuroverse_ai_provider");
  localStorage.removeItem("neuroverse_api_key");
}
