import fs from 'fs';

let storage = fs.readFileSync('src/lib/storage.ts', 'utf8');

// Fix 1: Add ndeb_prep_exam_date to resetAllProgress
storage = storage.replace(
  "export const resetAllProgress = () => { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(FLAGS_KEY); localStorage.removeItem(SRS_KEY); localStorage.removeItem(GAMIFICATION_KEY); localStorage.removeItem(HISTORY_KEY); localStorage.removeItem(MOCK_EXAM_KEY); localStorage.removeItem(MISTAKES_KEY); window.location.reload(); };",
  "export const resetAllProgress = () => { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(FLAGS_KEY); localStorage.removeItem(SRS_KEY); localStorage.removeItem(GAMIFICATION_KEY); localStorage.removeItem(HISTORY_KEY); localStorage.removeItem(MOCK_EXAM_KEY); localStorage.removeItem(MISTAKES_KEY); localStorage.removeItem(EXAM_DATE_KEY); window.location.reload(); };"
);

// Fix 2: Handle NaN diffDays in logDailyVisit
storage = storage.replace(
  "    if (diffDays === 1) {\n      data.currentStreak += 1;\n    } else if (diffDays > 1 || !data.lastVisitDate) {\n      data.currentStreak = 1;\n    }",
  "    if (diffDays === 1) {\n      data.currentStreak += 1;\n    } else if (diffDays > 1 || !data.lastVisitDate || isNaN(diffDays)) {\n      // isNaN covers corrupted lastVisitDate values\n      data.currentStreak = 1;\n    }"
);

fs.writeFileSync('src/lib/storage.ts', storage);
console.log('Bugs fixed in storage.ts');
