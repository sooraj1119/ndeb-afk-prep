import fs from 'fs';

const files = fs.readdirSync('public/questions').filter(f => f.endsWith('.json') && f !== 'manifest.json');

let allQuestions = [];
for (const file of files) {
  const data = JSON.parse(fs.readFileSync('public/questions/' + file, 'utf-8'));
  for (const q of data) {
      allQuestions.push({ file: file, id: q.id, text: q.question, options: q.options });
  }
}

function getBigrams(str) {
    const words = str.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 0);
    const bigrams = new Set();
    for (let i = 0; i < words.length - 1; i++) {
        bigrams.add(words[i] + ' ' + words[i+1]);
    }
    return bigrams;
}

function jaccard(setA, setB) {
    if (setA.size === 0 && setB.size === 0) return 1;
    let intersection = 0;
    for (let item of setA) {
        if (setB.has(item)) intersection++;
    }
    return intersection / (setA.size + setB.size - intersection);
}

for (const q of allQuestions) {
    q.bigrams = getBigrams(q.text);
}

console.log('Total questions: ' + allQuestions.length);
console.log('Running Deep Semantic Jaccard Scan (Threshold: 75% similarity)...');

let duplicates = [];
let checked = 0;

for (let i = 0; i < allQuestions.length; i++) {
    for (let j = i + 1; j < allQuestions.length; j++) {
        // Fast pre-check: if size difference is massive, they aren't 75% similar
        const sizeA = allQuestions[i].bigrams.size;
        const sizeB = allQuestions[j].bigrams.size;
        if (sizeA === 0 || sizeB === 0) continue;
        if (Math.min(sizeA, sizeB) / Math.max(sizeA, sizeB) < 0.6) continue;

        const sim = jaccard(allQuestions[i].bigrams, allQuestions[j].bigrams);
        if (sim >= 0.75) {
            duplicates.push({ q1: allQuestions[i], q2: allQuestions[j], sim });
        }
    }
    checked++;
    if (checked % 1000 === 0) console.log('Scanned ' + checked + ' / ' + allQuestions.length);
}

console.log('Found ' + duplicates.length + ' highly similar questions.');
let report = 'Deep Semantic Jaccard Scan Report\n=================================\n\n';
for (let k = 0; k < Math.min(duplicates.length, 100); k++) {
    const d = duplicates[k];
    report += 'Similarity: ' + (d.sim * 100).toFixed(1) + '%\n';
    report += 'A (' + d.q1.file + '): ' + d.q1.text + '\n';
    report += 'B (' + d.q2.file + '): ' + d.q2.text + '\n';
    report += '------------------------\n';
}
fs.writeFileSync('proper_report.txt', report);
