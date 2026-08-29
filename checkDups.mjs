import fs from 'fs';
import path from 'path';

const dir = './public/questions';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'manifest.json');

const seen = new Set();
let duplicates = 0;
let total = 0;

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  for (const q of data) {
    total++;
    const normalized = q.question.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(normalized)) {
      duplicates++;
    } else {
      seen.add(normalized);
    }
  }
}

console.log("Total questions checked:", total);
console.log("Total duplicates found:", duplicates);