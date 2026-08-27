const fs = require('fs');
let code = fs.readFileSync('src/TopicSelection.tsx', 'utf8');
code = code.replace(
  "<span>{!isPremium ? \100 / \\ : topicCount}</span>",
  "<span>{topicCount}</span>"
);
fs.writeFileSync('src/TopicSelection.tsx', code);
console.log('Reverted TopicSelection');