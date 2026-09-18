import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const questionsDir = path.join(__dirname, '..', 'public', 'questions');
const outputFile = path.join(__dirname, '..', 'scratch', 'all_questions_export_v2.csv');

if (!fs.existsSync(path.join(__dirname, '..', 'scratch'))) {
    fs.mkdirSync(path.join(__dirname, '..', 'scratch'), { recursive: true });
}

let csvContent = `"Topic","Question ID","Question","Option A","Option B","Option C","Option D","Correct Answer","Explanation"\n`;

function escapeCSV(str) {
    if (str === undefined || str === null) return '""';
    const stringified = String(str);
    const escaped = stringified.replace(/"/g, '""');
    return `"` + escaped + `"`;
}

const files = fs.readdirSync(questionsDir).filter(f => f.endsWith('.json') && f !== 'manifest.json');
let count = 0;

for (const file of files) {
    const rawData = fs.readFileSync(path.join(questionsDir, file), 'utf-8');
    try {
        const questions = JSON.parse(rawData);
        for (const q of questions) {
            const topic = escapeCSV(q.topicId);
            const id = escapeCSV(q.id);
            const text = escapeCSV(q.question);
            const optA = escapeCSV(q.options && q.options[0] ? q.options[0] : '');
            const optB = escapeCSV(q.options && q.options[1] ? q.options[1] : '');
            const optC = escapeCSV(q.options && q.options[2] ? q.options[2] : '');
            const optD = escapeCSV(q.options && q.options[3] ? q.options[3] : '');
            
            const correctIndex = q.correctAnswer;
            let correctLetter = '';
            if (correctIndex === 0) correctLetter = 'A';
            else if (correctIndex === 1) correctLetter = 'B';
            else if (correctIndex === 2) correctLetter = 'C';
            else if (correctIndex === 3) correctLetter = 'D';
            
            const explanation = escapeCSV(q.explanation);

            csvContent += `${topic},${id},${text},${optA},${optB},${optC},${optD},${escapeCSV(correctLetter)},${explanation}\n`;
            count++;
        }
    } catch(e) {
        console.error("Error parsing", file);
    }
}

fs.writeFileSync(outputFile, csvContent);
console.log(`Successfully exported ${count} questions to ${outputFile}`);
