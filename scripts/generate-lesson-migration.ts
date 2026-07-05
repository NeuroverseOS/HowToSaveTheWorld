import fs from 'fs';
import path from 'path';

// Read the parsed Excel document
const parsedDocPath = path.join(process.cwd(), 'tool-results://document--parse_document/20251123-051439-779097');
let content: string;

try {
  content = fs.readFileSync(parsedDocPath, 'utf-8');
} catch {
  console.error('Could not read parsed document. Trying alternative path...');
  // Try reading from user-uploads as backup
  process.exit(1);
}

// Split into lines and find the table
const lines = content.split('\n');
const lessons: any[] = [];

// Find table start (after header row with |-|-|...)
let tableStartIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('|-|-|-|')) {
    tableStartIndex = i + 1;
    break;
  }
}

if (tableStartIndex === -1) {
  console.error('Could not find table in parsed document');
  process.exit(1);
}

// Parse each lesson row
for (let i = tableStartIndex; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line || !line.startsWith('|')) continue;
  
  // Split by pipe and clean
  const columns = line.split('|').map(col => col.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
  
  if (columns.length < 42) continue; // Skip incomplete rows
  
  const lesson = {
    phase: columns[0],
    section: columns[1],
    lessonNumber: parseInt(columns[2]),
    lessonTitle: columns[3],
    tone: columns[4],
    lessonSummary: columns[5],
    readBlock: columns[8],
    systemsLesson: columns[9],
    miniFramework: columns[10],
    thinkPrompts: columns[11],
    thinkReflection: columns[12],
    missionDrill: columns[13],
    fieldGuidePrompt: columns[14],
    fogLevel: columns[23] ? parseInt(columns[23]) : 0,
    storyBeat: columns[35],
    echelonOpening: columns[36],
    echelonClosing: columns[37],
    missionBadgeDescription: columns[41]
  };
  
  lessons.push(lesson);
}

console.log(`Parsed ${lessons.length} lessons`);

// Helper function to escape SQL strings
function escapeSql(str: string | undefined): string {
  if (!str) return 'NULL';
  // Replace single quotes with double single quotes for SQL
  const escaped = str.replace(/'/g, "''");
  return `'${escaped}'`;
}

// Extract section_id from section name
function extractSectionId(section: string): number {
  const match = section.match(/\d+/);
  return match ? parseInt(match[0]) : 1;
}

// Generate SQL
let sql = `-- Auto-generated migration to import all 90 lessons from NeuroVerse spreadsheet
-- Generated at: ${new Date().toISOString()}

-- Delete existing test lesson to avoid conflicts
DELETE FROM lessons WHERE lesson_number = 1;

-- Insert all 90 lessons
`;

lessons.forEach((lesson, idx) => {
  const sectionId = extractSectionId(lesson.section);
  
  sql += `INSERT INTO lessons (
  phase, section_id, section_name, lesson_number, lesson_title,
  tone, lesson_summary, read_block, systems_lesson, mini_framework,
  think_prompts, think_reflection, mission_drill,
  echelon_opening, echelon_closing, fog_level, story_beat,
  mission_badge_description, field_guide_prompt
) VALUES (
  ${escapeSql(lesson.phase)},
  ${sectionId},
  ${escapeSql(lesson.section)},
  ${lesson.lessonNumber},
  ${escapeSql(lesson.lessonTitle)},
  ${escapeSql(lesson.tone)},
  ${escapeSql(lesson.lessonSummary)},
  ${escapeSql(lesson.readBlock)},
  ${escapeSql(lesson.systemsLesson)},
  ${escapeSql(lesson.miniFramework)},
  ${escapeSql(lesson.thinkPrompts)},
  ${escapeSql(lesson.thinkReflection)},
  ${escapeSql(lesson.missionDrill)},
  ${escapeSql(lesson.echelonOpening)},
  ${escapeSql(lesson.echelonClosing)},
  ${lesson.fogLevel || 0},
  ${escapeSql(lesson.storyBeat)},
  ${escapeSql(lesson.missionBadgeDescription)},
  ${escapeSql(lesson.fieldGuidePrompt)}
);

`;
});

// Write SQL to file
const outputPath = path.join(process.cwd(), 'migration_import_90_lessons.sql');
fs.writeFileSync(outputPath, sql);

console.log(`✅ Generated SQL migration with ${lessons.length} lessons`);
console.log(`📄 Written to: ${outputPath}`);
console.log(`\nFirst 3 lessons:`);
lessons.slice(0, 3).forEach(l => {
  console.log(`  - Lesson ${l.lessonNumber}: ${l.lessonTitle}`);
});
console.log(`\nLast 3 lessons:`);
lessons.slice(-3).forEach(l => {
  console.log(`  - Lesson ${l.lessonNumber}: ${l.lessonTitle}`);
});
