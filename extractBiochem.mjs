import fs from 'fs';
import path from 'path';

const targetIds = ["39", "40", "111", "133", "143", "190", "371", "439", "448", "750790537"];

const dbPath = path.resolve('public/questions/biochemistry.json');
const rawData = fs.readFileSync(dbPath, 'utf8');
const questions = JSON.parse(rawData);

const found = questions.filter(q => targetIds.includes(String(q.id)));

let output = "# Biochemistry Audit Dump\n\n";
for (const q of found) {
    output += `### ID: ${q.id}\n`;
    output += `**Q:** ${q.question}\n`;
    q.options.forEach((opt, idx) => {
        const isCorrect = idx === q.correctAnswer ? "[CORRECT]" : "         ";
        output += `- ${isCorrect} ${idx}: ${opt}\n`;
    });
    output += `\n**Exp:** ${q.explanation}\n\n---\n\n`;
}

fs.writeFileSync(path.resolve('scratch/biochem_audit.md'), output);
console.log(`Extracted ${found.length} questions to scratch/biochem_audit.md`);
