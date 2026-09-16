import fs from 'fs';

let quizContent = fs.readFileSync('src/Quiz.tsx', 'utf8');

// Patch useEffect Block
quizContent = quizContent.replace(
  /await store\.loadAllQuestions\(\);\s+qList = \[\.\.\.store\.getQuestions\(\)\]\.sort\(\(\) => Math\.random\(\) - 0\.5\)\.slice\(0, 100\);\s+const endTime = Date\.now\(\) \+ 9000 \* 1000;/g,
  `await store.loadAllQuestions();\n\n          let fullList = [...store.getQuestions()];\n          if (!getIsPremium()) {\n            const premiumIds = topics.filter(t => t.isPremiumOnly).map(t => t.id);\n            fullList = fullList.filter(q => !premiumIds.includes(q.topicId));\n          }\n          qList = fullList.sort(() => Math.random() - 0.5).slice(0, 100);\n\n          const endTime = Date.now() + 9000 * 1000;`
);

// Patch handleRestartMockExam
quizContent = quizContent.replace(
  /const qList = \[\.\.\.getQuestions\(\)\]\.sort\(\(\) => Math\.random\(\) - 0\.5\)\.slice\(0, 100\);\s+const endTime = Date\.now\(\) \+ 9000 \* 1000;/g,
  `let fullList = [...getQuestions()];\n    if (!getIsPremium()) {\n      const premiumIds = topics.filter(t => t.isPremiumOnly).map(t => t.id);\n      fullList = fullList.filter(q => !premiumIds.includes(q.topicId));\n    }\n    const qList = fullList.sort(() => Math.random() - 0.5).slice(0, 100);\n\n    const endTime = Date.now() + 9000 * 1000;`
);

fs.writeFileSync('src/Quiz.tsx', quizContent);
console.log('Quiz.tsx patched with Paywall filter!');
