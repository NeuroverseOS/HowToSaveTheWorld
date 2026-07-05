import { readFileSync } from 'fs';

const content = readFileSync('tool-results://document--parse_document/20251125-204134-556645', 'utf-8');
const lines = content.split('\n');

// Extract lesson numbers
const lessonNumbers: number[] = [];
for (let i = 7; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.startsWith('|') && !line.startsWith('|Phase') && !line.startsWith('|-')) {
    const columns = line.split('|').map(c => c.trim());
    const lessonNum = parseInt(columns[3]); // Column 3 is Lesson #
    if (!isNaN(lessonNum)) {
      lessonNumbers.push(lessonNum);
    }
  }
}

console.log(`✅ Total lessons found: ${lessonNumbers.length}`);
console.log(`📊 Range: ${Math.min(...lessonNumbers)} - ${Math.max(...lessonNumbers)}`);

// Check for duplicates
const counts = new Map<number, number>();
lessonNumbers.forEach(num => {
  counts.set(num, (counts.get(num) || 0) + 1);
});

const duplicates = Array.from(counts.entries())
  .filter(([_, count]) => count > 1)
  .map(([num, count]) => ({ num, count }));

if (duplicates.length > 0) {
  console.log('\n❌ DUPLICATES FOUND:');
  duplicates.forEach(d => console.log(`   Lesson ${d.num} appears ${d.count} times`));
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
  console.log('\n❌ MISSING LESSONS:', missing);
} else {
  console.log('✅ All lessons 1-96 present');
}

// Specifically check 69 and 70
const count69 = lessonNumbers.filter(n => n === 69).length;
const count70 = lessonNumbers.filter(n => n === 70).length;
console.log(`\n🔍 Lesson 69: ${count69} occurrence(s)`);
console.log(`🔍 Lesson 70: ${count70} occurrence(s)`);
