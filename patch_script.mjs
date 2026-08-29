import fs from 'fs';

let content = fs.readFileSync('generateQuestions.mjs', 'utf8');
content = content.replace(
  'const newQuestions = JSON.parse(text);',
  \const newQuestions = JSON.parse(text);
        const existingTextSet = new Set(questions.map(q => q.question.toLowerCase().trim()));\
);
content = content.replace(
  'questions.push(...newQuestions);',
  \or (const q of newQuestions) {
          const normalized = q.question.toLowerCase().trim();
          if (!existingTextSet.has(normalized)) {
            existingTextSet.add(normalized);
            questions.push(q);
          } else {
            console.log("Skipping duplicate generated question.");
          }
        }\
);
fs.writeFileSync('generateQuestions.mjs', content);
console.log("Script patched");