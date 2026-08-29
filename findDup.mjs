import fs from 'fs';
import path from 'path';

const dir = './public/questions';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'manifest.json');

const seen = new Map();

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  for (const q of data) {
    const normalized = q.question.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(normalized)) {
      console.log("Found duplicate!");
      console.log("Original File:", seen.get(normalized));
      console.log("Duplicate File:", file);
      console.log("Question ID:", q.id);
      console.log("Question Text:", q.question);
    } else {
      seen.set(normalized, file);
    }
  }
}