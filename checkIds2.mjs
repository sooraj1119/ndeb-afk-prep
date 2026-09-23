import fs from 'fs';
import path from 'path';

const targetIds = [
  "31", "77", "90", "137", "267", "124", "261", "325", "114", "222412820", "298548822",
  "30", "222", "313", "26", "65", "200", "255", "216", "240", "283", "332", "78", "288", "674142890", "338162163", "944059710", "254379682",
  "57", "88", "279", "187", "172", "176", "100", "322", "1", "269", "138", "89", "188", "27", "337", "3", "40", "154", "321", "74237598", "352874375", "453221541", "722002341", "122195801", "107010739", "109127117", "148", "276", "343",
  "33", "49", "349", "91", "97", "98126761", "623169638", "933315272", "558843357", "822196696", "719277676"
];

const questionsDir = path.resolve('public/questions');
const files = fs.readdirSync(questionsDir).filter(f => f.endsWith('.json') && f !== 'manifest.json');

const found = [];

for (const file of files) {
    const rawData = fs.readFileSync(path.join(questionsDir, file), 'utf8');
    let qList;
    try {
        qList = JSON.parse(rawData);
    } catch (e) {
        continue;
    }
    
    for (const q of qList) {
        if (targetIds.includes(String(q.id))) {
            found.push({ file, id: q.id });
        }
    }
}

console.log(`Found ${found.length} out of ${targetIds.length} target IDs in the database.`);
const breakdown = {};
found.forEach(item => {
    breakdown[item.file] = (breakdown[item.file] || 0) + 1;
});
console.log(breakdown);
