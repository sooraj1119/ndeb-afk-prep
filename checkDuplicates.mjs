import fs from 'fs';
import path from 'path';

const questionsDir = path.resolve('public/questions');
const manifestPath = path.resolve('public/questions/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

function normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase()
               .replace(/[^\w\s]|_/g, '')
               .replace(/\s+/g, ' ')
               .trim();
}

const seenQuestions = new Map();
const exactDuplicates = [];
let totalQuestionsChecked = 0;

console.log("Scanning all questions for exact duplicates (ignoring case/punctuation)...");

for (const topic of manifest) {
    const filePath = path.join(questionsDir, `${topic.id}.json`);
    if (fs.existsSync(filePath)) {
        const questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        totalQuestionsChecked += questions.length;
        
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const normText = normalizeText(q.question);
            
            if (seenQuestions.has(normText)) {
                const existing = seenQuestions.get(normText);
                exactDuplicates.push({
                    text: q.question,
                    topic1: existing.topicId,
                    topic2: topic.id
                });
            } else {
                seenQuestions.set(normText, {
                    topicId: topic.id,
                    originalText: q.question
                });
            }
        }
    }
}

console.log(`\nTotal questions scanned: ${totalQuestionsChecked}`);
console.log(`Total exact/near-exact duplicates found: ${exactDuplicates.length}`);

if (exactDuplicates.length > 0) {
    console.log("\nSample of duplicates found:");
    for (let i = 0; i < Math.min(15, exactDuplicates.length); i++) {
        const dup = exactDuplicates[i];
        console.log(`- "${dup.text.substring(0, 100)}..."`);
        console.log(`  (Found in: ${dup.topic1} AND ${dup.topic2})\n`);
    }
} else {
    console.log("\n?? Zero duplicates found across the entire database!");
}
