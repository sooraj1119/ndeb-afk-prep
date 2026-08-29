const fs = require('fs');
const content = fs.readFileSync('src/Quiz.tsx', 'utf8');

const nextIndex = content.indexOf('const handleNext = () => {');
console.log(content.substring(nextIndex - 200, nextIndex + 50));