import { readFileSync, writeFileSync } from 'fs';

console.log('📖 Reading parsed Excel document...');
const content = readFileSync('tool-results://document--parse_document/20251125-203303-722564', 'utf-8');
const lines = content.split('\n');

console.log(`Total lines in parsed document: ${lines.length}`);

// Extract lines 5-102 (0-indexed as 4-101)
// Line 5 = header, Line 6 = separator, Lines 7-102 = data
const tableLines = lines.slice(4, 102);

const output = tableLines.join('\n');

console.log(`📝 Writing ${tableLines.length} lines to public/neuroverse-lessons-complete-raw.txt...`);
writeFileSync('public/neuroverse-lessons-complete-raw.txt', output, 'utf-8');

console.log('✅ Done! File written successfully.');
console.log(`First line preview: ${tableLines[0].substring(0, 100)}...`);
console.log(`Last line preview: ${tableLines[tableLines.length - 1].substring(0, 100)}...`);
