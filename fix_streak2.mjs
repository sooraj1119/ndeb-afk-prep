import fs from 'fs';
let s = fs.readFileSync('src/lib/storage.ts', 'utf8');
// Find and replace with regex to handle CRLF
s = s.replace(
  /if \(diffDays === 1\) \{\r?\n\s+data\.currentStreak \+= 1;\r?\n\s+\} else if \(diffDays > 1 \|\| !data\.lastVisitDate\) \{\r?\n\s+data\.currentStreak = 1;\r?\n\s+\}/,
  `if (diffDays === 1) {\n      data.currentStreak += 1;\n    } else if (diffDays > 1 || !data.lastVisitDate || isNaN(diffDays)) {\n      // isNaN guard: handles corrupted lastVisitDate strings\n      data.currentStreak = 1;\n    }`
);
fs.writeFileSync('src/lib/storage.ts', s);
console.log('isNaN applied:', s.includes('isNaN(diffDays)'));
