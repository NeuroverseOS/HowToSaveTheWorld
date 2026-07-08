// Box-Stage Validation Test Utility
// Run in browser console: window.testBoxValidation()

import { assembleEchelonPrompt } from './prompt-assembly';
import type { PromptContext } from './prompt-assembly';

/**
 * Test Box Validation by intentionally creating violations
 * This helps verify the warning system works correctly
 */
export function testBoxValidation() {
  console.group('🧪 BOX VALIDATION TEST SUITE');
  
  // Test 1: Briefing stage should NOT have Box 6 (short-term memory)
  console.log('\n--- Test 1: Briefing Stage with Box 6 Content (VIOLATION EXPECTED) ---');
  const briefingContext: PromptContext = {
    callsign: 'TestOperator',
    traitTags: ['STRATEGIST', 'BUILDER'],
    stage: 'briefing',
    stageContent: {
      echelon_opening: 'Briefing message',
      briefing: 'Mission briefing content'
    },
    recentInsight: 'This should trigger a violation - Box 6 not active in briefing'
  };
  
  const briefingPrompt = assembleEchelonPrompt(briefingContext);
  console.log('Briefing prompt assembled (check warnings above)');
  
  // Test 2: Drill1 stage should NOT have Box 7 (long-term memory)
  console.log('\n--- Test 2: Drill1 Stage with Box 7 Content (VIOLATION EXPECTED) ---');
  const drill1Context: PromptContext = {
    callsign: 'TestOperator',
    traitTags: ['STRATEGIST'],
    stage: 'drill1',
    stageContent: {
      drill1_prompt: 'First drill question'
    },
    longTermNote: 'This should trigger a violation - Box 7 not active in drill1'
  };
  
  const drill1Prompt = assembleEchelonPrompt(drill1Context);
  console.log('Drill1 prompt assembled (check warnings above)');
  
  // Test 3: Debrief stage WITH Box 6 (should be valid)
  console.log('\n--- Test 3: Debrief Stage with Box 6 Content (VALID - NO VIOLATION) ---');
  const debriefContext: PromptContext = {
    callsign: 'TestOperator',
    traitTags: ['STRATEGIST'],
    stage: 'debrief',
    stageContent: {
      debrief: 'Mission debrief'
    },
    recentInsight: 'This is allowed - Box 6 is active in debrief'
  };
  
  const debriefPrompt = assembleEchelonPrompt(debriefContext);
  console.log('Debrief prompt assembled (should show ✅ validation passed)');
  
  console.log('\n✅ Test suite complete. Check warnings above.');
  console.groupEnd();
  
  return {
    briefingPrompt,
    drill1Prompt,
    debriefPrompt
  };
}

// Expose to window in development mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).testBoxValidation = testBoxValidation;
  console.log('🧪 Box validation test available: window.testBoxValidation()');
}
