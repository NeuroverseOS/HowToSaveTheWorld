import { readFileSync, writeFileSync } from 'fs';

// Read the full parsed document
const content = readFileSync('tool-results://document--parse_document/20251125-195239-281213', 'utf-8');
const lines = content.split('\n');

// Find header and extract all lesson rows
let headerLine = '';
let separatorLine = '';
const lessonRows: string[] = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // Find the header
  if (line.startsWith('|Phase|Section|Lesson #|')) {
    headerLine = line;
    separatorLine = lines[i + 1];
    
    // Extract all data rows starting after separator
    for (let j = i + 2; j < lines.length; j++) {
      const dataLine = lines[j].trim();
      // Only include rows that start with | and contain actual lesson data
      if (dataLine.startsWith('|') && 
          !dataLine.startsWith('|Phase') && 
          !dataLine.startsWith('|-') &&
          dataLine.length > 10) {
        lessonRows.push(dataLine);
      }
    }
    break;
  }
}

// Build output with header + separator + all lesson rows
const output = [headerLine, separatorLine, ...lessonRows].join('\n');

// Write to output files
writeFileSync('public/neuroverse-lessons-complete.txt', output, 'utf-8');
writeFileSync('public/neuroverse-lessons-complete-raw.txt', output, 'utf-8');

console.log(`✅ Extracted ${lessonRows.length} lessons`);
console.log('📝 Written to:');
console.log('  - public/neuroverse-lessons-complete.txt');
console.log('  - public/neuroverse-lessons-complete-raw.txt');

// Parse and display lesson numbers
const lessonNumbers: number[] = [];
lessonRows.forEach(row => {
  const columns = row.split('|').map(c => c.trim());
  const lessonNum = parseInt(columns[3]); // Column 3 is Lesson #
  if (!isNaN(lessonNum)) {
    lessonNumbers.push(lessonNum);
  }
});

console.log('\n📊 Lesson number range:', Math.min(...lessonNumbers), '-', Math.max(...lessonNumbers));
console.log('🔢 Total unique lessons:', new Set(lessonNumbers).size);

// Check for duplicates
const counts = new Map<number, number>();
lessonNumbers.forEach(num => counts.set(num, (counts.get(num) || 0) + 1));
const duplicates = Array.from(counts.entries()).filter(([_, count]) => count > 1);
if (duplicates.length > 0) {
  console.log('\n⚠️  Duplicates found:');
  duplicates.forEach(([num, count]) => console.log(`  Lesson ${num}: ${count} times`));
} else {
  console.log('\n✅ No duplicates found!');
}

// Check for missing lessons (1-96)
const missing: number[] = [];
for (let i = 1; i <= 96; i++) {
  if (!lessonNumbers.includes(i)) missing.push(i);
}
if (missing.length > 0) {
  console.log('\n⚠️  Missing lessons:', missing.join(', '));
} else {
  console.log('✅ All lessons 1-96 present!');
}
