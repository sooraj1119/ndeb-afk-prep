const fs = require('fs');
let code = fs.readFileSync('src/Quiz.tsx', 'utf8');

const target = "const activeMock = getActiveMockExam();\n        if (activeMock && activeMock.questions.length > 0) {";
const replacement = "const activeMock = getActiveMockExam();\n        const isExpired = activeMock?.endTime ? (activeMock.endTime - Date.now()) <= 0 : false;\n        const isCompleted = activeMock ? activeMock.currentIndex >= activeMock.questions.length : false;\n        if (activeMock && activeMock.questions.length > 0 && !isExpired && !isCompleted) {";

const idx = code.indexOf(target);
if (idx !== -1) {
  code = code.substring(0, idx) + replacement + code.substring(idx + target.length);
  fs.writeFileSync('src/Quiz.tsx', code);
  console.log("Successfully patched activeMock check!");
} else {
  console.log("Target not found!");
}