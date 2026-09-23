import fs from 'fs';
import path from 'path';

const targetIds = [
  "712673317", "891158485", "527921325", "149863299", "735767533", "605672127", "830648702", "697834305", "162258445", "898205538", "731435354", "339731577", "601615015", "837141278", "427189835", "19691111", "296303972", "645651181", "387045230", "145720100", "194076548", "613251709", "270099821", "278559189", "104688080",
  "31", "77", "90", "137", "267", "124", "261", "325", "114", "222412820", "298548822",
  "30", "222", "313", "26", "65", "200", "255", "216", "240", "283", "332", "78", "288", "674142890", "338162163", "944059710", "254379682",
  "57", "88", "279", "187", "172", "176", "100", "322", "1", "269", "138", "89", "188", "27", "337", "3", "40", "154", "321", "74237598", "352874375", "453221541", "722002341", "122195801", "107010739", "109127117", "148", "276", "343",
  "33", "49", "349", "91", "97", "98126761", "623169638", "933315272", "558843357", "822196696", "719277676"
];

const dbPath = path.resolve('public/questions/anesthesia.json');
const rawData = fs.readFileSync(dbPath, 'utf8');
const questions = JSON.parse(rawData);

const originalLength = questions.length;
const cleanedQuestions = questions.filter(q => !targetIds.includes(String(q.id)));
const removedCount = originalLength - cleanedQuestions.length;

fs.writeFileSync(dbPath, JSON.stringify(cleanedQuestions, null, 2));

const manifestPath = path.resolve('public/questions/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.anesthesia) {
    manifest.anesthesia = cleanedQuestions.length;
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`Original count: ${originalLength}`);
console.log(`Cleaned count: ${cleanedQuestions.length}`);
console.log(`Successfully purged ${removedCount} hallucinated anesthesia questions!`);
