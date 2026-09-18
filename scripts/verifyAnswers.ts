import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const questionsDir = path.join(__dirname, '..', 'public', 'questions');
const outputCSV = path.join(__dirname, '..', 'scratch', 'flagged_questions.csv');

const files = fs.readdirSync(questionsDir).filter(f => f.endsWith('.json') && f !== 'manifest.json');

let totalChecked = 0;
let autoFixed = 0;
let flagged = [];

// Strong regex to find explicit declarations of the correct answer in the explanation
const explicitPatterns = [
    /(?:option|answer|choice)\s+([A-D])\s+(?:is|is the)\s+(?:correct|right|true|best)/i,
    /(?:the\s+)?(?:correct|right|true|best)\s+(?:option|answer|choice)\s+(?:is|would be)\s+([A-D])/i,
    /Therefore,\s+(?:option\s+)?([A-D])\s+is/i,
    /^\s*([A-D])\s+is\s+(?:the\s+)?correct/i,
    /^\s*Option\s+([A-D])\s+is\s+(?:the\s+)?correct/i,
    /Both\s+[A-D]\s+and\s+[A-D]\s+are\s+incorrect.*leaving\s+([A-D])/i,
    /makes\s+(?:option\s+)?([A-D])\s+(?:the\s+)?correct/i
];

function letterToIndex(letter) {
    const l = letter.toUpperCase();
    if (l === 'A') return 0;
    if (l === 'B') return 1;
    if (l === 'C') return 2;
    if (l === 'D') return 3;
    return -1;
}

function indexToLetter(index) {
    if (index === 0) return 'A';
    if (index === 1) return 'B';
    if (index === 2) return 'C';
    if (index === 3) return 'D';
    return '?';
}

function escapeCSV(str) {
    if (str == null) return '""';
    return `"${String(str).replace(/"/g, '""')}"`;
}

for (const file of files) {
    const filePath = path.join(questionsDir, file);
    const rawData = fs.readFileSync(filePath, 'utf-8');
    let questions;
    try {
        questions = JSON.parse(rawData);
    } catch(e) {
        continue;
    }
    
    let fileModified = false;

    for (const q of questions) {
        totalChecked++;
        
        let foundLetter = null;
        let matchCount = 0;
        
        // Scan for explicit patterns
        for (const pattern of explicitPatterns) {
            const match = q.explanation.match(pattern);
            if (match && match[1]) {
                const letter = match[1].toUpperCase();
                if (['A', 'B', 'C', 'D'].includes(letter)) {
                    foundLetter = letter;
                    matchCount++;
                }
            }
        }
        
        // If we found a clear explicit declaration
        if (foundLetter) {
            const impliedIndex = letterToIndex(foundLetter);
            
            if (impliedIndex !== -1 && impliedIndex !== q.correctAnswer) {
                // We have a discrepancy! The explanation explicitly names a different option.
                // We will AUTO-FIX it since the explicit declaration is highly reliable.
                console.log(`[AUTO-FIX] Topic: ${q.topicId} | ID: ${q.id} | Explanation says ${foundLetter}, but index was ${indexToLetter(q.correctAnswer)}`);
                q.correctAnswer = impliedIndex;
                fileModified = true;
                autoFixed++;
            }
        } else {
            // If we couldn't find an explicit "Option X is correct", let's look for suspicious patterns
            // For example, the explanation starts by describing a different option.
            const firstWords = q.explanation.substring(0, 30).toUpperCase();
            
            let suspicious = false;
            let impliedSuspicion = '?';
            
            if (firstWords.includes('OPTION A') && q.correctAnswer !== 0) { suspicious = true; impliedSuspicion = 'A'; }
            if (firstWords.includes('OPTION B') && q.correctAnswer !== 1) { suspicious = true; impliedSuspicion = 'B'; }
            if (firstWords.includes('OPTION C') && q.correctAnswer !== 2) { suspicious = true; impliedSuspicion = 'C'; }
            if (firstWords.includes('OPTION D') && q.correctAnswer !== 3) { suspicious = true; impliedSuspicion = 'D'; }
            
            // Also flag if correct answer index is somehow out of bounds
            if (q.correctAnswer < 0 || q.correctAnswer > 3 || q.correctAnswer == null) {
                suspicious = true;
                impliedSuspicion = 'OOB';
            }
            
            if (suspicious) {
                flagged.push({
                    topic: q.topicId,
                    id: q.id,
                    question: q.question,
                    currentAnswer: indexToLetter(q.correctAnswer),
                    impliedSuspicion: impliedSuspicion,
                    explanation: q.explanation
                });
            }
        }
    }
    
    if (fileModified) {
        fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));
    }
}

// Write flagged items to CSV
if (flagged.length > 0) {
    let csv = `"Topic","Question ID","Current Answer","Suspected Answer","Question","Explanation"\n`;
    for (const f of flagged) {
        csv += `${escapeCSV(f.topic)},${escapeCSV(f.id)},${escapeCSV(f.currentAnswer)},${escapeCSV(f.impliedSuspicion)},${escapeCSV(f.question)},${escapeCSV(f.explanation)}\n`;
    }
    fs.writeFileSync(outputCSV, csv);
}

console.log(`\nVerification Complete!`);
console.log(`Total questions checked: ${totalChecked}`);
console.log(`Auto-fixed explicit mismatches: ${autoFixed}`);
console.log(`Ambiguous/Suspicious questions flagged for manual review: ${flagged.length}`);
if (flagged.length > 0) {
    console.log(`Review the flagged questions at: ${outputCSV}`);
}
