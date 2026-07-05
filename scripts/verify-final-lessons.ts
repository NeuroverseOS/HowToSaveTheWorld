import { readFileSync } from 'fs';

console.log('🔍 Verifying lesson data...\n');

const content = readFileSync('tool-results://document--parse_document/20251125-204447-152226', 'utf-8');
const lines = content.split('\n');

const lessonNumbers: number[] = [];
const lessonMap = new Map<number, number>();

// Parse all lesson numbers
for (let i = 7; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.startsWith('|') && !line.startsWith('|Phase') && !line.startsWith('|-')) {
    const columns = line.split('|').map(c => c.trim());
    const lessonNum = parseInt(columns[3]);
    if (!isNaN(lessonNum)) {
      lessonNumbers.push(lessonNum);
      lessonMap.set(lessonNum, (lessonMap.get(lessonNum) || 0) + 1);
    }
  }
}

console.log(`✅ Total lessons found: ${lessonNumbers.length}`);
console.log(`📊 Range: ${Math.min(...lessonNumbers)} - ${Math.max(...lessonNumbers)}\n`);

// Check duplicates
const duplicates = Array.from(lessonMap.entries())
  .filter(([_, count]) => count > 1)
  .map(([num, count]) => ({ num, count }));

if (duplicates.length > 0) {
  console.log('❌ DUPLICATES DETECTED:');
  duplicates.forEach(d => console.log(`   Lesson ${d.num} appears ${d.count} times`));
  console.log('');
} else {
  console.log('✅ No duplicates found!\n');
}

// Check missing
const missing: number[] = [];
for (let i = 1; i <= 96; i++) {
  if (!lessonNumbers.includes(i)) {
    missing.push(i);
  }
}

if (missing.length > 0) {
  console.log('❌ MISSING LESSONS:', missing);
} else {
  console.log('✅ All lessons 1-96 present!');
}

// Critical check: 69 and 70
console.log('\n🎯 CRITICAL CHECK:');
console.log(`   Lesson 69: ${lessonMap.get(69) || 0} occurrence(s)`);
console.log(`   Lesson 70: ${lessonMap.get(70) || 0} occurrence(s)`);

if (lessonMap.get(69) === 1 && lessonMap.get(70) === 1) {
  console.log('\n🎉 SUCCESS! Ready to import.');
} else {
  console.log('\n⚠️  Still have duplicates for 69 or 70!');
}
