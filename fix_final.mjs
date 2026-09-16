import fs from 'fs';
let s = fs.readFileSync('src/lib/storage.ts', 'utf8');

// Fix logMistake - add try/catch
s = s.replace(
  /export const logMistake = \(questionId: any\) => \{\n  let mistakes = getMistakes\(\);\n  const exists = mistakes\.some\(id => String\(id\) === String\(questionId\)\);\n  if \(!exists\) \{\n    mistakes\.push\(questionId\);\n    mistakes = Array\.from\(new Set\(mistakes\)\);\n    localStorage\.setItem\(MISTAKES_KEY, JSON\.stringify\(mistakes\)\);\n  \}\n\};/,
  `export const logMistake = (questionId: any) => {\n  try {\n    let mistakes = getMistakes();\n    const exists = mistakes.some(id => String(id) === String(questionId));\n    if (!exists) {\n      mistakes.push(questionId);\n      mistakes = Array.from(new Set(mistakes));\n      localStorage.setItem(MISTAKES_KEY, JSON.stringify(mistakes));\n    }\n  } catch (e) { console.error('Failed to log mistake:', e); }\n};`
);

// Fix removeMistake - add try/catch
s = s.replace(
  /export const removeMistake = \(questionId: any\) => \{\n  let mistakes = getMistakes\(\);\n  const updated = mistakes\.filter\(id => String\(id\) !== String\(questionId\)\);\n  localStorage\.setItem\(MISTAKES_KEY, JSON\.stringify\(Array\.from\(new Set\(updated\)\)\)\);\n\};/,
  `export const removeMistake = (questionId: any) => {\n  try {\n    let mistakes = getMistakes();\n    const updated = mistakes.filter(id => String(id) !== String(questionId));\n    localStorage.setItem(MISTAKES_KEY, JSON.stringify(Array.from(new Set(updated))));\n  } catch (e) { console.error('Failed to remove mistake:', e); }\n};`
);

fs.writeFileSync('src/lib/storage.ts', s);
const result = s.includes("Failed to log mistake") && s.includes("Failed to remove mistake");
console.log('logMistake and removeMistake try/catch added:', result);
