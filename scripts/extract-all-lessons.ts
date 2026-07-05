import { readFileSync, writeFileSync } from 'fs';

// Read the parsed Excel document
const content = readFileSync('tool-results://document--parse_document/20251125-195239-281213', 'utf-8');
const lines = content.split('\n');

// Find the header and separator
let headerLine = '';
let separatorLine = '';
let dataLines: string[] = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  if (line.startsWith('|Phase|Section|Lesson #|')) {
    headerLine = line;
    separatorLine = lines[i + 1];
    // Collect all data rows after the separator
    for (let j = i + 2; j < lines.length; j++) {
      const dataLine = lines[j].trim();
      if (dataLine.startsWith('|') && !dataLine.startsWith('|Phase') && !dataLine.startsWith('|-')) {
        dataLines.push(dataLine);
      }
    }
    break;
  }
}

// Build the output markdown table
const outputLines = [headerLine, separatorLine, ...dataLines];
const output = outputLines.join('\n');

// Write to new file
writeFileSync('public/neuroverse-lessons-complete.txt', output, 'utf-8');
writeFileSync('public/neuroverse-lessons-complete-raw.txt', output, 'utf-8');

console.log(`Extracted ${dataLines.length} lessons`);
console.log('File written to: public/neuroverse-lessons-complete.txt');
