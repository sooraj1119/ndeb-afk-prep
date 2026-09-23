import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const questionsDir = path.join(__dirname, '..', 'public', 'questions');
const outputCSV = path.join(__dirname, '..', 'scratch', 'strict_flagged_questions.csv');

const files = fs.readdirSync(questionsDir).filter(f => f.endsWith('.json') && f !== 'manifest.json');

// Extremely basic English stop words to ignore during overlap scoring
const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
    'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will',
    'with', 'which', 'this', 'but', 'not', 'or', 'all', 'any', 'both', 'each', 'few',
    'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'only', 'own', 'same', 'so',
    'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'option', 'options',
    'incorrect', 'correct', 'answer', 'true', 'false', 'statement', 'statements'
]);

function tokenize(text) {
    if (!text) return [];
    // Convert to lowercase, remove punctuation, split by whitespace
    return text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ").split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
}

function calculateOverlap(optionText, explanationText) {
    const optionTokens = tokenize(optionText);
    const explanationTokens = new Set(tokenize(explanationText));
    
    if (optionTokens.length === 0) return 0;
    
    let matchCount = 0;
    for (const token of optionTokens) {
        if (explanationTokens.has(token)) {
            matchCount++;
        }
    }
    
    // Return percentage overlap
    return matchCount / optionTokens.length;
}

let totalChecked = 0;
let flagged = [];

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

    for (const q of questions) {
        if (!q.options || q.options.length < 4 || q.correctAnswer == null || !q.explanation) continue;
        totalChecked++;
        
        const scores = [];
        for (let i = 0; i < 4; i++) {
            scores.push({
                index: i,
                score: calculateOverlap(q.options[i], q.explanation)
            });
        }
        
        // Sort scores descending
        scores.sort((a, b) => b.score - a.score);
        
        const bestScoreIndex = scores[0].index;
        const correctScoreValue = scores.find(s => s.index === q.correctAnswer).score;
        const bestScoreValue = scores[0].score;
        
        // If the designated "correct answer" has zero overlap with the explanation,
        // BUT another option has a high overlap (>0.5), it is mathematically highly suspicious!
        if (correctScoreValue === 0 && bestScoreValue > 0.5) {
            flagged.push({
                topic: q.topicId,
                id: q.id,
                currentAnswerIndex: q.correctAnswer,
                suspectedAnswerIndex: bestScoreIndex,
                question: q.question,
                explanation: q.explanation,
                currentOptionText: q.options[q.correctAnswer],
                suspectedOptionText: q.options[bestScoreIndex],
                correctScore: correctScoreValue,
                bestScore: bestScoreValue
            });
        }
    }
}

// Write flagged items to CSV
if (flagged.length > 0) {
    let csv = `"Topic","Question ID","Current Ans Index","Suspected Ans Index","Correct Score","Best Score","Current Option Text","Suspected Option Text","Question","Explanation"\n`;
    for (const f of flagged) {
        csv += `${escapeCSV(f.topic)},${escapeCSV(f.id)},${f.currentAnswerIndex},${f.suspectedAnswerIndex},${f.correctScore.toFixed(2)},${f.bestScore.toFixed(2)},${escapeCSV(f.currentOptionText)},${escapeCSV(f.suspectedOptionText)},${escapeCSV(f.question)},${escapeCSV(f.explanation)}\n`;
    }
    fs.writeFileSync(outputCSV, csv);
} else {
    // Write empty CSV with headers if nothing found
    let csv = `"Topic","Question ID","Current Ans Index","Suspected Ans Index","Correct Score","Best Score","Current Option Text","Suspected Option Text","Question","Explanation"\n`;
    csv += `"NONE FOUND","","","","","","","","",""\n`;
    fs.writeFileSync(outputCSV, csv);
}

console.log(`\nSemantic Verification Complete!`);
console.log(`Total questions deep-checked: ${totalChecked}`);
console.log(`Mathematically suspicious questions flagged: ${flagged.length}`);
if (flagged.length > 0) {
    console.log(`Review the flagged questions at: ${outputCSV}`);
}
