import fs from 'fs';
let s = fs.readFileSync('src/lib/storage.ts', 'utf8');
s = s.replace(
  '    if (diffDays === 1) {\n      data.currentStreak += 1;\n    } else if (diffDays > 1 || !data.lastVisitDate) {\n      data.currentStreak = 1;\n    }',
  '    if (diffDays === 1) {\n      data.currentStreak += 1;\n    } else if (diffDays > 1 || !data.lastVisitDate || isNaN(diffDays)) {\n      // isNaN guard: handles corrupted lastVisitDate strings\n      data.currentStreak = 1;\n    }'
);
fs.writeFileSync('src/lib/storage.ts', s);
console.log('Done:', s.includes('isNaN(diffDays)'));
