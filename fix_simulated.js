const fs = require('fs');
let code = fs.readFileSync('src/Quiz.tsx', 'utf8');

// replace getQuestions() inside init
code = code.replace(
  "qList = [...getQuestions()].sort(() => Math.random() - 0.5).slice(0, 100);",
  "await import('./lib/questionsStore').then(m => m.loadAllQuestions());\n            qList = [...getQuestions()].sort(() => Math.random() - 0.5).slice(0, 100);"
);

// replace getQuestions() inside handleRestartMockExam
code = code.replace(
  "const handleRestartMockExam = () => {\n      clearActiveMockExam();\n      const qList = [...getQuestions()]",
  "const handleRestartMockExam = async () => {\n      clearActiveMockExam();\n      await import('./lib/questionsStore').then(m => m.loadAllQuestions());\n      const qList = [...getQuestions()]"
);

// handleRestartMockExam is bound to onClick, so it can be async.

fs.writeFileSync('src/Quiz.tsx', code);
console.log('Fixed Simulated Mode race condition');