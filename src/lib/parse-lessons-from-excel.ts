import type { LessonImport } from "./lesson-import-schema";

/**
 * Parses the Excel markdown table format and extracts lesson data
 * Handles the specific column structure from the NeuroVerse Master spreadsheet
 */
export function parseLessonsFromExcel(markdownContent: string): LessonImport[] {
  const lines = markdownContent.split('\n');
  const lessons: LessonImport[] = [];

  // Find table start (after header separator row)
  let tableStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('|-|-|-|')) {
      tableStartIndex = i + 1;
      break;
    }
  }

  if (tableStartIndex === -1) {
    throw new Error('Could not find table start in Excel data');
  }

  // Parse each lesson row
  for (let i = tableStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || !line.startsWith('|')) continue;

    // Split by pipe and clean up
    const columns = line
      .split('|')
      .map(col => col.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

    if (columns.length < 42) continue; // Skip incomplete rows

    // Extract section_id from section name (e.g., "Perception Trinity" -> 1)
    const sectionName = columns[1];
    const sectionIdMatch = sectionName.match(/\d+/);
    const sectionId = sectionIdMatch ? parseInt(sectionIdMatch[0]) : getSectionIdFromName(sectionName);

    // Parse fog level
    const fogLevelStr = columns[23];
    const fogLevel = fogLevelStr && !isNaN(parseInt(fogLevelStr)) ? parseInt(fogLevelStr) : 0;

    // Parse lesson number
    const lessonNumber = parseInt(columns[2]);
    if (isNaN(lessonNumber)) continue;

    const lesson: LessonImport = {
      phase: columns[0] || '',
      section_id: sectionId,
      section_name: sectionName,
      lesson_number: lessonNumber,
      lesson_title: columns[3] || '',
      tone: cleanField(columns[4]),
      lesson_summary: cleanField(columns[5]),
      read_block: columns[9] || '',
      systems_lesson: cleanField(columns[10]),
      mini_framework: cleanField(columns[11]),
      think_prompts: cleanField(columns[12]),
      think_reflection: cleanField(columns[13]),
      mission_drill: cleanField(columns[14]),
      echelon_opening: cleanField(columns[37]),
      echelon_closing: cleanField(columns[38]),
      fog_level: fogLevel,
      story_beat: cleanField(columns[36]),
      mission_badge_description: cleanField(columns[42]),
      field_guide_prompt: cleanField(columns[15]),
      // Mission Engine Stage Fields
      video_url: cleanField(columns[7]),
      briefing: cleanField(columns[4]), // Using Tone field as briefing
      drill1_prompt: cleanField(columns[12]), // Using THINK Prompts
      head: cleanField(columns[10]), // Using Systems Lesson  
      practical: cleanField(columns[11]), // Using Mini Framework
      drill2_prompt: cleanField(columns[14]), // Using DO/Mission Drill
      debrief: cleanField(columns[38]), // Using Echelon Closing
      final_question: cleanField(columns[13]), // Using Think Reflection
    };

    lessons.push(lesson);
  }

  return lessons;
}

/**
 * Maps section names to IDs when numeric extraction fails
 */
function getSectionIdFromName(sectionName: string): number {
  const sectionMap: Record<string, number> = {
    'Perception Trinity': 1,
    'Orientation': 2,
    'SOCIAL SYSTEMS': 3,
    'MOMENTUM & DIRECTION': 4,
    'Foundations of Machine Ecosystems': 5,
    'Mapping the Real-World Web': 6,
    'Incentives, Fees & System Economics': 7,
    'INTERPERSONAL LEADERSHIP': 8,
    'ORGANIZATIONAL LEADERSHIP': 9,
  };

  for (const [name, id] of Object.entries(sectionMap)) {
    if (sectionName.toLowerCase().includes(name.toLowerCase())) {
      return id;
    }
  }

  return 1; // Default fallback
}

/**
 * Cleans field data - converts empty strings to null, trims whitespace
 */
function cleanField(value: string | undefined): string | null {
  if (!value || value.trim() === '') return null;
  return value.trim();
}
