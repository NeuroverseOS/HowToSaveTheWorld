import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('tool-results://document--parse_document/20251125-204447-152226', 'utf-8');
const lines = content.split('\n');

console.log('🔍 Checking ONLY Lesson # column (column 3)...\n');

const lessonRows: Array<{ lineNum: number; lessonNum: number; title: string }> = [];

for (let i = 7; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.startsWith('|') && !line.startsWith('|Phase') && !line.startsWith('|-')) {
    const columns = line.split('|').map(c => c.trim());
    const lessonNum = parseInt(columns[3]); // Column 3 = Lesson #
    const title = columns[4]; // Column 4 = Lesson Title
    
    if (!isNaN(lessonNum)) {
      lessonRows.push({ lineNum: i + 1, lessonNum, title });
    }
  }
}

console.log(`Total lesson rows found: ${lessonRows.length}\n`);

// Count occurrences
const counts = new Map<number, number>();
lessonRows.forEach(row => {
  counts.set(row.lessonNum, (counts.get(row.lessonNum) || 0) + 1);
});

// Find duplicates
const duplicates = Array.from(counts.entries())
  .filter(([_, count]) => count > 1)
  .sort((a, b) => a[0] - b[0]);

if (duplicates.length > 0) {
  console.log('❌ DUPLICATE LESSON NUMBERS FOUND:\n');
  duplicates.forEach(([num, count]) => {
    console.log(`Lesson ${num} appears ${count} times:`);
    const rows = lessonRows.filter(r => r.lessonNum === num);
    rows.forEach(r => {
      console.log(`   Line ${r.lineNum}: "${r.title.substring(0, 60)}..."`);
    });
    console.log('');
  });
} else {
  console.log('✅ No duplicates in Lesson # column!');
}

// Check 69 and 70 specifically
console.log('\n🎯 Specific check for lessons 69 and 70:');
const lesson69 = lessonRows.filter(r => r.lessonNum === 69);
const lesson70 = lessonRows.filter(r => r.lessonNum === 70);

console.log(`Lesson 69: ${lesson69.length} occurrence(s)`);
lesson69.forEach(r => console.log(`   Line ${r.lineNum}: ${r.title}`));

console.log(`\nLesson 70: ${lesson70.length} occurrence(s)`);
lesson70.forEach(r => console.log(`   Line ${r.lineNum}: ${r.title}`));

// Write clean table if no duplicates
if (duplicates.length === 0) {
  const headerLine = lines[4];
  const separatorLine = lines[5];
  const dataLines = lines.slice(6).filter(l => l.trim().startsWith('|') && !l.startsWith('|Phase') && !l.startsWith('|-'));
  
  const output = [headerLine, separatorLine, ...dataLines].join('\n');
  writeFileSync('public/neuroverse-lessons-clean.txt', output, 'utf-8');
  console.log('\n✅ Clean table written to public/neuroverse-lessons-clean.txt');
}
