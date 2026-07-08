// ECHELON Visibility Validator
// Pre-send validation to catch visibility violations before they reach the AI

import { MissionStage } from './state-engine';
import { getVisibilityRules } from './echelon-visibility-rules';

export interface ValidationResult {
  valid: boolean;
  violations: string[];
  warnings: string[];
}

/**
 * Validate assembled prompt against visibility rules for current stage
 * 
 * CRITICAL: This validation runs BEFORE the prompt is sent to the AI
 * In strict mode (development), violations throw errors
 * In production, violations are logged as warnings
 * 
 * @param assembledPrompt - The complete system prompt
 * @param stage - Current mission stage
 * @param stageContent - The lesson content being used
 * @returns Validation result with violations and warnings
 */
export function validatePromptVisibility(
  assembledPrompt: string,
  stage: MissionStage,
  stageContent: Record<string, any>
): ValidationResult {
  const rules = getVisibilityRules(stage);
  const violations: string[] = [];
  const warnings: string[] = [];
  
  const promptLower = assembledPrompt.toLowerCase();

  // =========================================================================
  // CRITICAL VIOLATIONS - These MUST NOT happen
  // =========================================================================

  // 1. Check for forbidden content fields in prompt
  rules.forbiddenContentFields.forEach(field => {
    if (field === '*') {
      // Wildcard rule: Check that ONLY allowed fields are present
      Object.keys(stageContent).forEach(contentKey => {
        if (
          !rules.allowedContentFields.includes(contentKey) &&
          promptLower.includes(contentKey.toLowerCase())
        ) {
          violations.push(
            `🚨 FORBIDDEN: "${contentKey}" detected in ${stage} stage (wildcard rule violated)`
          );
        }
      });
    } else {
      // Explicit forbidden field check
      if (promptLower.includes(field.toLowerCase())) {
        violations.push(`🚨 FORBIDDEN: "${field}" detected in ${stage} stage`);
      }
    }
  });

  // 2. Check identity tag visibility
  if (!rules.showIdentityTags) {
    if (
      promptLower.includes('identity tags:') ||
      promptLower.includes('trait tags:') ||
      promptLower.includes('identity:')
    ) {
      violations.push(
        `🚨 FORBIDDEN: Identity tags shown in ${stage} stage (must be hidden)`
      );
    }
  }

  // 3. Check short-term memory visibility
  if (!rules.showShortTermMemory) {
    if (
      promptLower.includes('recent insight') ||
      promptLower.includes('short-term memory') ||
      promptLower.includes('box 6')
    ) {
      violations.push(
        `🚨 FORBIDDEN: Short-term memory shown in ${stage} stage (must be hidden)`
      );
    }
  }

  // 4. Check long-term memory visibility
  if (!rules.showLongTermMemory) {
    if (
      promptLower.includes('long-term pattern') ||
      promptLower.includes('long-term memory') ||
      promptLower.includes('box 7')
    ) {
      violations.push(
        `🚨 FORBIDDEN: Long-term memory shown in ${stage} stage (must be hidden)`
      );
    }
  }

  // 5. Check Field Guide narrative leakage
  if (!rules.allowFieldGuideNarratives) {
    if (
      promptLower.includes('field guide entry') ||
      promptLower.includes('field guide narrative') ||
      promptLower.includes('unlock narrative')
    ) {
      violations.push(
        `🚨 FORBIDDEN: Field Guide narrative leaked in ${stage} stage (only allowed at complete)`
      );
    }
  }

  // =========================================================================
  // WARNINGS - Suspicious patterns that might indicate issues
  // =========================================================================

  // Warn if prompt is suspiciously long for certain stages
  const tokenEstimate = Math.ceil(assembledPrompt.length / 4);
  const tokenBudgets: Record<MissionStage, number> = {
    // Onboarding stages
    [MissionStage.ONBOARDING_SCREEN_1]: 200,
    [MissionStage.LANGUAGE_SELECTION]: 300,
    [MissionStage.ASSESSMENT]: 400,
    [MissionStage.ORIENTATION_FOXHOLE]: 500,
    
    // Mission stages
    [MissionStage.BRIEFING]: 800,
    [MissionStage.DRILL1]: 600,
    [MissionStage.VIDEO]: 100,
    [MissionStage.HP]: 1000,
    [MissionStage.DRILL2]: 600,
    [MissionStage.DEBRIEF]: 1200,
    [MissionStage.FINAL]: 1500,
    [MissionStage.REFLECTION]: 800,
    [MissionStage.COMPLETE]: 500,
  };

  const budget = tokenBudgets[stage];
  if (tokenEstimate > budget) {
    warnings.push(
      `⚠️ Token budget exceeded for ${stage}: ${tokenEstimate} tokens (budget: ${budget})`
    );
  }

  // Warn if video stage has ANY substantial content (should be minimal)
  if (stage === MissionStage.VIDEO && tokenEstimate > 250) {
    warnings.push(
      `⚠️ Video stage prompt suspiciously large: ${tokenEstimate} tokens (should be minimal)`
    );
  }

  // Warn about potential data leakage patterns
  const leakagePatterns = [
    'drill1_response',
    'drill2_response',
    'previous_answer',
    'earlier you said',
  ];

  leakagePatterns.forEach(pattern => {
    if (promptLower.includes(pattern)) {
      warnings.push(
        `⚠️ Potential cross-stage leakage: "${pattern}" detected in ${stage} stage`
      );
    }
  });

  return {
    valid: violations.length === 0,
    violations,
    warnings,
  };
}

/**
 * Enforce visibility validation in development mode
 * Throws errors if violations detected and strict mode is enabled
 * 
 * @param result - Validation result
 */
export function enforceVisibilityInDevelopment(result: ValidationResult): void {
  const strictMode = import.meta.env.VITE_ECHELON_STRICT_MODE === 'true';
  
  // Log all warnings
  if (result.warnings.length > 0) {
    console.warn('⚠️ VISIBILITY WARNINGS:', result.warnings);
  }

  // Handle violations
  if (!result.valid) {
    console.error('🚨 VISIBILITY VIOLATIONS DETECTED:', result.violations);
    
    if (strictMode) {
      throw new Error(
        `Visibility violation detected:\n${result.violations.join('\n')}`
      );
    }
  }
}

/**
 * Log visibility validation results for debugging
 * 
 * @param stage - Current mission stage
 * @param result - Validation result
 */
export function logVisibilityValidation(
  stage: MissionStage,
  result: ValidationResult
): void {
  if (result.valid && result.warnings.length === 0) {
    console.log(`✅ [VISIBILITY] ${stage} stage validation PASSED`);
    return;
  }

  console.group(`🔍 [VISIBILITY] ${stage} Stage Validation`);
  
  if (result.violations.length > 0) {
    console.error('❌ VIOLATIONS:', result.violations);
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️ WARNINGS:', result.warnings);
  }
  
  console.groupEnd();
}

/**
 * Create a validation report for admin/debug view
 * 
 * @param stage - Current mission stage
 * @param result - Validation result
 * @returns Human-readable report string
 */
export function generateValidationReport(
  stage: MissionStage,
  result: ValidationResult
): string {
  const status = result.valid ? '✅ PASS' : '❌ FAIL';
  
  let report = `VISIBILITY VALIDATION REPORT
============================
Stage: ${stage}
Status: ${status}
`;

  if (result.violations.length > 0) {
    report += `\nVIOLATIONS (${result.violations.length}):\n`;
    result.violations.forEach((v, i) => {
      report += `  ${i + 1}. ${v}\n`;
    });
  }

  if (result.warnings.length > 0) {
    report += `\nWARNINGS (${result.warnings.length}):\n`;
    result.warnings.forEach((w, i) => {
      report += `  ${i + 1}. ${w}\n`;
    });
  }

  if (result.valid && result.warnings.length === 0) {
    report += '\n✅ No issues detected\n';
  }

  return report;
}
