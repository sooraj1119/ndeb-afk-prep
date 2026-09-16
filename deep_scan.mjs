import fs from 'fs';
const files = fs.readdirSync('public/questions').filter(f => f.endsWith('.json') && f !== 'manifest.json');

function normalize(text) {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

let allQuestions = [];
for (const file of files) {
  const data = JSON.parse(fs.readFileSync('public/questions/' + file, 'utf-8'));
  for (const q of data) {
      allQuestions.push({
          file: file,
          id: q.id,
          original: q.question,
          normalized: normalize(q.question)
      });
  }
}

const seen = new Map();
const duplicates = [];

for (const q of allQuestions) {
  if (seen.has(q.normalized)) {
      duplicates.push({
          original: q,
          duplicateOf: seen.get(q.normalized)
      });
  } else {
      seen.set(q.normalized, q);
  }
}

console.log('--- DEEP SCAN COMPLETE ---');
console.log('Total questions parsed: ' + allQuestions.length);
console.log('Duplicate clusters found: ' + duplicates.length);

if (duplicates.length > 0) {
    let report = 'Deep Scan Duplicate Report\n==========================\n\n';
    for (let i = 0; i < Math.min(duplicates.length, 25); i++) {
        const d = duplicates[i];
        report += 'DUPLICATE #' + (i+1) + ':\n';
        report += 'Question A (' + d.duplicateOf.file + ', ID: ' + d.duplicateOf.id + '): ' + d.duplicateOf.original + '\n';
        report += 'Question B (' + d.original.file + ', ID: ' + d.original.id + '): ' + d.original.original + '\n';
        report += '--------------------------------------------------------\n';
    }
    if (duplicates.length > 25) {
        report += '...and ' + (duplicates.length - 25) + ' more.\n';
    }
    fs.writeFileSync('duplicate_report.txt', report);
    console.log('Detailed report saved to duplicate_report.txt');
}
