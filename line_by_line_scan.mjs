import fs from 'fs';

const files = fs.readdirSync('public/questions').filter(f => f.endsWith('.json') && f !== 'manifest.json');

let allQuestions = [];
for (const file of files) {
  const data = JSON.parse(fs.readFileSync('public/questions/' + file, 'utf-8'));
  for (const q of data) {
      allQuestions.push({
          file: file,
          id: q.id,
          question: q.question.trim(),
          options: q.options.map(o => o.trim()),
          explanation: q.explanation.trim()
      });
  }
}

console.log('Running STRICT LINE-BY-LINE Analysis on ' + allQuestions.length + ' records...');

let exactFullRecordDuplicates = [];
let questionTextCollisions = [];
let checked = 0;

for (let i = 0; i < allQuestions.length; i++) {
    for (let j = i + 1; j < allQuestions.length; j++) {
        const q1 = allQuestions[i];
        const q2 = allQuestions[j];
        
        // Line 1: Question text
        if (q1.question.toLowerCase() === q2.question.toLowerCase()) {
            
            // Check remaining lines (options + explanation)
            let optionsMatch = true;
            for(let o=0; o<4; o++) {
                if (q1.options[o].toLowerCase() !== q2.options[o].toLowerCase()) {
                    optionsMatch = false;
                    break;
                }
            }
            
            let explanationMatch = (q1.explanation.toLowerCase() === q2.explanation.toLowerCase());
            
            if (optionsMatch && explanationMatch) {
                exactFullRecordDuplicates.push({q1, q2});
            } else {
                questionTextCollisions.push({q1, q2, optionsMatch, explanationMatch});
            }
        }
    }
    checked++;
    if (checked % 1000 === 0) console.log('Scanned ' + checked + ' / ' + allQuestions.length);
}

let report = 'STRICT LINE-BY-LINE ANALYSIS REPORT\n';
report += '===================================\n\n';
report += '1. EXACT FULL-RECORD DUPLICATES (Question + All Options + Explanation perfectly match)\n';
report += 'Total: ' + exactFullRecordDuplicates.length + '\n';
for (const d of exactFullRecordDuplicates) {
    report += ' -> Found in ' + d.q1.file + ' (ID: ' + d.q1.id + ') and ' + d.q2.file + ' (ID: ' + d.q2.id + ')\n';
}

report += '\n2. QUESTION TEXT COLLISIONS (Question matches, but Options or Explanation differ)\n';
report += 'Total: ' + questionTextCollisions.length + '\n';
for (let k = 0; k < Math.min(questionTextCollisions.length, 25); k++) {
    const d = questionTextCollisions[k];
    report += ' -> Question: ' + d.q1.question + '\n';
    report += '    Options Match: ' + d.optionsMatch + ' | Explanation Match: ' + d.explanationMatch + '\n';
    report += '    Files: ' + d.q1.file + ' vs ' + d.q2.file + '\n';
}

fs.writeFileSync('line_by_line_report.txt', report);
console.log('Line-by-line analysis complete. Found ' + exactFullRecordDuplicates.length + ' full duplicates and ' + questionTextCollisions.length + ' partial collisions.');
