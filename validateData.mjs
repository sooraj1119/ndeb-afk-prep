import fs from 'fs';
import path from 'path';

const dir = 'public/questions';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'manifest.json');

let totalIssues = 0;
let totalQuestions = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const textSet = new Set();
  
  let issues = 0;
  for (const q of data) {
    totalQuestions++;
    
    // Check schema
    if (typeof q.question !== 'string' || !q.question.trim()) {
      console.log([] ID : Invalid question text);
      issues++;
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      console.log([] ID : Doesn't have exactly 4 options);
      issues++;
    }
    if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
      console.log([] ID : Invalid correctAnswer \);
      issues++;
    }
    
    // Check for duplicates
    const normalized = q.question.toLowerCase().trim();
    if (textSet.has(normalized)) {
      console.log([] ID : DUPLICATE QUESTION TEXT);
      issues++;
    } else {
      textSet.add(normalized);
    }
  }
  if (issues > 0) {
    console.log(-- \ has \ issues.);
  }
  totalIssues += issues;
}

console.log(\nValidated \ questions across \ topics.);
if (totalIssues === 0) {
  console.log("SUCCESS: All questions pass strict rules!");
} else {
  console.log(FAILED: Found \ strict rule violations.);
}