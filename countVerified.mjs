import fs from 'fs';
import path from 'path';

const questionsDir = path.resolve('public/questions');
const manifestPath = path.resolve('public/questions/manifest.json');
let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

let verifiedCount = 0;
let totalCount = 0;

for (let topic of manifest) {
    const filePath = path.join(questionsDir, `${topic.id}.json`);
    if (fs.existsSync(filePath)) {
        let questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        totalCount += questions.length;
        
        for (const q of questions) {
            if (q.aiVerified === true) {
                verifiedCount++;
            }
        }
    }
}

console.log(`Total questions in DB: ${totalCount}`);
console.log(`Medically Verified so far: ${verifiedCount}`);
