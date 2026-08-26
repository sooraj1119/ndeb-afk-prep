import fs from 'fs';
let code = fs.readFileSync('src/TopicSelection.tsx', 'utf8');

code = code.replace(
  /const dueIds = getDueSRSQuestions\(\);\n\s*setDueReviewCount\(dueIds\.length\);/g,
  "const dueIds = getDueSRSQuestions();\n    setDueReviewCount(dueIds.length);\n    setMistakesCount(getMistakes().length);"
);

fs.writeFileSync('src/TopicSelection.tsx', code, 'utf8');