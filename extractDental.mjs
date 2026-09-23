import fs from 'fs';
import path from 'path';

const targetIds = ["275", "301", "405"];
const dbPath = path.resolve('public/questions/dental-materials.json');
const rawData = fs.readFileSync(dbPath, 'utf8');
const questions = JSON.parse(rawData);

const found = questions.filter(q => targetIds.includes(String(q.id)));

let output = "# Dental Materials Audit Dump\n\n";
for (const q of found) {
    output += `### ID: ${q.id}\n`;
    output += `**Q:** ${q.question}\n`;
    q.options.forEach((opt, idx) => {
        const isCorrect = idx === q.correctAnswer ? "[CORRECT]" : "         ";
        output += `- ${isCorrect} ${idx}: ${opt}\n`;
    });
    output += `\n**Exp:** ${q.explanation}\n\n---\n\n`;
}

fs.writeFileSync(path.resolve('scratch/dental_audit.md'), output);
console.log(`Extracted ${found.length} questions to scratch/dental_audit.md`);
