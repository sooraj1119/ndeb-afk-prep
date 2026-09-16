import fs from 'fs';
let content = fs.readFileSync('src/lib/storage.ts', 'utf8');

// Fix Ghost Mistakes
content = content.replace(
  'localStorage.removeItem(MOCK_EXAM_KEY); window.location.reload();',
  'localStorage.removeItem(MOCK_EXAM_KEY); localStorage.removeItem(MISTAKES_KEY); window.location.reload();'
);

// Fix Infinite History Memory Leak
content = content.replace(
  /const history = getHistory\(\);[\s\S]*?localStorage\.setItem\(HISTORY_KEY, JSON\.stringify\(history\)\);/,
  "let history = getHistory();\n    history.push({\n      topicId,\n      score,\n      total,\n      timestamp: Date.now()\n    });\n    if (history.length > 1000) history = history.slice(history.length - 1000);\n    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));"
);

fs.writeFileSync('src/lib/storage.ts', content);
console.log('Successfully patched storage.ts');
