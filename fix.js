const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'questions', 'anatomy.json');
const rawData = fs.readFileSync(filePath, 'utf-8');
const questions = JSON.parse(rawData);

let fixed = 0;
for (const q of questions) {
    if (q.question && q.question.includes('arrangement of dental tissues from the external surface to the pulp chamber')) {
        q.correctAnswer = 2; // Option C
        fixed++;
    }
}

fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));
console.log(`Fixed ${fixed} questions in anatomy.json`);
