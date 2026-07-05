import { readFileSync } from 'fs';

const content = readFileSync('tool-results://document--parse_document/20251125-195239-281213', 'utf-8');
const lines = content.split('\n');

// Find all lesson numbers from the markdown table
const lessonNumbers: number[] = [];
for (const line of lines) {
  if (line.startsWith('|') && !line.startsWith('|Phase') && !line.startsWith('|-')) {
    const columns = line.split('|').map(c => c.trim());
    // Column 3 (index 3) is Lesson #
    const lessonNum = parseInt(columns[3]);
    if (!isNaN(lessonNum)) {
      lessonNumbers.push(lessonNum);
    }
  }
}

console.log('Total lessons found:', lessonNumbers.length);
console.log('Lesson numbers:', lessonNumbers.sort((a, b) => a - b));

// Find duplicates
const counts = new Map<number, number>();
lessonNumbers.forEach(num => {
  counts.set(num, (counts.get(num) || 0) + 1);
});

const duplicates = Array.from(counts.entries())
  .filter(([_, count]) => count > 1)
  .map(([num, count]) => ({ num, count }));

console.log('\nDuplicates found:', duplicates);

// Find missing numbers from 1-96
const missing: number[] = [];
for (let i = 1; i <= 96; i++) {
  if (!lessonNumbers.includes(i)) {
    missing.push(i);
  }
}

console.log('\nMissing numbers (1-96):', missing);
