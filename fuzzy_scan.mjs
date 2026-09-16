import fs from 'fs';
import levenshtein from 'fast-levenshtein';

const files = fs.readdirSync('public/questions').filter(f => f.endsWith('.json') && f !== 'manifest.json');

function normalize(text) {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

let allQuestions = [];
for (const file of files) {
  const data = JSON.parse(fs.readFileSync('public/questions/' + file, 'utf-8'));
  for (const q of data) {
      const norm = normalize(q.question);
      allQuestions.push({
          file: file,
          id: q.id,
          original: q.question,
          normalized: norm,
          len: norm.length
      });
  }
}

console.log('Total loaded: ' + allQuestions.length);
console.log('Running ultra-strict fuzzy scan (Levenshtein Distance <= 5)...');

let fuzzyDuplicates = [];
let checked = 0;

// Sort by length to optimize comparison window
allQuestions.sort((a, b) => a.len - b.len);

for (let i = 0; i < allQuestions.length; i++) {
    const q1 = allQuestions[i];
    
    // Only check forward in a small length window (e.g. +/- 5 chars)
    for (let j = i + 1; j < allQuestions.length; j++) {
        const q2 = allQuestions[j];
        if (q2.len - q1.len > 5) break; 
        
        // Exact match already caught, only look for near matches
        if (q1.normalized !== q2.normalized) {
            const distance = levenshtein.get(q1.normalized, q2.normalized);
            if (distance <= 5) { // 5 character typos allowed
                fuzzyDuplicates.push({q1, q2, distance});
            }
        }
    }
    
    checked++;
    if (checked % 2000 === 0) console.log('Scanned ' + checked + ' questions...');
}

console.log('--- ULTRA-STRICT FUZZY SCAN COMPLETE ---');
console.log('Near-duplicate typos found: ' + fuzzyDuplicates.length);
if (fuzzyDuplicates.length > 0) {
    for (let k = 0; k < Math.min(fuzzyDuplicates.length, 5); k++) {
        console.log('TYPO MATCH (Diff: ' + fuzzyDuplicates[k].distance + '):');
        console.log(' A: ' + fuzzyDuplicates[k].q1.original);
        console.log(' B: ' + fuzzyDuplicates[k].q2.original);
    }
}
