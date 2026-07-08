// NeuroVerse Work Mode Prompt Assembly
// Adapts the 7-Box system for Design/Build/Lead modes

import workModesData from '@/data/work_modes.json';
import type { WorkMode, WorkStage } from './work-engine';

interface WorkPromptContext {
  mode: WorkMode;
  callsign: string;
  traitTags: string[];
  workContext: {
    projectName: string;
    description: string;
    tags: string[];
  };
  currentStage: WorkStage;
  recentDecisions?: string;
  longTermGoals?: string;
}

export function assembleWorkPrompt(context: WorkPromptContext): string {
  const modeData = workModesData[context.mode];
  
  // Box 1: Work-specific Core Rules
  const box1 = modeData.box1_rules;
  
  // Box 2: Identity Tags (unchanged - reuses operator traits)
  const box2 = `Operator: ${context.callsign}\nIdentity Tags: ${context.traitTags.join(', ')}`;
  
  // Box 3: Work Stage Instructions
  const box3 = `STAGE: ${context.currentStage.toUpperCase()}\n${modeData[context.currentStage] || 'Proceed with work protocol'}`;
  
  // Box 4: Work Context (operator's project description)
  const box4 = `WORK CONTEXT:\nProject: ${context.workContext.projectName}\nDescription: ${context.workContext.description}\n${context.workContext.tags.length > 0 ? `Tags: ${context.workContext.tags.join(', ')}` : ''}`;
  
  // Box 5: Work Modifiers (can be expanded later)
  const box5 = `MODE: ${context.mode.toUpperCase()}`;
  
  // Box 6: Recent work decisions (short-term)
  const box6 = context.recentDecisions 
    ? `RECENT DECISIONS:\\n${context.recentDecisions}` 
    : '';
  
  // Box 7: Long-term work philosophy/goals
  const box7 = context.longTermGoals 
    ? `LONG-TERM GOALS:\\n${context.longTermGoals}` 
    : '';
  
  // Assemble all boxes
  const boxes = [box1, box2, box3, box4, box5, box6, box7]
    .filter(box => box && box.trim().length > 0);
  
  return boxes.join('\n\n');
}
