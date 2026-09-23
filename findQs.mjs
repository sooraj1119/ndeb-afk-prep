import fs from 'fs';
import path from 'path';

const targetIds = [96, 106, 206, 138, 141, 210, 635958304, 948685465, 298794317, 827162358, 747041513, 396254695];
const questionsDir = path.resolve('public/questions');
const files = fs.readdirSync(questionsDir).filter(f => f.endsWith('.json') && f !== 'manifest.json');

const found = [];

for (const file of files) {
    const rawData = fs.readFileSync(path.join(questionsDir, file), 'utf8');
    let qList;
    try {
        qList = JSON.parse(rawData);
    } catch (e) {
        continue;
    }
    
    for (const q of qList) {
        if (targetIds.includes(q.id)) {
            found.push({ file, ...q });
        }
    }
}

for (const q of found) {
    console.log(`\n==================================================`);
    console.log(`ID: ${q.id} | Topic: ${q.file}`);
    console.log(`Q: ${q.question}`);
    console.log(`Options:`);
    q.options.forEach((opt, idx) => {
        const isCorrect = idx === q.correctAnswer ? "[CORRECT]" : "         ";
        console.log(`  ${isCorrect} ${idx}: ${opt}`);
    });
    console.log(`\nExplanation: ${q.explanation}`);
}
