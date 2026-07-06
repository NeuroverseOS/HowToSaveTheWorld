// ============================================================================
// REFLECTION QUESTION GENERATOR
// Generic prompts invite generic answers — and the trait engine, mission
// logs, and dossier are all built from what operators write in reflections.
// So Echelon asks the question: a one-shot call on the operator's own key
// (same operator-ai router as every other analysis) turns the drill prompt
// plus the operator's actual words into ONE incisive, personal question.
//
// Fallback chain — nothing ever blocks:
//   lesson-authored prompt (canonical moments)  →  generated question
//   →  the generic prompt, if there's no key, no response, or any failure.
// ============================================================================

import { callOperatorAI, hasOperatorAIKey } from "./operator-ai";

const GENERATION_TIMEOUT_MS = 6000;

export interface ReflectionQuestionOptions {
  /** What the lesson asked (drill prompt / video context). */
  drillPrompt: string | null | undefined;
  /** What the operator actually wrote. Specificity comes from here. */
  operatorResponse: string | null | undefined;
  /** The generic prompt to fall back to. Always returned on any failure. */
  fallback: string;
  /** Lesson-authored canonical question — wins outright when present. */
  authored?: string | null;
}

export interface VideoBridge {
  intro: string;
  question: string;
}

/**
 * Visual Intel briefing: Echelon connects the footage to the lesson —
 * why we're watching this, what to watch for — and prepares the question
 * that ties what the operator saw back to the concept. One call, both
 * artifacts; on any failure the fallbacks stand and nothing blocks.
 */
export async function generateVideoBridge(opts: {
  lessonTitle: string;
  concept: string;
  authoredIntro?: string | null;
  fallbackIntro: string;
  fallbackQuestion: string;
}): Promise<VideoBridge> {
  const fallback: VideoBridge = {
    intro: opts.authoredIntro?.trim() || opts.fallbackIntro,
    question: opts.fallbackQuestion,
  };
  if (!hasOperatorAIKey()) return fallback;

  try {
    const raw = await Promise.race([
      callOperatorAI({
        system:
          'You are Echelon, the training intelligence. The operator is about to watch real-world field footage inside a training mission. Return ONLY JSON: {"intro": "...", "question": "..."}. intro: 2-3 terse mythic-tech sentences telling the operator WHY this footage was selected for this mission concept and exactly what to watch for — connect the real-world practice shown to the concept being trained. question: ONE reflection question (25 words max) they will answer after watching, connecting what they saw back to the concept. No markdown, no extra keys.',
        prompt: `Mission: ${opts.lessonTitle}\n\nConcept being trained:\n${opts.concept.slice(0, 1500)}\n\nReturn the JSON now.`,
        temperature: 0.7,
        maxTokens: 300,
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), GENERATION_TIMEOUT_MS)),
    ]);

    const match = raw?.match(/\{[\s\S]*\}/);
    if (!match) return fallback;
    const parsed = JSON.parse(match[0]) as Partial<VideoBridge>;
    return {
      intro:
        opts.authoredIntro?.trim() ||
        (typeof parsed.intro === "string" && parsed.intro.trim().length >= 20
          ? parsed.intro.trim()
          : fallback.intro),
      question:
        typeof parsed.question === "string" &&
        parsed.question.trim().length >= 8 &&
        parsed.question.includes("?")
          ? parsed.question.trim()
          : fallback.question,
    };
  } catch (error) {
    console.warn("[VISUAL INTEL] Bridge generation failed, using fallbacks:", error);
    return fallback;
  }
}

export async function generateReflectionQuestion(
  opts: ReflectionQuestionOptions
): Promise<string> {
  const authored = opts.authored?.trim();
  if (authored) return authored;

  const response = opts.operatorResponse?.trim();
  if (!response || !hasOperatorAIKey()) return opts.fallback;

  try {
    const raw = await Promise.race([
      callOperatorAI({
        system:
          "You are Echelon, the training intelligence. Write exactly ONE incisive reflection question (25 words max) about the operator's own answer. Reference something specific they wrote — a word, a claim, a tension. Mythic-tech tone, terse, no preamble, no quotation marks around the output. Output only the question.",
        prompt: `Drill prompt:\n${opts.drillPrompt || "(open reflection)"}\n\nOperator's answer:\n${response.slice(0, 2000)}\n\nOne specific reflection question:`,
        temperature: 0.7,
        maxTokens: 100,
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), GENERATION_TIMEOUT_MS)),
    ]);

    const question = raw?.trim().replace(/^["'“]+|["'”]+$/g, "");
    if (question && question.length >= 8 && question.length <= 240 && question.includes("?")) {
      return question;
    }
    return opts.fallback;
  } catch (error) {
    console.warn("[REFLECTION Q] Generation failed, using fallback:", error);
    return opts.fallback;
  }
}
