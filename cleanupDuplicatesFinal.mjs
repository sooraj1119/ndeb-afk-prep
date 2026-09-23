import fs from 'fs';
import path from 'path';

const questionsDir = path.resolve('public/questions');
const manifestPath = path.resolve('public/questions/manifest.json');
let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

function normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase()
               .replace(/[^\w\s]|_/g, '')
               .replace(/\s+/g, ' ')
               .trim();
}

const seenQuestions = new Set();
let removedCount = 0;

console.log("Running Final Global Deduplication (Including oral-pathology)...");

for (let topic of manifest) {
    const filePath = path.join(questionsDir, `${topic.id}.json`);
    if (fs.existsSync(filePath)) {
        let questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const originalLength = questions.length;
        
        const uniqueQuestions = [];
        for (const q of questions) {
            const normText = normalizeText(q.question);
            if (!seenQuestions.has(normText)) {
                seenQuestions.add(normText);
                uniqueQuestions.push(q);
            }
        }
        
        if (uniqueQuestions.length < originalLength) {
            const diff = originalLength - uniqueQuestions.length;
            removedCount += diff;
            console.log(`- ${topic.id}: Removed ${diff} duplicate(s)`);
            fs.writeFileSync(filePath, JSON.stringify(uniqueQuestions, null, 2));
            topic.count = uniqueQuestions.length;
        } else {
            console.log(`- ${topic.id}: Clean (0 duplicates)`);
        }
    }
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`\nFinal Deduplication Complete! Removed ${removedCount} duplicates.`);
