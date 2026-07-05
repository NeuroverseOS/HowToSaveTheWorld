import { readFileSync, writeFileSync } from 'fs';

// Read the parsed Excel document
const content = readFileSync('tool-results://document--parse_document/20251125-203303-722564', 'utf-8');
const lines = content.split('\n');

// Extract the table (header on line 5, separator on line 6, data starts on line 7)
const headerLine = lines[4]; // Line 5 (0-indexed as 4)
const separatorLine = lines[5]; // Line 6 (0-indexed as 5)
const dataLines: string[] = [];

// Collect all data rows (lines 7 onwards)
for (let i = 6; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.startsWith('|') && !line.startsWith('|Phase') && !line.startsWith('|-')) {
    dataLines.push(line);
  }
}

// Build the output markdown table
const outputLines = [headerLine, separatorLine, ...dataLines];
const output = outputLines.join('\n');

// Write to file
writeFileSync('public/neuroverse-lessons-complete-raw.txt', output, 'utf-8');

console.log(`✅ Extracted ${dataLines.length} lessons`);
console.log('📁 File written to: public/neuroverse-lessons-complete-raw.txt');

// Verify lesson numbers
const lessonNumbers: number[] = [];
dataLines.forEach(line => {
  const columns = line.split('|').map(c => c.trim());
  const lessonNum = parseInt(columns[3]); // Column 3 is Lesson #
  if (!isNaN(lessonNum)) {
    lessonNumbers.push(lessonNum);
  }
});

console.log(`📊 Lesson range: ${Math.min(...lessonNumbers)} - ${Math.max(...lessonNumbers)}`);
console.log(`📈 Total unique lessons: ${new Set(lessonNumbers).size}`);

// Check for duplicates
const counts = new Map<number, number>();
lessonNumbers.forEach(num => {
  counts.set(num, (counts.get(num) || 0) + 1);
});

const duplicates = Array.from(counts.entries())
  .filter(([_, count]) => count > 1)
  .map(([num]) => num);

if (duplicates.length > 0) {
  console.log('⚠️  Duplicates found:', duplicates);
} else {
  console.log('✅ No duplicates detected');
}

// Check for missing lessons
const missing: number[] = [];
for (let i = 1; i <= 96; i++) {
  if (!lessonNumbers.includes(i)) {
    missing.push(i);
  }
}

if (missing.length > 0) {
  console.log('⚠️  Missing lessons:', missing);
} else {
  console.log('✅ All lessons 1-96 present');
}
