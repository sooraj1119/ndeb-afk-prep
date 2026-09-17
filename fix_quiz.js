const fs = require('fs');
let code = fs.readFileSync('src/Quiz.tsx', 'utf8');

code = code.replace(
  "import { getQuestions, loadTopicQuestions } from './lib/questionsStore';",
  "import { getQuestions, loadTopicQuestions, loadAllQuestions } from './lib/questionsStore';"
);

code = code.replace(/const store = await import\('\.\/lib\/questionsStore'\);\s*await store\.loadAllQuestions\(\);/g, 'await loadAllQuestions();');
code = code.replace(/const allQs = store\.getQuestions\(\);/g, 'const allQs = getQuestions();');

fs.writeFileSync('src/Quiz.tsx', code);
console.log('Quiz.tsx updated successfully.');
