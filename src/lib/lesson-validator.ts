// NeuroVerse OS — Lesson Integrity Validator
// Validates the 96-lesson curriculum for integrity issues

import type { Lesson } from "./lesson-queries";

export interface LessonValidationResult {
  isValid: boolean;
  totalLessons: number;
  missingNumbers: number[];      // e.g., [23, 45]
  duplicateNumbers: number[];     // e.g., [69, 70]
  schemaErrors: Array<{
    lessonNumber: number;
    field: string;
    issue: string;
  }>;
}

const REQUIRED_FIELDS = [
  'lesson_number',
  'lesson_title',
  'phase',
  'section_id',
  'section_name',
  'read_block',
] as const;

const EXPECTED_LESSON_COUNT = 96;

export function validateLessons(lessons: Lesson[]): LessonValidationResult {
  const result: LessonValidationResult = {
    isValid: true,
    totalLessons: lessons.length,
    missingNumbers: [],
    duplicateNumbers: [],
    schemaErrors: [],
  };

  // Track lesson numbers
  const numberCounts = new Map<number, number>();
  const seenNumbers = new Set<number>();

  // Check each lesson
  for (const lesson of lessons) {
    const num = lesson.lesson_number;
    
    // Count occurrences
    numberCounts.set(num, (numberCounts.get(num) || 0) + 1);
    seenNumbers.add(num);

    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      const value = lesson[field];
      if (value === null || value === undefined) {
        result.schemaErrors.push({
          lessonNumber: num,
          field,
          issue: 'Field is null or undefined',
        });
      } else if (typeof value === 'string' && value.trim() === '') {
        result.schemaErrors.push({
          lessonNumber: num,
          field,
          issue: 'Field is empty',
        });
      }
    }
  }

  // Find missing lesson numbers (1-96)
  for (let i = 1; i <= EXPECTED_LESSON_COUNT; i++) {
    if (!seenNumbers.has(i)) {
      result.missingNumbers.push(i);
    }
  }

  // Find duplicate lesson numbers
  for (const [num, count] of numberCounts.entries()) {
    if (count > 1) {
      result.duplicateNumbers.push(num);
    }
  }

  // Determine overall validity
  result.isValid = 
    result.missingNumbers.length === 0 &&
    result.duplicateNumbers.length === 0 &&
    result.schemaErrors.length === 0 &&
    result.totalLessons === EXPECTED_LESSON_COUNT;

  return result;
}

export function formatValidationReport(result: LessonValidationResult): string {
  const lines: string[] = [];
  
  lines.push(`Total Lessons: ${result.totalLessons} / ${EXPECTED_LESSON_COUNT}`);
  lines.push(`Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}\n`);
  
  if (result.missingNumbers.length > 0) {
    lines.push(`Missing Lessons (${result.missingNumbers.length}):`);
    lines.push(result.missingNumbers.join(', '));
    lines.push('');
  }
  
  if (result.duplicateNumbers.length > 0) {
    lines.push(`Duplicate Lessons (${result.duplicateNumbers.length}):`);
    lines.push(result.duplicateNumbers.join(', '));
    lines.push('');
  }
  
  if (result.schemaErrors.length > 0) {
    lines.push(`Schema Errors (${result.schemaErrors.length}):`);
    const errorsByLesson = new Map<number, string[]>();
    
    for (const error of result.schemaErrors) {
      const errors = errorsByLesson.get(error.lessonNumber) || [];
      errors.push(`${error.field}: ${error.issue}`);
      errorsByLesson.set(error.lessonNumber, errors);
    }
    
    for (const [lessonNum, errors] of errorsByLesson.entries()) {
      lines.push(`  Lesson ${lessonNum}:`);
      errors.forEach(e => lines.push(`    - ${e}`));
    }
  }
  
  return lines.join('\n');
}
