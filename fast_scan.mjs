import fs from 'fs';
const files = fs.readdirSync('public/questions').filter(f => f.endsWith('.json') && f !== 'manifest.json');
let allQuestions = [];
for (const file of files) {
  const data = JSON.parse(fs.readFileSync('public/questions/' + file, 'utf-8'));
  allQuestions.push(...data.map(q => q.question));
}
const unique = new Set();
let duplicates = 0;
for (const q of allQuestions) {
  if (unique.has(q)) {
    duplicates++;
  } else {
    unique.add(q);
  }
}
console.log('Deep Scan Complete.');
console.log('Total questions parsed: ' + allQuestions.length);
console.log('Duplicate questions found: ' + duplicates);
